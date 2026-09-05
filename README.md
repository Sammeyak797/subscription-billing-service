# Subscription & Billing Service

A production-oriented, multi-tenant subscription and billing backend built with **NestJS, PostgreSQL, Redis, BullMQ, TypeORM, and Docker**.

The service manages subscription plans, tenants, subscriptions, invoices, plan changes, proration, and asynchronous payment events. It uses Redis for caching and rate limiting, PostgreSQL for persistent transactional data, and BullMQ for reliable background payment-event processing.

---

## Features

- Multi-tenant subscription management
- Subscription plan management
- Invoice generation and billing periods
- Subscription cancellation
- Subscription plan upgrades and downgrades
- Proration calculation for plan changes
- PostgreSQL persistence with TypeORM
- PostgreSQL transactions for billing operations
- Redis-backed active-plan caching
- API rate limiting
- Payment webhook ingestion
- Idempotent payment event processing
- BullMQ asynchronous payment processing
- Payment success/failure state transitions
- Duplicate webhook protection
- Health-check endpoint
- Graceful application shutdown
- Dockerized development and deployment environment
- Automated unit and end-to-end testing
- Concurrent API load testing

---

## Architecture

```text
                         ┌─────────────────────┐
                         │       Client        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    NestJS REST API  │
                         │                     │
                         │ Validation          │
                         │ Rate Limiting       │
                         │ Business Logic      │
                         └──────┬───────┬──────┘
                                │       │
                   ┌────────────┘       └─────────────┐
                   ▼                                  ▼
          ┌─────────────────┐                ┌─────────────────┐
          │   PostgreSQL    │                │      Redis      │
          │                 │                │                 │
          │ Tenants         │                │ Plan Cache      │
          │ Plans           │                │ Rate Limiting   │
          │ Subscriptions   │                │ BullMQ Backend  │
          │ Invoices        │                │                 │
          │ Payment Events  │                └────────┬────────┘
          └─────────────────┘                         │
                                                      ▼
                                             ┌─────────────────┐
                                             │     BullMQ      │
                                             │ Payment Queue   │
                                             └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Payment Worker  │
                                             │                 │
                                             │ PAID / FAILED   │
                                             └─────────────────┘
```

---

## Technology Stack

| Category         | Technology                          |
| ---------------- | ----------------------------------- |
| Backend          | NestJS                              |
| Language         | TypeScript                          |
| Database         | PostgreSQL 16                       |
| ORM              | TypeORM                             |
| Cache            | Redis 7                             |
| Job Queue        | BullMQ                              |
| Validation       | class-validator / class-transformer |
| Rate Limiting    | NestJS Throttler                    |
| Testing          | Jest / Supertest                    |
| Containerization | Docker / Docker Compose             |
| Runtime          | Node.js                             |
| API              | REST                                |

---

## Core Domain Model

```text
Tenant
  │
  └── Subscription
         │
         ├── Plan
         │
         └── Invoice
                 │
                 └── PaymentEvent
```

### Tenant

Represents an organization using the billing platform.

Fields include:

- `id`
- `name`
- `slug`
- `active`
- `createdAt`
- `updatedAt`

Tenant slugs are unique.

---

### Plan

Represents a subscription offering.

Fields include:

- `id`
- `name`
- `price`
- `currency`
- `billingIntervalDays`
- `active`
- `createdAt`
- `updatedAt`

Prices are stored as integer monetary values to avoid floating-point precision issues.

---

### Subscription

Connects a tenant to a billing plan.

Supported states:

```text
TRIALING
ACTIVE
CANCELLED
EXPIRED
```

A tenant cannot create another active subscription while an existing active subscription is present.

---

### Invoice

Represents a billing period for a subscription.

Supported states:

```text
PENDING
PAID
FAILED
VOID
```

Invoice records snapshot the plan amount and currency at creation time. This prevents historical invoices from changing when a plan's current price is modified.

---

### Payment Event

Represents an incoming payment-provider event.

Each payment event contains:

- `eventId`
- `type`
- `invoiceId`
- `createdAt`

`eventId` is unique, allowing duplicate webhook events to be rejected.

---

# Billing Flow

A typical billing workflow looks like:

```text
1. Create tenant
        ↓
2. Create plan
        ↓
3. Create subscription
        ↓
4. Generate invoice
        ↓
5. Payment provider sends webhook
        ↓
6. API validates webhook
        ↓
7. Payment event stored
        ↓
8. Event added to BullMQ
        ↓
9. Background worker processes event
        ↓
10. Invoice marked PAID / FAILED
```

Payment processing is asynchronous so the webhook endpoint does not need to perform the complete payment state transition synchronously.

---

# Idempotent Payment Processing

Payment providers can retry webhook delivery.

Without idempotency, the same payment event could potentially be processed multiple times.

This service protects against duplicate events using a unique `eventId`.

```text
Payment Webhook
      │
      ▼
Check eventId
      │
      ├── Already exists ──► Reject duplicate
      │
      └── New event
              │
              ▼
       Store PaymentEvent
              │
              ▼
       Add BullMQ Job
              │
              ▼
       Process Payment
```

Example webhook:

```json
{
  "eventId": "evt_payment_001",
  "type": "payment.succeeded",
  "invoiceId": "invoice-uuid"
}
```

A repeated request with the same `eventId` is rejected rather than processed again.

---

# Asynchronous Payment Processing

Payment events are placed onto a BullMQ queue:

```text
POST /webhooks/payments
        │
        ▼
   NestJS API
        │
        ▼
 payment-events
      queue
        │
        ▼
PaymentProcessor
        │
        ├── payment.succeeded
        │        ↓
        │     Invoice PAID
        │
        └── payment.failed
                 ↓
             Invoice FAILED
```

The queue uses retry handling with exponential backoff to improve resilience against transient processing failures.

---

# Redis

Redis is used for two major responsibilities.

## Plan caching

Active plans are cached using:

```text
plans:active
```

The service checks Redis before querying PostgreSQL for active plans.

```text
GET /plans
     │
     ▼
Redis Cache
     │
     ├── HIT ──► Return cached plans
     │
     └── MISS
           │
           ▼
       PostgreSQL
           │
           ▼
       Store in Redis
           │
           ▼
       Return plans
```

When a plan is created, the active-plan cache is invalidated to prevent stale plan data.

---

## Rate Limiting

The API uses NestJS Throttler with a configured request limit to protect endpoints from excessive traffic.

This provides a basic layer of protection against accidental or abusive request bursts.

---

# Subscription Proration

When changing an active subscription's plan, the service calculates the remaining value of the current plan and the remaining value of the new plan.

For upgrades, the difference is charged as a prorated amount.

Example:

```text
Old plan:          ₹499
New plan:          ₹999
Remaining period:  50%

Old remaining value = ₹249.50
New remaining value = ₹499.50

Proration charge = ₹250.00
```

Downgrades currently result in a zero immediate charge rather than generating a credit.

The calculation is performed using integer paise internally to avoid floating-point monetary errors.

---

# Transactions

Billing-related persistence uses PostgreSQL transactions through TypeORM.

Example conceptual flow:

```text
BEGIN TRANSACTION

Create billing record
Validate required state
Persist invoice

COMMIT
```

If an operation fails, the transaction can be rolled back rather than leaving partially persisted billing state.

---

# API Reference

## Plans

### Create Plan

```http
POST /plans
```

Example:

```json
{
  "name": "Pro",
  "price": 999,
  "currency": "INR",
  "billingIntervalDays": 30
}
```

### Get Plans

```http
GET /plans
```

### Get Plan Count

```http
GET /plans/count
```

---

## Tenants

### Create Tenant

```http
POST /tenants
```

Example:

```json
{
  "name": "Acme Corporation",
  "slug": "acme"
}
```

### Get Tenant

```http
GET /tenants/:id
```

---

## Subscriptions

### Create Subscription

```http
POST /subscriptions
```

Example:

```json
{
  "tenantId": "tenant-uuid",
  "planId": "plan-uuid"
}
```

### Get Subscription

```http
GET /subscriptions/:id
```

### Cancel Subscription

```http
POST /subscriptions/:id/cancel
```

### Change Subscription Plan

```http
POST /subscriptions/:id/change-plan
```

Example:

```json
{
  "newPlanId": "new-plan-uuid"
}
```

The response includes the calculated prorated amount.

---

## Invoices

### Generate Invoice

```http
POST /invoices/:subscriptionId
```

### Get Invoice

```http
GET /invoices/:id
```

### Get Tenant Invoices

```http
GET /invoices/tenant/:tenantId
```

---

## Payment Webhooks

### Receive Payment Event

```http
POST /webhooks/payments
```

Example:

```json
{
  "eventId": "evt_payment_001",
  "type": "payment.succeeded",
  "invoiceId": "invoice-uuid"
}
```

The API queues the event for asynchronous processing.

Supported event types:

```text
payment.succeeded
payment.failed
```

---

## Health Check

```http
GET /health
```

The endpoint verifies application health and PostgreSQL connectivity.

Example:

```json
{
  "status": "ok"
}
```

---

# Project Structure

```text
subscription-billing-service/
│
├── src/
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   │
│   ├── invoices/
│   │   ├── dto/
│   │   ├── invoice.entity.ts
│   │   ├── invoices.controller.ts
│   │   ├── invoices.module.ts
│   │   └── invoices.service.ts
│   │
│   ├── jobs/
│   │   ├── payment-event.entity.ts
│   │   ├── payment.processor.ts
│   │   ├── payment-webhook.dto.ts
│   │   └── ...
│   │
│   ├── plans/
│   │   ├── dto/
│   │   ├── plan.entity.ts
│   │   ├── plans.controller.ts
│   │   ├── plans.module.ts
│   │   └── plans.service.ts
│   │
│   ├── subscriptions/
│   │   ├── dto/
│   │   ├── proration.util.ts
│   │   ├── subscription.entity.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.module.ts
│   │   └── subscriptions.service.ts
│   │
│   ├── tenants/
│   │   ├── dto/
│   │   ├── tenant.entity.ts
│   │   ├── tenants.controller.ts
│   │   ├── tenants.module.ts
│   │   └── tenants.service.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── scripts/
│   └── load-test.js
│
├── test/
│   └── ...
│
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# Environment Variables

Create a `.env` file locally based on `.env.example`.

```env
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=billing_user
DATABASE_PASSWORD=billing_password
DATABASE_NAME=subscription_billing

REDIS_HOST=localhost
REDIS_PORT=6379
```

The `.env` file is intentionally excluded from Git.

---

# Running Locally

## Prerequisites

Install:

- Node.js
- npm
- Docker
- Docker Compose

---

## Install Dependencies

```bash
npm install
```

---

## Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

Verify:

```bash
docker compose ps
```

---

## Start the API

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

---

# Running the Complete Stack with Docker

Build and start everything:

```bash
docker compose up -d --build
```

Check containers:

```bash
docker compose ps
```

Expected services:

```text
subscription-billing-postgres
subscription-billing-redis
subscription-billing-api
```

View API logs:

```bash
docker compose logs api
```

Stop the stack:

```bash
docker compose down
```

To restart without deleting persisted data:

```bash
docker compose up -d
```

---

# Testing

Run unit tests:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Run test coverage:

```bash
npm run test:cov
```

The test suite covers important billing behavior including subscription and proration logic and API workflows.

---

# Performance Testing

A lightweight Node.js concurrent load-test script is included at:

```text
scripts/load-test.js
```

Run:

```bash
node scripts/load-test.js
```

The benchmark was executed against:

```text
GET /plans
```

with:

```text
Total requests: 100
Concurrency: 20
```

Measured results:

| Metric              |   Result |
| ------------------- | -------: |
| Total requests      |      100 |
| Successful requests |      100 |
| Failed requests     |        0 |
| Success rate        |     100% |
| Average latency     | 25.42 ms |
| Minimum latency     | 12.10 ms |
| Maximum latency     | 51.23 ms |
| Total test time     |   0.31 s |
| Requests/second     |   322.58 |

These results represent a local Docker/development environment and should not be interpreted as production capacity.

---

# Reliability Considerations

The service incorporates several patterns commonly used in backend billing systems:

### Idempotency

Payment events use unique event IDs to prevent duplicate processing.

### Asynchronous Processing

Payment state transitions are processed through BullMQ rather than blocking the webhook request.

### Retry Handling

Payment jobs use retries with exponential backoff.

### Cache Invalidation

Plan cache entries are invalidated when plan data changes.

### Database Transactions

Billing persistence can be performed atomically through PostgreSQL transactions.

### Rate Limiting

API requests are protected with request throttling.

### Health Monitoring

The `/health` endpoint provides a simple application and database health signal.

### Graceful Shutdown

NestJS shutdown hooks allow the application to terminate cleanly.

---

# Docker Architecture

The application runs as three services:

```text
┌───────────────────────────────┐
│ subscription-billing-api      │
│ NestJS + BullMQ Processor     │
│ Port: 3000                    │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌───────────────┐  ┌───────────────┐
│ PostgreSQL    │  │ Redis         │
│ Port: 5432    │  │ Port: 6379    │
└───────────────┘  └───────────────┘
```

Inside Docker, the API connects to services using their Compose service names:

```text
DATABASE_HOST=postgres
REDIS_HOST=redis
```

---

# Production Considerations

This project is designed as a production-oriented backend demonstration, but several areas would require additional infrastructure for a real commercial billing platform.

Potential production improvements include:

- Managed PostgreSQL
- Managed Redis
- Separate BullMQ worker processes
- Payment-provider signature verification
- Outbox pattern for guaranteed event publication
- Database migration automation
- Distributed tracing
- Prometheus metrics
- Grafana dashboards
- Centralized logging
- JWT/OAuth authentication
- Role-based access control
- Stronger tenant-level authorization
- Secret management
- CI/CD deployment pipelines
- Horizontal API scaling
- Queue monitoring
- Dead-letter queues
- Distributed rate limiting
- Automated backups
- Disaster recovery procedures

---

# Design Decisions

## PostgreSQL

PostgreSQL was selected because billing data requires strong consistency, relational constraints, and transactional guarantees.

## Redis

Redis provides low-latency caching and supports the infrastructure required by BullMQ.

## BullMQ

Payment processing is asynchronous because webhook ingestion should remain fast and should not depend on completing all downstream work synchronously.

## Integer Monetary Values

Money is represented using integer values to avoid floating-point precision problems.

## Idempotent Webhooks

Payment providers may retry events, so every event is identified using a unique event ID.

## Snapshotting Invoice Amounts

Invoices store the amount and currency at creation time so historical billing records remain stable even if the underlying plan changes later.

---

# Known Limitations

This project intentionally focuses on the core backend billing workflow.

Current limitations include:

- No real payment-provider integration
- Webhook signature verification is not implemented
- Authentication and authorization are not included
- Downgrades do not currently generate account credits
- BullMQ processing currently runs within the NestJS application process
- Local Docker configuration is intended for development/demo use
- Performance measurements are from a local environment
- Production observability infrastructure is not included

---

# Future Improvements

Possible next iterations include:

1. Integrate Stripe or another payment provider
2. Add webhook signature verification
3. Implement JWT authentication
4. Add tenant-aware authorization
5. Separate API and worker deployments
6. Implement the transactional outbox pattern
7. Add dead-letter queues
8. Add Prometheus metrics
9. Add Grafana dashboards
10. Add distributed tracing
11. Add CI/CD
12. Deploy the service to AWS
13. Add automated database backups
14. Implement subscription renewal jobs
15. Add invoice PDF generation
16. Add customer notification workflows

---

# Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build
npm run build

# Start production build
npm run start:prod

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Docker
docker compose up -d --build

# Docker status
docker compose ps

# Docker logs
docker compose logs api

# Stop Docker stack
docker compose down

# Load test
node scripts/load-test.js
```

---

# Project Status

**Status: Completed**

The project currently includes:

- Subscription management
- Multi-tenant billing domain
- Invoice generation
- Proration
- Redis caching
- API rate limiting
- Asynchronous payment events
- BullMQ processing
- Idempotent webhook handling
- PostgreSQL persistence
- Health checks
- Graceful shutdown
- Dockerized deployment
- Automated tests
- Concurrent load testing

---

## Author

**Sammeyak Wankhade**

Backend-focused Software Engineer specializing in TypeScript, Node.js, NestJS, PostgreSQL, Redis, and distributed backend systems.

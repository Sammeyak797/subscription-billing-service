# Subscription & Billing Service

A production-oriented, multi-tenant subscription and billing platform built with **NestJS, React, TypeScript, PostgreSQL, Redis, BullMQ, TypeORM, Docker, TanStack Query, React Hook Form, Zod, Recharts, and Tailwind CSS**.

The platform provides a complete subscription-management workflow across a REST API and administrative frontend. It manages tenants, subscription plans, subscriptions, invoices, plan changes, proration, asynchronous payment events, caching, rate limiting, and idempotent webhook processing.

The frontend provides an operational dashboard for viewing customers, inspecting subscriptions and invoice history, and changing subscription plans through the existing billing API.

The project is designed as a **production-oriented backend and frontend engineering demonstration**, with an emphasis on transactional consistency, asynchronous processing, idempotency, caching, validation, API reliability, and clean separation between the backend domain and frontend presentation layers.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Core Domain Model](#core-domain-model)

  - [Tenant](#tenant)
  - [Plan](#plan)
  - [Subscription](#subscription)
  - [Invoice](#invoice)
  - [Payment Event](#payment-event)

- [Backend](#backend)

  - [Subscription Management](#subscription-management)
  - [Billing and Invoices](#billing-and-invoices)
  - [Proration](#proration)
  - [Transactions](#transactions)
  - [Redis Caching](#redis-caching)
  - [Rate Limiting](#rate-limiting)
  - [Payment Webhooks](#payment-webhooks)
  - [Idempotent Payment Processing](#idempotent-payment-processing)
  - [Asynchronous Payment Processing](#asynchronous-payment-processing)
  - [Retries and Backoff](#retries-and-backoff)
  - [Health Checks](#health-checks)
  - [Graceful Shutdown](#graceful-shutdown)

- [Frontend](#frontend)

  - [Frontend Overview](#frontend-overview)
  - [Dashboard](#dashboard)
  - [Customer Management](#customer-management)
  - [Customer Details](#customer-details)
  - [Invoice History](#invoice-history)
  - [Plan Changes](#plan-changes)
  - [Frontend Data Fetching](#frontend-data-fetching)
  - [Form Validation](#form-validation)
  - [Charts and Analytics](#charts-and-analytics)
  - [Frontend Architecture](#frontend-architecture)

- [Billing Flow](#billing-flow)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running the Complete Backend Stack with Docker](#running-the-complete-backend-stack-with-docker)
- [Running the Frontend](#running-the-frontend)
- [Testing](#testing)
- [Performance Testing](#performance-testing)
- [Performance Results](#performance-results)
- [Reliability Considerations](#reliability-considerations)
- [Security Considerations](#security-considerations)
- [Docker Architecture](#docker-architecture)
- [Engineering Design Decisions](#engineering-design-decisions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Development Commands](#development-commands)
- [Project Status](#project-status)
- [Author](#author)

---

# Overview

Subscription & Billing Service is a multi-tenant billing platform that models the core lifecycle of a SaaS subscription.

The backend exposes REST APIs for:

- Creating and retrieving tenants
- Creating and retrieving subscription plans
- Creating subscriptions
- Retrieving subscriptions
- Cancelling subscriptions
- Upgrading or downgrading plans
- Calculating prorated plan changes
- Generating invoices
- Retrieving invoices
- Receiving payment-provider webhook events
- Processing payment events asynchronously
- Monitoring application and database health

The frontend provides a web-based administrative interface for:

- Viewing customers
- Searching customers
- Paginating customer records
- Viewing subscription information
- Viewing invoice history
- Changing customer subscription plans
- Viewing current MRR
- Viewing active subscription counts
- Viewing customer counts
- Visualizing subscription distribution
- Visualizing MRR by plan

The system uses:

- **PostgreSQL** for transactional persistence
- **TypeORM** for database access
- **Redis** for caching, rate limiting, and BullMQ infrastructure
- **BullMQ** for asynchronous payment-event processing
- **NestJS** for the backend REST API
- **React + TypeScript** for the frontend
- **TanStack Query** for frontend server-state management
- **React Hook Form + Zod** for validated plan-change forms
- **Recharts** for dashboard visualization
- **Tailwind CSS** for the frontend UI
- **Docker Compose** for local infrastructure

---

# Features

## Backend Features

- Multi-tenant subscription management
- Subscription plan management
- Invoice generation and billing periods
- Subscription cancellation
- Subscription upgrades and downgrades
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
- Retry handling with exponential backoff
- Health-check endpoint
- Graceful application shutdown
- Dockerized development environment
- Automated unit and end-to-end testing
- Concurrent API load testing

## Frontend Features

- React + TypeScript administrative interface
- Responsive dark-themed billing dashboard
- Customer list
- Customer search
- Customer pagination
- Plan information
- Subscription status display
- Customer detail pages
- Live subscription lookup
- Invoice history
- Invoice status visualization
- Subscription plan changes
- Upgrade and downgrade workflow
- React Hook Form integration
- Zod validation
- Prevents selecting the currently active plan
- Mutation loading states
- Mutation error handling
- Successful plan-change feedback
- TanStack Query caching
- Automatic query invalidation after plan changes
- MRR dashboard metric
- Active subscription metric
- Customer count metric
- Subscription distribution chart
- MRR-by-plan chart
- Billing health summary
- Production frontend build using Vite

---

# Architecture

The overall system consists of a React frontend communicating with a NestJS REST API.

```text
                         ┌─────────────────────────┐
                         │       Browser / User    │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   React + TypeScript    │
                         │                         │
                         │ Dashboard               │
                         │ Customers               │
                         │ Customer Details        │
                         │ Plan Management         │
                         │ Invoice History         │
                         └────────────┬────────────┘
                                      │
                                      │ HTTP / REST
                                      ▼
                         ┌─────────────────────────┐
                         │      NestJS REST API    │
                         │                         │
                         │ Validation              │
                         │ Rate Limiting           │
                         │ Business Logic          │
                         │ Transactions            │
                         └───────┬─────────┬───────┘
                                 │         │
                    ┌────────────┘         └─────────────┐
                    ▼                                    ▼
          ┌────────────────────┐              ┌────────────────────┐
          │     PostgreSQL     │              │       Redis        │
          │                    │              │                    │
          │ Tenants            │              │ Plan Cache         │
          │ Plans              │              │ Rate Limiting      │
          │ Subscriptions      │              │ BullMQ Backend     │
          │ Invoices           │              │                    │
          │ Payment Events     │              └─────────┬──────────┘
          └────────────────────┘                        │
                                                        ▼
                                             ┌────────────────────┐
                                             │      BullMQ        │
                                             │  Payment Queue     │
                                             └─────────┬──────────┘
                                                       │
                                                       ▼
                                             ┌────────────────────┐
                                             │   Payment Worker   │
                                             │                    │
                                             │ PAID / FAILED      │
                                             └────────────────────┘
```

The frontend does not directly access PostgreSQL or Redis. It communicates exclusively through the backend REST API.

---

# Technology Stack

| Category               | Technology                          |
| ---------------------- | ----------------------------------- |
| Backend Framework      | NestJS                              |
| Backend Language       | TypeScript                          |
| Frontend Framework     | React                               |
| Frontend Language      | TypeScript                          |
| Frontend Build Tool    | Vite                                |
| Database               | PostgreSQL 16                       |
| ORM                    | TypeORM                             |
| Cache                  | Redis 7                             |
| Job Queue              | BullMQ                              |
| Backend Validation     | class-validator / class-transformer |
| API Rate Limiting      | NestJS Throttler                    |
| Frontend Data Fetching | TanStack Query                      |
| HTTP Client            | Axios                               |
| Frontend Routing       | React Router                        |
| Frontend Forms         | React Hook Form                     |
| Frontend Validation    | Zod                                 |
| Charts                 | Recharts                            |
| UI Styling             | Tailwind CSS                        |
| Icons                  | Lucide React                        |
| Backend Testing        | Jest / Supertest                    |
| Containerization       | Docker / Docker Compose             |
| Runtime                | Node.js                             |
| API Style              | REST                                |

---

# System Architecture

The application is intentionally separated into two logical layers.

## Backend

```text
Client
  │
  ▼
NestJS Controller
  │
  ▼
Service / Business Logic
  │
  ├──────────────► Redis
  │
  └──────────────► PostgreSQL
```

Asynchronous payment processing follows a separate path:

```text
Payment Provider
       │
       ▼
POST /webhooks/payments
       │
       ▼
NestJS API
       │
       ├── Validate event
       │
       ├── Check eventId
       │
       ├── Persist PaymentEvent
       │
       └── Add BullMQ Job
                    │
                    ▼
              Payment Queue
                    │
                    ▼
             Payment Processor
                    │
                    ▼
             Update Invoice
```

## Frontend

```text
React Application
       │
       ├── React Router
       │
       ├── TanStack Query
       │
       ├── Axios API Client
       │
       ├── React Hook Form
       │
       ├── Zod Validation
       │
       ├── Recharts
       │
       └── Tailwind CSS
                    │
                    ▼
             NestJS REST API
```

This separation allows the frontend to remain focused on presentation and user interaction while the backend remains the source of truth for billing operations and persistent state.

---

# Core Domain Model

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

## Tenant

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

## Plan

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

The frontend retrieves plans through:

```http
GET /plans
```

This allows the UI to display the actual plan name and price from the backend instead of maintaining an independent pricing database.

---

## Subscription

Connects a tenant to a billing plan.

Supported states:

```text
TRIALING
ACTIVE
CANCELLED
EXPIRED
```

A tenant cannot create another active subscription while an existing active subscription is present.

A subscription contains:

- `id`
- `tenantId`
- `planId`
- `status`
- `startDate`
- `endDate`
- `createdAt`
- `updatedAt`

The frontend uses the subscription ID to retrieve the current subscription and determine the actual current plan and status.

---

## Invoice

Represents a billing period for a subscription.

Supported states:

```text
PENDING
PAID
FAILED
VOID
```

Invoice records snapshot the plan amount and currency at creation time.

This prevents historical invoices from changing when a plan's current price is modified.

---

## Payment Event

Represents an incoming payment-provider event.

Each payment event contains:

- `eventId`
- `type`
- `invoiceId`
- `createdAt`

`eventId` is unique, allowing duplicate webhook events to be rejected.

---

# Backend

## Subscription Management

The backend manages the lifecycle of a tenant's subscription.

Supported operations include:

```text
Create subscription
      │
      ▼
Active subscription
      │
      ├── Change plan
      │      │
      │      └── Calculate proration
      │
      └── Cancel subscription
```

The backend enforces subscription state rules before modifying billing data.

---

## Billing and Invoices

Invoices represent billing periods associated with subscriptions.

The service supports:

- Invoice generation
- Invoice retrieval
- Tenant invoice history
- Payment status transitions

Invoice amounts are stored independently of the current plan price so that historical billing records remain stable.

---

## Proration

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

## Transactions

Billing-related persistence uses PostgreSQL transactions through TypeORM.

Conceptually:

```text
BEGIN TRANSACTION

Create billing record

Validate required state

Persist invoice

COMMIT
```

If an operation fails, the transaction can be rolled back rather than leaving partially persisted billing state.

---

## Redis Caching

Redis is used for active-plan caching.

The active plans cache uses:

```text
plans:active
```

The request flow is:

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

## Payment Webhooks

Payment providers can send asynchronous events to:

```http
POST /webhooks/payments
```

Supported event types:

```text
payment.succeeded
payment.failed
```

The API validates and persists the event before placing it on the payment-processing queue.

---

## Idempotent Payment Processing

Payment providers can retry webhook delivery.

Without idempotency, the same payment event could potentially be processed multiple times.

The service protects against duplicate events using a unique `eventId`.

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

Example:

```json
{
  "eventId": "evt_payment_001",
  "type": "payment.succeeded",
  "invoiceId": "invoice-uuid"
}
```

A repeated request with the same `eventId` is rejected rather than processed again.

---

## Asynchronous Payment Processing

Payment events are placed onto a BullMQ queue.

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
        │          ↓
        │      Invoice PAID
        │
        └── payment.failed
                   ↓
              Invoice FAILED
```

Payment processing is asynchronous so that the webhook endpoint does not need to perform the complete payment state transition synchronously.

---

## Retries and Backoff

Payment jobs use retry handling with exponential backoff.

This improves resilience against transient failures during asynchronous payment processing.

The webhook request itself does not need to wait for the complete downstream processing operation.

---

## Health Checks

The application exposes:

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

## Graceful Shutdown

NestJS shutdown hooks allow the application to terminate cleanly.

This is particularly important for an application that maintains:

- Database connections
- Redis connections
- BullMQ queues
- Background processing

---

# Frontend

## Frontend Overview

The frontend is an administrative billing interface built with:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Recharts
- Lucide React

The frontend is located under:

```text
frontend/
```

It communicates with the existing NestJS backend through REST APIs.

No separate frontend database is maintained.

The backend remains the source of truth for:

- Plans
- Tenants
- Subscriptions
- Invoices
- Subscription status
- Billing operations

---

# Dashboard

The dashboard provides a high-level overview of the current subscription state.

It displays:

## Monthly Recurring Revenue

MRR is calculated from the active customer subscriptions and their plan prices.

For the current sample dataset:

```text
Enterprise  $999
Pro         $299
Business    $599
Pro         $299
Enterprise  $999
Starter      $99
Pro         $299
Business    $599
-----------------
Total      $4,292
```

The dashboard therefore displays:

```text
MRR: $4,292
```

The frontend resolves plan names and prices from the backend `/plans` endpoint and uses the known subscription/customer relationships for the dashboard view.

---

## Active Subscriptions

The dashboard counts customers whose current frontend subscription state is:

```text
ACTIVE
```

The current sample dataset contains eight active subscriptions.

---

## Customer Count

The dashboard displays the number of customer records represented in the frontend customer index.

---

## Subscription Distribution

The dashboard includes a Recharts pie chart showing active subscriptions grouped by plan.

Conceptually:

```text
Active Subscriptions
        │
        ├── Starter
        ├── Pro
        ├── Business
        └── Enterprise
```

This makes it easier to understand the current distribution of subscriptions across plans.

---

## MRR by Plan

A Recharts bar chart displays the MRR contribution of each plan.

Example:

```text
Plan           MRR
--------------------
Starter        $99
Pro            $897
Business       $1,198
Enterprise     $1,998
```

This gives an immediate view of which plans contribute most to current recurring revenue.

---

## Billing Health

The dashboard also displays current-state billing health information:

- Active subscriptions
- Cancelled subscriptions
- Expired subscriptions

Historical churn is intentionally **not fabricated** because the current backend does not expose historical subscription-state data required to calculate a meaningful historical churn percentage.

The UI explicitly communicates this limitation.

---

# Customer Management

The Customers page provides an administrative customer table.

Each customer row displays:

- Customer name
- Customer ID
- Current plan
- Subscription status
- Monthly recurring revenue
- Link to customer details

Example:

```text
Customer             Plan          Status       MRR
----------------------------------------------------
Acme Corp            Enterprise    ACTIVE       $999
Beta Labs            Pro           ACTIVE       $299
Nova Technologies    Business      ACTIVE       $599
...
```

---

## Customer Search

The customer table supports searching by:

- Customer name
- Plan
- Subscription status

The search is performed client-side against the available customer index.

Search results reset pagination to the first page.

---

## Pagination

Customers are displayed in pages of five records.

The interface provides:

- Previous page button
- Next page button
- Current page indicator
- Total page count
- Result count

Example:

```text
Showing 1 - 5 of 8

        ←   1 / 2   →
```

---

# Customer Details

Each customer has a dedicated detail page.

Example route:

```text
/customers/:customerId
```

The detail page displays:

- Customer name
- Current plan
- Subscription status
- Subscription price
- Subscription start date
- Invoice history
- Change Plan action

The page retrieves the actual tenant and subscription records through the backend APIs.

---

## Live Subscription Data

The customer detail page uses:

```http
GET /tenants/:id
```

and:

```http
GET /subscriptions/:id
```

This allows the frontend to display the current backend subscription state rather than relying entirely on static customer metadata.

The current plan is resolved by matching:

```text
subscription.planId
```

against the plan data returned from:

```http
GET /plans
```

---

# Invoice History

Customer detail pages display invoice history using:

```http
GET /invoices/tenant/:tenantId
```

Each invoice displays:

- Invoice identifier
- Amount
- Currency
- Billing period
- Invoice status
- Creation date

Supported invoice states:

```text
PENDING
PAID
FAILED
VOID
```

Example:

```text
Invoice       Amount       Period             Status
--------------------------------------------------------
a81d...       USD 299      Jan 1 - Jan 31     PAID
b27c...       USD 299      Feb 1 - Feb 28     PAID
```

The frontend does not independently calculate invoice state.

Invoice state is obtained from the backend.

---

# Plan Changes

The frontend provides a dedicated plan-management screen.

Example route:

```text
/customers/:customerId/change-plan
```

The flow is:

```text
Customer Details
      │
      ▼
Manage Plan
      │
      ▼
Select New Plan
      │
      ▼
Validate Form
      │
      ▼
POST /subscriptions/:id/change-plan
      │
      ▼
Backend calculates proration
      │
      ▼
Subscription updated
      │
      ▼
Refresh subscription/invoice data
```

The frontend calls the existing backend API:

```http
POST /subscriptions/:id/change-plan
```

with:

```json
{
  "newPlanId": "new-plan-uuid"
}
```

No additional backend endpoint is required.

---

## Upgrade and Downgrade

The same form supports both:

```text
Upgrade
```

and:

```text
Downgrade
```

The backend determines the resulting billing behavior and proration.

For upgrades, the backend calculates the prorated difference.

For downgrades, the current backend behavior results in no immediate charge rather than creating a credit.

The frontend does not attempt to reproduce or override this billing logic.

---

# Form Validation

The change-plan form uses:

```text
React Hook Form
        +
Zod
```

The form requires a plan to be selected.

Validation prevents submitting an empty selection.

The current plan is also disabled in the plan selector.

This prevents an unnecessary request where the customer attempts to change from a plan to the exact same plan.

---

## Form States

The interface handles:

```text
Initial
   │
   ▼
Plan Selected
   │
   ▼
Submitting
   │
   ├── Success ──► Success message
   │
   └── Error ────► Error message
```

During submission:

- The submit button is disabled
- The button displays an updating state
- The form controls are disabled

After a successful change:

- Subscription query is invalidated
- Invoice query is invalidated
- Success feedback is displayed
- Updated backend state can be retrieved immediately

---

# Frontend Data Fetching

The frontend uses **TanStack Query** for server-state management.

The application is configured with a shared `QueryClient`.

Example query categories include:

```text
['plans']

['tenant', customerId]

['subscription', subscriptionId]

['invoices', customerId]
```

This provides:

- Request caching
- Loading states
- Error states
- Query invalidation
- Controlled retries
- Stale-data management

The configured default query behavior includes a short stale period and limited retries.

---

## Query Invalidation

After a successful plan change, the frontend invalidates:

```text
subscription query
```

and:

```text
invoice query
```

This ensures that subsequent UI rendering uses updated backend information.

---

# Frontend API Layer

The frontend uses Axios through a centralized API client.

The base URL is configured through:

```text
VITE_API_URL
```

with a local fallback:

```text
http://localhost:3000
```

The centralized client allows API calls to remain separated from React components.

Billing API functions include:

```text
getPlans()

getTenant()

getSubscription()

getTenantInvoices()

getInvoice()

changeSubscriptionPlan()
```

This keeps HTTP communication organized under:

```text
frontend/src/api/
```

---

# Charts and Analytics

The dashboard uses **Recharts**.

Current visualizations include:

## Subscription Distribution

```text
PieChart
```

Displays the number of active subscriptions grouped by plan.

## MRR by Plan

```text
BarChart
```

Displays recurring revenue contribution by plan.

The charts are responsive and rendered inside dashboard cards.

---

# Frontend Architecture

The frontend is organized into several layers.

```text
frontend/
│
├── api/
│   ├── billing.ts
│   └── client.ts
│
├── components/
│   └── layout/
│       └── AppLayout.tsx
│
├── data/
│   └── customers.ts
│
├── pages/
│   ├── Dashboard.tsx
│   ├── Customers.tsx
│   ├── CustomerDetail.tsx
│   └── ChangePlan.tsx
│
├── types/
│   └── billing.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

The main responsibilities are:

### `api/`

Contains backend communication functions.

### `components/`

Contains reusable application-level UI components.

### `data/`

Contains the frontend customer relationship index used to connect known tenant IDs with subscription IDs and plan IDs because the current backend does not expose a tenant-list or subscription-list endpoint.

### `pages/`

Contains route-level screens.

### `types/`

Contains shared TypeScript models used by the frontend.

### `main.tsx`

Initializes React and the TanStack Query provider.

### `App.tsx`

Defines the React Router application routes.

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

The frontend then consumes the resulting billing state:

```text
Backend State
      │
      ▼
REST API
      │
      ▼
TanStack Query
      │
      ▼
React UI
      │
      ├── Dashboard
      ├── Customers
      ├── Customer Details
      └── Invoice History
```

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

# Tenants

## Create Tenant

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

## Get Tenant

```http
GET /tenants/:id
```

---

# Subscriptions

## Create Subscription

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

## Get Subscription

```http
GET /subscriptions/:id
```

## Cancel Subscription

```http
POST /subscriptions/:id/cancel
```

## Change Subscription Plan

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

# Invoices

## Generate Invoice

```http
POST /invoices/:subscriptionId
```

## Get Invoice

```http
GET /invoices/:id
```

## Get Tenant Invoices

```http
GET /invoices/tenant/:tenantId
```

---

# Payment Webhooks

## Receive Payment Event

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

Supported event types:

```text
payment.succeeded
payment.failed
```

The API queues the event for asynchronous processing.

---

# Health Check

```http
GET /health
```

Example:

```json
{
  "status": "ok"
}
```

---

# Frontend Routes

| Route                                | Description                   |
| ------------------------------------ | ----------------------------- |
| `/`                                  | Dashboard                     |
| `/customers`                         | Customer list                 |
| `/customers/:customerId`             | Customer details and invoices |
| `/customers/:customerId/change-plan` | Upgrade/downgrade plan        |

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
├── frontend/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── billing.ts
│   │   │   └── client.ts
│   │   │
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppLayout.tsx
│   │   │
│   │   ├── data/
│   │   │   └── customers.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── CustomerDetail.tsx
│   │   │   └── ChangePlan.tsx
│   │   │
│   │   ├── types/
│   │   │   └── billing.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── ...
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

## Backend

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

## Frontend

Create:

```text
frontend/.env
```

based on:

```text
frontend/.env.example
```

Example:

```env
VITE_API_URL=http://localhost:3000
```

The frontend uses this value as the backend API base URL.

The local `.env` file should not be committed.

Only the example environment file should be tracked:

```text
frontend/.env.example
```

---

# Running Locally

## Prerequisites

Install:

- Node.js
- npm
- Docker
- Docker Compose

---

# Backend Setup

## Install Dependencies

From the project root:

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

# Running the Complete Backend Stack with Docker

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

# Running the Frontend

Open a second terminal.

Move into the frontend:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Create:

```text
frontend/.env
```

with:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

---

## Frontend Development Workflow

Start the backend first:

```bash
npm run start:dev
```

Then start the frontend:

```bash
cd frontend
npm run dev
```

The browser application communicates with:

```text
http://localhost:3000
```

through the configured `VITE_API_URL`.

---

# Frontend Production Build

From:

```text
frontend/
```

run:

```bash
npm run build
```

The Vite production build is generated under:

```text
frontend/dist/
```

The build was validated during development to ensure that the frontend compiles successfully for production.

---

# Testing

## Backend Unit Tests

```bash
npm test
```

---

## Backend End-to-End Tests

```bash
npm run test:e2e
```

---

## Backend Test Coverage

```bash
npm run test:cov
```

The test suite covers important billing behavior including subscription and proration logic and API workflows.

---

## Frontend Build Validation

The frontend can be validated using:

```bash
cd frontend
npm run build
```

This validates TypeScript compilation and the Vite production build.

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

---

# Performance Results

Measured local benchmark:

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

The benchmark demonstrates that the API successfully handled the tested concurrent workload with:

```text
100% successful requests
322.58 requests/second
25.42 ms average latency
```

---

# Reliability Considerations

The service incorporates several patterns commonly used in backend billing systems.

## Idempotency

Payment events use unique event IDs to prevent duplicate processing.

## Asynchronous Processing

Payment state transitions are processed through BullMQ rather than blocking the webhook request.

## Retry Handling

Payment jobs use retries with exponential backoff.

## Cache Invalidation

Plan cache entries are invalidated when plan data changes.

## Database Transactions

Billing persistence can be performed atomically through PostgreSQL transactions.

## Rate Limiting

API requests are protected with request throttling.

## Health Monitoring

The `/health` endpoint provides a simple application and database health signal.

## Graceful Shutdown

NestJS shutdown hooks allow the application to terminate cleanly.

## Frontend Query Invalidation

After successful plan changes, TanStack Query invalidates relevant subscription and invoice queries so the UI can retrieve the updated billing state.

## Frontend Validation

Plan-change input is validated before reaching the backend using React Hook Form and Zod.

---

# Security Considerations

The current implementation includes several baseline protections:

- Request validation through NestJS validation
- API rate limiting
- Idempotent webhook event handling
- Database transactions
- Environment-based configuration
- Local secret exclusion through `.gitignore`

However, the current implementation does **not** include a complete production authentication and authorization layer.

In a production deployment, additional security controls would be required.

---

# Docker Architecture

The backend runs as three services:

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

```env
DATABASE_HOST=postgres
REDIS_HOST=redis
```

The frontend runs separately during local development and communicates with the API over HTTP.

---

# Engineering Design Decisions

## PostgreSQL

PostgreSQL was selected because billing data requires:

- Strong consistency
- Relational constraints
- Transactional guarantees
- Reliable persistence

---

## Redis

Redis provides:

- Low-latency plan caching
- Rate-limiting infrastructure
- BullMQ backend infrastructure

---

## BullMQ

Payment processing is asynchronous because webhook ingestion should remain fast and should not depend on completing all downstream work synchronously.

---

## Integer Monetary Values

Money is represented using integer values to avoid floating-point precision problems.

The proration calculation uses integer paise internally.

---

## Idempotent Webhooks

Payment providers may retry events, so every event is identified using a unique event ID.

---

## Snapshotting Invoice Amounts

Invoices store the amount and currency at creation time so historical billing records remain stable even if the underlying plan changes later.

---

## TanStack Query

TanStack Query was selected for frontend server-state management because billing data is API-driven and requires:

- Caching
- Loading states
- Error states
- Query invalidation
- Controlled retries
- Synchronization after mutations

---

## React Hook Form + Zod

The plan-change workflow uses React Hook Form for efficient form state management and Zod for schema validation.

This provides a clear validation boundary before making the subscription-change API request.

---

## Recharts

Recharts provides the dashboard visualization layer without introducing a separate analytics backend.

The current dashboard visualizes metrics that can be derived from the available billing data.

---

## Tailwind CSS

Tailwind CSS was used to build the administrative interface quickly while keeping the UI consistent through reusable utility classes.

---

# Known Limitations

This project intentionally focuses on the core subscription and billing workflow.

## Backend Limitations

Current limitations include:

- No real payment-provider integration
- Webhook signature verification is not implemented
- Authentication and authorization are not included
- Downgrades do not currently generate account credits
- BullMQ processing currently runs within the NestJS application process
- Local Docker configuration is intended for development/demo use
- Performance measurements are from a local environment
- Production observability infrastructure is not included
- No historical subscription-state analytics endpoint
- No dedicated customer-list API endpoint
- No dedicated tenant-subscription listing endpoint

---

## Frontend Limitations

The frontend intentionally works within the capabilities of the existing backend.

Because the backend does not currently expose a customer-list endpoint or a tenant-subscription listing endpoint, the frontend maintains a small customer relationship index containing known:

```text
tenantId
subscriptionId
planId
```

The actual plan information is still resolved from the backend `/plans` endpoint.

The customer detail page retrieves live tenant and subscription data through the available backend endpoints.

The dashboard's current-state metrics are derived from the available frontend customer relationships and backend plan pricing.

Historical churn is not displayed as a fabricated percentage because the current backend does not expose enough historical subscription-state information to calculate a reliable churn metric.

---

# Production Considerations

This project is designed as a production-oriented backend and frontend demonstration, but several areas would require additional infrastructure for a real commercial billing platform.

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
- Frontend deployment through a production hosting provider
- Backend deployment through managed infrastructure
- HTTPS and secure environment configuration
- Production API monitoring
- Frontend error monitoring

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
17. Add a dedicated customer listing endpoint
18. Add subscription listing and filtering APIs
19. Add historical subscription analytics
20. Add historical churn calculation
21. Add real-time billing notifications
22. Add role-based frontend access
23. Add frontend automated component and integration tests
24. Add frontend error monitoring
25. Add production observability across frontend and backend

---

# Development Commands

## Backend

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build backend
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

## Frontend

```bash
# Move into frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

# Typical Local Development Session

A complete local development session can be started using two terminals.

## Terminal 1 — Backend

From the project root:

```bash
docker compose up -d postgres redis
```

Then:

```bash
npm run start:dev
```

Backend:

```text
http://localhost:3000
```

Health:

```text
http://localhost:3000/health
```

---

## Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The frontend communicates with:

```text
http://localhost:3000
```

through:

```env
VITE_API_URL=http://localhost:3000
```

---

# Application Workflow

A typical administrator workflow is:

```text
Open Dashboard
      │
      ▼
Review MRR / Active Subscriptions
      │
      ▼
Open Customers
      │
      ▼
Search Customer
      │
      ▼
Open Customer Details
      │
      ├── Review Subscription
      │
      ├── Review Invoice History
      │
      └── Manage Plan
               │
               ▼
          Select New Plan
               │
               ▼
          Validate Form
               │
               ▼
       Change Subscription
               │
               ▼
       Backend Calculates
          Proration
               │
               ▼
       Subscription Updated
               │
               ▼
        Frontend Refreshes
          Query State
```

This workflow demonstrates the complete interaction between the frontend and backend billing system.

---

# Example Subscription Data

The current development dataset contains example plans such as:

```text
Starter       $99 / month
Pro           $299 / month
Business      $599 / month
Enterprise    $999 / month
```

Example customers include:

```text
Acme Corp
Beta Labs
Nova Technologies
Vertex Solutions
Quantum Systems
PixelForge
CloudNest
DataPulse
```

These records are used to exercise the frontend customer, subscription, invoice, plan-change, and dashboard workflows.

---

# Project Status

## Status: Completed

The project currently includes:

### Backend

- Subscription management
- Multi-tenant billing domain
- Plan management
- Tenant management
- Invoice generation
- Invoice retrieval
- Subscription cancellation
- Subscription upgrades and downgrades
- Proration
- Redis caching
- API rate limiting
- Asynchronous payment events
- BullMQ processing
- Idempotent webhook handling
- PostgreSQL persistence
- PostgreSQL transactions
- Health checks
- Graceful shutdown
- Dockerized backend environment
- Automated tests
- Concurrent load testing

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios API client
- React Hook Form
- Zod validation
- Recharts
- Customer management
- Customer search
- Customer pagination
- Customer detail pages
- Live tenant lookup
- Live subscription lookup
- Invoice history
- Invoice status display
- Upgrade/downgrade workflow
- Real backend plan-change API integration
- Mutation loading/error/success handling
- Query invalidation after mutations
- MRR dashboard
- Active subscription metrics
- Customer metrics
- Subscription distribution chart
- MRR-by-plan chart
- Billing health summary
- Production frontend build

---

# Performance Summary

The backend was tested using concurrent requests against the plans endpoint.

```text
Total requests:       100
Successful requests:  100
Failed requests:      0
Success rate:         100%
Average latency:      25.42 ms
Minimum latency:      12.10 ms
Maximum latency:      51.23 ms
Total test time:      0.31 s
Requests/second:      322.58
```

The benchmark demonstrates successful handling of the tested concurrent workload in the local development environment.

These results are **not production capacity guarantees**.

---

# What This Project Demonstrates

This project demonstrates practical software-engineering patterns relevant to backend and full-stack engineering roles.

## Backend Engineering

- REST API design
- NestJS modular architecture
- TypeScript
- PostgreSQL data modeling
- TypeORM
- Transactions
- Redis caching
- Background job processing
- BullMQ
- Idempotency
- Webhook processing
- Retry mechanisms
- Exponential backoff
- Rate limiting
- Health checks
- Graceful shutdown
- Performance testing

## Frontend Engineering

- React
- TypeScript
- Component-based architecture
- Client-side routing
- API integration
- Server-state management
- Form state management
- Schema validation
- Dashboard development
- Data visualization
- Responsive UI
- Loading/error/success states
- Query invalidation after mutations

## System Design

The project demonstrates how a subscription billing platform can separate:

```text
Presentation
     │
     ▼
REST API
     │
     ▼
Business Logic
     │
     ├── PostgreSQL
     ├── Redis
     └── BullMQ
```

This architecture allows synchronous API operations and asynchronous payment processing to coexist while maintaining a clear separation of responsibilities.

---

# Author

**Sammeyak Wankhade**

Full-Stack Software Engineer specializing in TypeScript, Node.js, NestJS, Angular, PostgreSQL, Redis, and event-driven distributed systems. Currently building subscription and billing infrastructure for a UK-based SaaS platform.

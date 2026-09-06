export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingIntervalDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  'TRIALING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  plan?: Plan;
  tenant?: Tenant;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'VOID';

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

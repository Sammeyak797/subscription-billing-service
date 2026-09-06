import { api } from './client';
import type { Invoice, Plan, Subscription, Tenant } from '../types/billing';

export async function getPlans(): Promise<Plan[]> {
  const response = await api.get<Plan[]>('/plans');
  return response.data;
}

export async function getTenant(tenantId: string): Promise<Tenant> {
  const response = await api.get<Tenant>(`/tenants/${tenantId}`);

  return response.data;
}

export async function getSubscription(
  subscriptionId: string,
): Promise<Subscription> {
  const response = await api.get<Subscription>(
    `/subscriptions/${subscriptionId}`,
  );

  return response.data;
}

export async function getTenantInvoices(tenantId: string): Promise<Invoice[]> {
  const response = await api.get<Invoice[]>(`/invoices/tenant/${tenantId}`);

  return response.data;
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  const response = await api.get<Invoice>(`/invoices/${invoiceId}`);

  return response.data;
}

export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string,
) {
  const response = await api.post(
    `/subscriptions/${subscriptionId}/change-plan`,
    {
      newPlanId,
    },
  );

  return response.data;
}

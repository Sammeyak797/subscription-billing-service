import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import {
  getPlans,
  getSubscription,
  getTenant,
  getTenantInvoices,
} from '../api/billing';

import { customers } from '../data/customers';

export function CustomerDetail() {
  const { customerId } = useParams();

  const customer = customers.find((item) => item.id === customerId);

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', customerId],
    queryFn: () => getTenant(customerId!),
    enabled: Boolean(customerId),
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', customer?.subscriptionId],
    queryFn: () => getSubscription(customer!.subscriptionId),
    enabled: Boolean(customer?.subscriptionId),
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', customerId],
    queryFn: () => getTenantInvoices(customerId!),
    enabled: Boolean(customerId),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  });

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to customers
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            Customer not found
          </h2>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((plan) => plan.id === subscription?.planId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to customers
        </Link>

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-white">
            {tenant?.name ?? customer.name}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Customer subscription and billing details.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard
          label="Customer"
          value={tenantLoading ? 'Loading...' : (tenant?.name ?? customer.name)}
        />

        <InfoCard
          label="Current Plan"
          value={
            subscriptionLoading
              ? 'Loading...'
              : (currentPlan?.name ?? 'Unknown')
          }
        />

        <InfoCard
          label="Subscription Status"
          value={
            subscriptionLoading
              ? 'Loading...'
              : (subscription?.status ?? 'Unknown')
          }
        />
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-5">
          <h3 className="font-semibold text-white">Subscription</h3>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-4">
          <DetailItem label="Plan" value={currentPlan?.name ?? 'Unknown'} />

          <DetailItem
            label="Price"
            value={
              currentPlan
                ? `$${currentPlan.price.toLocaleString()} / month`
                : '—'
            }
          />

          <DetailItem label="Status" value={subscription?.status ?? '—'} />

          <DetailItem
            label="Start Date"
            value={
              subscription?.startDate
                ? new Date(subscription.startDate).toLocaleDateString()
                : '—'
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-5">
          <h3 className="font-semibold text-white">Invoice History</h3>
        </div>

        {invoicesLoading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-950/50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {invoice.id.slice(0, 8)}...
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-300">
                      {invoice.currency} {invoice.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(invoice.periodStart).toLocaleDateString()} –{' '}
                      {new Date(invoice.periodEnd).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <InvoiceStatus status={invoice.status} />
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h3 className="font-semibold text-white">Change Plan</h3>

          <p className="mt-1 text-sm text-slate-400">
            Upgrade or downgrade this customer's subscription.
          </p>
        </div>

        <div className="mt-5">
          <Link
            to={`/customers/${customer.id}/change-plan`}
            className="inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Manage Plan
          </Link>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>

      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>

      <p className="mt-2 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function InvoiceStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
    VOID: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}
    >
      {status}
    </span>
  );
}

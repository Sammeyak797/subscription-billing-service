import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Users, CreditCard, DollarSign } from 'lucide-react';
import type { ReactNode } from 'react';

import { getPlans } from '../api/billing';
import { customers } from '../data/customers';

export function Dashboard() {
  const {
    data: plans = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  });

  const customerRows = useMemo(() => {
    return customers.map((customer) => {
      const plan = plans.find((item) => item.id === customer.planId);

      return {
        ...customer,
        plan: plan?.name ?? customer.plan,
        mrr: plan?.price ?? customer.mrr,
      };
    });
  }, [plans]);

  const activeCustomers = customerRows.filter(
    (customer) => customer.subscriptionStatus === 'ACTIVE',
  );

  const totalMrr = activeCustomers.reduce(
    (total, customer) => total + customer.mrr,
    0,
  );

  const planDistribution = useMemo(() => {
    const counts: Record<string, number> = {};

    activeCustomers.forEach((customer) => {
      counts[customer.plan] = (counts[customer.plan] ?? 0) + 1;
    });

    return Object.entries(counts).map(([name, subscriptions]) => ({
      name,
      subscriptions,
    }));
  }, [activeCustomers]);

  const mrrByPlan = useMemo(() => {
    const totals: Record<string, number> = {};

    activeCustomers.forEach((customer) => {
      totals[customer.plan] = (totals[customer.plan] ?? 0) + customer.mrr;
    });

    return Object.entries(totals).map(([name, mrr]) => ({
      name,
      mrr,
    }));
  }, [activeCustomers]);

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>

        <p className="mt-1 text-sm text-slate-400">
          Subscription and billing overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={isLoading ? 'Loading...' : `$${totalMrr.toLocaleString()}`}
          icon={<DollarSign size={20} />}
        />

        <MetricCard
          title="Active Subscriptions"
          value={isLoading ? 'Loading...' : activeCustomers.length.toString()}
          icon={<CreditCard size={20} />}
        />

        <MetricCard
          title="Customers"
          value={isLoading ? 'Loading...' : customerRows.length.toString()}
          icon={<Users size={20} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h3 className="font-semibold text-white">
              Subscription Distribution
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Active subscriptions by plan.
            </p>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="subscriptions"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {planDistribution.map((_, index) => (
                    <Cell key={index} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h3 className="font-semibold text-white">MRR by Plan</h3>

            <p className="mt-1 text-sm text-slate-400">
              Monthly recurring revenue contribution.
            </p>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrByPlan}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                />

                <Bar dataKey="mrr" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h3 className="font-semibold text-white">Billing Health</h3>

          <p className="mt-1 text-sm text-slate-400">
            Current billing metrics based on available subscription data.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <HealthItem label="Active" value={`${activeCustomers.length}`} />

          <HealthItem
            label="Cancelled"
            value={`${
              customerRows.filter(
                (customer) => customer.subscriptionStatus === 'CANCELLED',
              ).length
            }`}
          />

          <HealthItem
            label="Expired"
            value={`${
              customerRows.filter(
                (customer) => customer.subscriptionStatus === 'EXPIRED',
              ).length
            }`}
          />
        </div>

        <p className="mt-5 text-xs text-slate-500">
          Historical churn is not available from the current backend API, so no
          estimated churn percentage is displayed.
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>

      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

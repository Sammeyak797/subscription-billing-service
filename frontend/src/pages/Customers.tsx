import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getPlans } from '../api/billing';
import { customers } from '../data/customers';

const PAGE_SIZE = 5;

export function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return customerRows;
    }

    return customerRows.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.plan.toLowerCase().includes(query) ||
        customer.subscriptionStatus.toLowerCase().includes(query),
    );
  }, [customerRows, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customers</h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage customer subscriptions and billing.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
        <Search size={18} className="text-slate-500" />

        <input
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search customers, plans, or status..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-950/50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Subscription</th>
              <th className="px-6 py-4">MRR</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-400"
                >
                  Loading customers...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-red-400"
                >
                  Failed to load billing data.
                </td>
              </tr>
            ) : paginatedCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-400"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="transition hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{customer.name}</p>

                      <p className="mt-1 text-xs text-slate-500">
                        {customer.id}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-300">
                    {customer.plan}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={customer.subscriptionStatus} />
                  </td>

                  <td className="px-6 py-4 text-sm font-medium">
                    ${customer.mrr.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing{' '}
          {filteredCustomers.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1}{' '}
          - {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of{' '}
          {filteredCustomers.length}
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-3 text-sm text-slate-400">
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    EXPIRED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    TRIALING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

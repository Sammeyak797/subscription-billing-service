import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

import {
  changeSubscriptionPlan,
  getPlans,
  getSubscription,
} from '../api/billing';

import { customers } from '../data/customers';

const changePlanSchema = z.object({
  newPlanId: z.string().min(1, 'Please select a plan'),
});

type ChangePlanForm = z.infer<typeof changePlanSchema>;

export function ChangePlan() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [successMessage, setSuccessMessage] = useState('');

  const customer = customers.find((item) => item.id === customerId);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', customer?.subscriptionId],
    queryFn: () => getSubscription(customer!.subscriptionId),
    enabled: Boolean(customer?.subscriptionId),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePlanForm>({
    resolver: zodResolver(changePlanSchema),
  });

  const selectedPlanId = watch('newPlanId');

  const mutation = useMutation({
    mutationFn: (newPlanId: string) =>
      changeSubscriptionPlan(customer!.subscriptionId, newPlanId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscription', customer?.subscriptionId],
      });

      queryClient.invalidateQueries({
        queryKey: ['invoices', customerId],
      });

      setSuccessMessage('Subscription plan updated successfully.');
    },
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

  function onSubmit(data: ChangePlanForm) {
    if (data.newPlanId === subscription?.planId) {
      return;
    }

    setSuccessMessage('');
    mutation.mutate(data.newPlanId);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          to={`/customers/${customer.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to customer
        </Link>

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-white">
            Change Subscription Plan
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Update the plan for {customer.name}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Current Plan
          </p>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">
                {currentPlan?.name ?? 'Loading...'}
              </p>

              {currentPlan && (
                <p className="mt-1 text-sm text-slate-400">
                  ${currentPlan.price.toLocaleString()} / month
                </p>
              )}
            </div>

            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              {subscription?.status ?? 'Loading...'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-200">
              New Plan
            </label>

            <select
              {...register('newPlanId')}
              disabled={plansLoading || mutation.isPending}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="">Select a plan</option>

              {plans.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                  disabled={plan.id === subscription?.planId}
                >
                  {plan.name} — ${plan.price.toLocaleString()}/month
                  {plan.id === subscription?.planId ? ' (Current)' : ''}
                </option>
              ))}
            </select>

            {errors.newPlanId && (
              <p className="mt-2 text-sm text-red-400">
                {errors.newPlanId.message}
              </p>
            )}
          </div>

          {selectedPlanId && selectedPlanId !== subscription?.planId && (
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <p className="text-sm font-medium text-indigo-300">
                Selected plan
              </p>

              {(() => {
                const selectedPlan = plans.find(
                  (plan) => plan.id === selectedPlanId,
                );

                if (!selectedPlan) {
                  return null;
                }

                return (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-white">{selectedPlan.name}</span>

                    <span className="font-semibold text-white">
                      ${selectedPlan.price.toLocaleString()}
                      /month
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {mutation.isError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              Failed to change the subscription plan. Please try again.
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                mutation.isPending ||
                !selectedPlanId ||
                selectedPlanId === subscription?.planId
              }
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? 'Updating...' : 'Change Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

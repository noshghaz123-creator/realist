/** Display label for user plan — only Free Trial or On Demand for buyers */
export function planLabel(plan) {
  if (plan === 'ondemand' || plan === 'pro' || plan === 'enterprise') return 'On Demand';
  if (plan === 'trial' || plan === 'basic' || plan === 'none' || !plan) return 'Free Trial';
  return 'Free Trial';
}

export function isOnDemandPlan(plan) {
  return plan === 'ondemand' || plan === 'pro' || plan === 'enterprise';
}

export default function PlanBadge({ plan, className = '' }) {
  const onDemand = isOnDemandPlan(plan);
  const label = planLabel(plan);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        onDemand
          ? 'bg-violet-50 text-violet-800 border-violet-200'
          : 'bg-teal-50 text-teal-800 border-teal-200'
      } ${className}`}
    >
      {label}
    </span>
  );
}

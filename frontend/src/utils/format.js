export function formatPrice(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMoney(amount) {
  return formatPrice(amount);
}

export function typeLabel(type) {
  if (!type) return '';
  return String(type).replace(/-/g, ' ');
}

export function tierLabel(tier) {
  const labels = {
    basic: 'Basic',
    qualified: 'Qualified',
    premium: 'Premium',
  };
  return labels[tier] || tier || '';
}

export const statusLabel = {
  contacted: 'Contacted',
  in_progress: 'In Progress',
  closed: 'Closed',
};

export const statusColors = {
  contacted: 'bg-blue-50 text-blue-700 border-blue-100',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
  closed: 'bg-green-50 text-green-700 border-green-100',
};

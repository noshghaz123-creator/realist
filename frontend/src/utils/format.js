export const formatPrice = (n) => {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
};

export const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const tierLabel = (tier) => tier?.toUpperCase() || '';
export const typeLabel = (type) =>
  type?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';

export const statusColors = {
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-green-50 text-green-700 border-green-200',
};

export const statusLabel = {
  contacted: 'Contacted',
  in_progress: 'In Progress',
  closed: 'Closed',
};

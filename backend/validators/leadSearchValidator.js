const FILTER_KEYS = [
  'county', 'city', 'zipCode', 'propertyType',
  'bedrooms', 'bathrooms', 'priceMin', 'priceMax',
  'estimatedValueMin', 'estimatedValueMax',
  'mortgageBalanceMin', 'mortgageBalanceMax',
  'equityMin', 'equityMax',
  'ownerOccupied', 'vacant', 'preForeclosure', 'bankruptcy', 'taxDelinquent', 'highEquity',
];

export function parseSearchFilters(body = {}) {
  const filters = {};
  FILTER_KEYS.forEach((key) => {
    const val = body[key];
    if (val === undefined || val === '' || val === null) return;
    if (['ownerOccupied', 'vacant', 'preForeclosure', 'bankruptcy', 'taxDelinquent', 'highEquity'].includes(key)) {
      filters[key] = val === true || val === 'true' || val === 1 || val === '1';
      return;
    }
    filters[key] = val;
  });
  return filters;
}

export function validateSearchFilters(filters) {
  if (filters.zipCode && !/^\d{5}(-\d{4})?$/.test(String(filters.zipCode))) {
    return 'Zip code must be 5 digits.';
  }
  return null;
}

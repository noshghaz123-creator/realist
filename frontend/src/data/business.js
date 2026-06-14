/** REALIST business plan constants */

export const MISSION =
  'Provide real estate investors with consistent, high-converting off-market opportunities.';

export const GEO_FOCUS = {
  primary: 'South Florida',
  expansion: 'Nationwide (all U.S. states)',
};

export const TARGET_CUSTOMERS = [
  'Real estate wholesalers',
  'Fix & flip investors',
  'Buy-and-hold investors',
  'Hedge funds & institutional buyers',
];

export const HIGH_VALUE_LEADS = [
  { type: 'pre-foreclosure', label: 'Pre-Foreclosures', desc: 'Catch motivated sellers 60–120 days before auction.' },
  { type: 'foreclosure', label: 'Foreclosures', desc: 'Bank-owned and auction-stage distressed properties.' },
  { type: 'probate', label: 'Probate Properties', desc: 'Estate sales with heirs ready to liquidate quickly.' },
  { type: 'tax-delinquent', label: 'Tax Delinquent', desc: 'Owners behind on property taxes — high motivation.' },
  { type: 'absentee-owner', label: 'Absentee Owners', desc: 'Out-of-state owners with unmaintained properties.' },
  { type: 'vacant', label: 'Vacant Properties', desc: 'Empty homes with motivated or unreachable owners.' },
  { type: 'abandoned', label: 'Abandoned Properties', desc: 'Long-term vacant with clear distress signals.' },
  { type: 'bankruptcy', label: 'Bankruptcy', desc: 'Owners facing severe credit debt and forced sales.' },
  { type: 'medical', label: 'Medical Issues', desc: 'Life-event motivated sellers needing fast liquidity.' },
];

export const PREMIUM_LEAD_TRAITS = [
  'Seller already interested in selling',
  'Direct contact established (phone/text)',
  'Property analyzed with ARV + repair cost',
];

export const USP = [
  'Not just data — pre-qualified leads',
  'Real conversations with sellers',
  'Accurate property analysis (ARV + repairs)',
  'Fast delivery — speed equals money',
  'Exclusive deals sold to one buyer only',
];

export const REVENUE_MODEL = {
  perLead: {
    basic: { range: '$10–$50', desc: 'Early-stage, unverified data' },
    qualified: { range: '$100–$500', desc: 'Verified seller interest & contact' },
    exclusive: { range: '$500–$5,000', desc: 'High-ticket, sold once' },
  },
  subscription: [
    { name: 'Starter', price: 1000, delivery: 'Weekly bulk leads', features: ['50 qualified leads/month', 'South Florida focus', 'Email support', 'CRM access'] },
    { name: 'Growth', price: 2500, delivery: 'Daily delivery', popular: true, features: ['150 qualified leads/month', 'Multi-market access', 'Priority support', 'Advanced filters', 'CSV export'] },
    { name: 'Enterprise', price: 5000, delivery: 'Exclusive + bulk', features: ['Unlimited qualified leads', 'Exclusive deal access', 'Dedicated account manager', 'API access', 'Revenue share options'] },
  ],
};

export const LEAD_TYPE_OPTIONS = HIGH_VALUE_LEADS.map((l) => l.type);

export const WORKFLOW_STEPS = [
  'Pull data from county records & platforms',
  'AI skip trace & contact enrichment',
  'Cold call / SMS / direct mail outreach',
  'Qualify seller motivation & urgency',
  'Package with ARV + repair analysis',
  'Sell & distribute to investors',
];

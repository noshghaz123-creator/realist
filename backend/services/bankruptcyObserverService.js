const BO_BASE = 'https://api.bankruptcyobserver.com/api/v1';

function getToken() {
  return process.env.BANKRUPTCY_OBSERVER_TOKEN?.trim() || '';
}

function maskName(name) {
  if (!name) return 'Debtor on file';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}***`;
  return `${parts[0]} ${parts[parts.length - 1][0]}***`;
}

function normalizeCase(item) {
  const assets = item.assetAmount || item.assets || null;
  const liabilities = item.liabAmount || item.liabilities || null;

  return {
    id: String(item.shortCaseNumber || item.name),
    attomId: null,
    address: item.name || 'Business debtor',
    city: item.courtState || 'FL',
    state: item.courtState || 'FL',
    zip: '',
    propertyType: 'Bankruptcy Filing',
    beds: null,
    baths: null,
    sqft: null,
    yearBuilt: null,
    assessedValue: null,
    avmValue: assets ? Number(String(assets).replace(/[^\d.]/g, '')) || null : null,
    owner: {
      name: maskName(item.name),
      ownerOccupied: null,
      mailingCity: item.court || null,
    },
    mortgage: {
      lender: null,
      balance: liabilities ? Number(String(liabilities).replace(/[^\d.]/g, '')) || null : null,
      originalAmount: null,
      interestRate: null,
      recordingDate: item.dateFiled || null,
    },
    foreclosure: {
      status: null,
      auctionDate: null,
      defaultAmount: null,
      recordingDate: null,
      caseNumber: item.shortCaseNumber || null,
    },
    equity: { amount: null, ltv: null },
    distressType: 'Bankruptcy',
    bankruptcy: true,
    apn: null,
    source: 'bankruptcy-observer',
    categories: ['bankruptcy', 'records'],
    bankruptcyMeta: {
      chapter: item.chapter || null,
      court: item.court || null,
      dateFiled: item.dateFiled || null,
      isOpen: item.isOpen ?? null,
      industry: item.industry || null,
    },
  };
}

export async function getBankruptcyCases({ state = 'FL', limit = 6 } = {}) {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${BO_BASE}/cases/by-state`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      state,
      limit: Math.min(Math.max(limit, 1), 12),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bankruptcy Observer ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const cases = data?.cases || data?.results || data?.data || [];
  if (!Array.isArray(cases) || !cases.length) {
    return { properties: [], source: 'bankruptcy-observer', live: true, message: null };
  }

  return {
    properties: cases.map(normalizeCase),
    source: 'bankruptcy-observer',
    live: true,
    message: 'Business bankruptcy filings (federal courts). Residential owner bankruptcy requires a paid data provider.',
  };
}

export function hasBankruptcyObserverToken() {
  return Boolean(getToken());
}

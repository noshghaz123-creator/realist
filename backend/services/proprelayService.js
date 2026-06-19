const PROPRELAY_BASE = 'https://api.proprelay.com/v1';

function getApiKey() {
  return process.env.PROPRELAY_API_KEY?.trim() || '';
}

function maskOwner(name) {
  if (!name) return 'Owner on file';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}***`;
  return `${parts[0]} ${parts[parts.length - 1][0]}***`;
}

function stageLabel(stage) {
  const map = {
    'pre-foreclosure': 'Pre-Foreclosure',
    auction: 'Auction Scheduled',
    reo: 'REO / Bank Owned',
  };
  return map[stage] || stage || 'Pre-Foreclosure';
}

function normalizeListing(item) {
  const asking = Number(item.asking_price) || null;
  const arv = Number(item.estimated_arv) || null;
  const equity = asking && arv ? Math.max(arv - asking, 0) : null;

  return {
    id: String(item.id || item.address),
    attomId: null,
    address: item.address || 'Address on file',
    city: item.city || '—',
    state: item.state || 'FL',
    zip: item.zip || '',
    propertyType: 'Residential',
    beds: item.bedrooms ?? null,
    baths: item.bathrooms ?? null,
    sqft: item.sqft ?? null,
    yearBuilt: null,
    assessedValue: asking,
    avmValue: arv,
    owner: {
      name: maskOwner(item.owner_name),
      ownerOccupied: null,
      mailingCity: null,
    },
    mortgage: {
      lender: null,
      balance: asking,
      originalAmount: null,
      interestRate: null,
      recordingDate: item.filing_date || null,
    },
    foreclosure: {
      status: stageLabel(item.stage),
      auctionDate: item.auction_date || null,
      defaultAmount: item.default_amount ? Number(item.default_amount) : null,
      recordingDate: item.filing_date || null,
      caseNumber: item.case_number || null,
    },
    equity: {
      amount: equity,
      ltv: asking && arv ? Math.round((asking / arv) * 1000) / 10 : null,
    },
    distressType: stageLabel(item.stage),
    bankruptcy: false,
    apn: null,
    source: 'proprelay',
    categories: ['foreclosure', 'records', 'mortgage', 'ownership', 'equity'],
  };
}

export async function getPropRelayForeclosures({ state = 'FL', limit = 6, stage } = {}) {
  const key = getApiKey();
  if (!key) return null;

  const params = new URLSearchParams({
    state,
    limit: String(Math.min(Math.max(limit, 1), 12)),
    sort: 'date_desc',
  });
  if (stage) params.set('stage', stage);

  const res = await fetch(`${PROPRELAY_BASE}/foreclosures?${params}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PropRelay ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const listings = data?.listings || [];
  if (!listings.length) return { properties: [], source: 'proprelay', live: true, message: null };

  return {
    properties: listings.map(normalizeListing),
    source: 'proprelay',
    live: true,
    message: null,
  };
}

export function hasPropRelayKey() {
  return Boolean(getApiKey());
}

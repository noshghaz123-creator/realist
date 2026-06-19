const BATCHDATA_SEARCH = 'https://api.batchdata.com/api/v1/property/search';

const FL_QUERIES = ['Miami, FL', 'Fort Lauderdale, FL', 'West Palm Beach, FL', 'Tampa, FL'];

const CATEGORY_QUICKLIST = {
  foreclosure: 'preforeclosure',
  bankruptcy: 'involuntary-lien',
  ownership: 'absentee-owner',
  equity: 'high-equity',
};

const CATEGORY_DATASETS = {
  all: ['core', 'foreclosure', 'owner', 'mortgage-liens', 'valuation', 'deed'],
  foreclosure: ['core', 'foreclosure', 'owner', 'mortgage-liens', 'valuation'],
  bankruptcy: ['core', 'foreclosure', 'owner', 'mortgage-liens', 'valuation'],
  records: ['core', 'deed', 'owner'],
  mortgage: ['core', 'mortgage-liens', 'owner', 'valuation'],
  ownership: ['core', 'owner', 'deed'],
  equity: ['core', 'valuation', 'mortgage-liens', 'owner'],
};

function getApiKey() {
  return process.env.BATCHDATA_API_KEY?.trim() || '';
}

export function hasBatchDataKey() {
  return Boolean(getApiKey());
}

function headers() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

function dig(obj, ...paths) {
  for (const path of paths) {
    let cur = obj;
    for (const key of path.split('.')) {
      cur = cur?.[key];
      if (cur == null) break;
    }
    if (cur != null && cur !== '') return cur;
  }
  return null;
}

function formatMoney(n) {
  const v = Number(n);
  if (!v || Number.isNaN(v)) return null;
  return Math.round(v);
}

function maskOwner(name) {
  if (!name) return 'Owner on file';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}***`;
  return `${parts[0]} ${parts[parts.length - 1][0]}***`;
}

function firstLien(prop) {
  const liens = prop.openLien || prop.openLiens || prop.mortgageLiens || prop['mortgage-liens'];
  if (Array.isArray(liens)) return liens[0] || null;
  if (liens && typeof liens === 'object') return liens;
  return null;
}

function inferCategories(raw, quickList) {
  const cats = new Set(['records']);
  const fc = raw.foreclosure || {};
  if (
    quickList === 'preforeclosure' ||
    fc.status ||
    fc.auctionDate ||
    fc.noticeType ||
    fc.isPreForeclosure
  ) {
    cats.add('foreclosure');
  }
  if (quickList === 'involuntary-lien' || raw.involuntaryLien || raw.involuntaryLiens?.length) {
    cats.add('bankruptcy');
  }
  const lien = firstLien(raw);
  if (lien?.lenderName || lien?.amount || lien?.loanAmount || raw.mortgage) {
    cats.add('mortgage');
  }
  if (raw.owner?.fullName || raw.owner?.names || raw.owner?.mailingAddress) {
    cats.add('ownership');
  }
  const equity = dig(raw, 'valuation.equity', 'valuation.estimatedEquity', 'intel.equity');
  const ltv = dig(raw, 'valuation.ltv', 'valuation.loanToValue');
  if (equity != null || ltv != null || quickList === 'high-equity') cats.add('equity');
  return [...cats];
}

function normalizeProperty(raw, quickList) {
  const addr = raw.address || raw.propertyAddress || {};
  const building = raw.building || raw.propertyBuilding || {};
  const owner = raw.owner || {};
  const valuation = raw.valuation || raw.valuations || {};
  const fc = raw.foreclosure || {};
  const lien = firstLien(raw);

  const ownerName =
    dig(owner, 'fullName') ||
    (Array.isArray(owner.names) ? owner.names[0] : null) ||
    dig(owner, 'name') ||
    null;

  const street =
    dig(addr, 'street', 'line1', 'full', 'formattedStreet') ||
    [addr.houseNumber, addr.streetName].filter(Boolean).join(' ') ||
    'Address on file';

  const avmValue = formatMoney(
    dig(valuation, 'estimatedValue', 'avm', 'amount', 'value') ||
      dig(raw, 'intel.estimatedValue')
  );
  const assessedValue = formatMoney(
    dig(raw, 'assessment.totalAssessedValue', 'assessment.assessedValue', 'tax.assessedValue')
  );
  const loanBalance = formatMoney(
    dig(lien, 'loanAmount', 'amount', 'balance') || dig(fc, 'loanBalance', 'unpaidBalance')
  );
  const equityAmount = formatMoney(
    dig(valuation, 'equity', 'estimatedEquity') ||
      (avmValue && loanBalance ? avmValue - loanBalance : null)
  );

  const normalized = {
    id: String(dig(raw, 'id', '_id', 'propertyId', 'address.hash') || street),
    attomId: null,
    address: street,
    city: dig(addr, 'city', 'locality') || '—',
    state: dig(addr, 'state', 'stateCode') || 'FL',
    zip: dig(addr, 'zip', 'zipCode', 'postalCode') || '',
    propertyType: dig(building, 'propertyType', 'type') || dig(raw, 'general.propertyType') || 'Residential',
    beds: dig(building, 'bedroomCount', 'bedrooms', 'beds') ?? null,
    baths: dig(building, 'bathroomCount', 'bathrooms', 'baths') ?? null,
    sqft: formatMoney(dig(building, 'livingAreaSquareFeet', 'squareFeet', 'livingArea')) ?? null,
    yearBuilt: dig(building, 'yearBuilt') ?? null,
    assessedValue,
    avmValue,
    owner: {
      name: maskOwner(ownerName),
      ownerOccupied: owner.ownerOccupied ?? owner.isOwnerOccupied ?? null,
      mailingCity: dig(owner, 'mailingAddress.city', 'mailingCity') || null,
    },
    mortgage: {
      lender: dig(lien, 'lenderName', 'lender', 'companyName') || dig(fc, 'lenderName') || null,
      balance: loanBalance,
      originalAmount: formatMoney(dig(lien, 'originalLoanAmount', 'originalAmount')),
      interestRate: dig(lien, 'interestRate') || null,
      recordingDate: dig(lien, 'recordingDate', 'documentDate') || null,
    },
    foreclosure: {
      status:
        dig(fc, 'status', 'stage', 'documentType') ||
        (quickList === 'preforeclosure' ? 'Pre-Foreclosure' : null),
      auctionDate: dig(fc, 'auctionDate', 'saleDate', 'scheduledSaleDate') || null,
      defaultAmount: formatMoney(dig(fc, 'defaultAmount', 'unpaidBalance', 'pastDueAmount')),
      recordingDate: dig(fc, 'recordingDate', 'filingDate', 'documentDate') || null,
      caseNumber: dig(fc, 'caseNumber', 'documentNumber') || null,
    },
    equity: {
      amount: equityAmount,
      ltv: dig(valuation, 'ltv', 'loanToValue') || null,
    },
    distressType: dig(fc, 'status', 'documentType') || (quickList === 'involuntary-lien' ? 'Involuntary Lien' : null),
    bankruptcy: quickList === 'involuntary-lien' || Boolean(raw.involuntaryLien),
    apn: dig(raw, 'ids.apn', 'legal.apn', 'apn') || null,
    source: 'batchdata',
  };

  normalized.categories = inferCategories(raw, quickList);
  return normalized;
}

async function batchSearch({ query, quickList, category, take }) {
  const searchCriteria = { query };
  if (quickList) searchCriteria.quickList = quickList;

  const body = {
    searchCriteria,
    options: {
      skip: 0,
      take: Math.min(Math.max(take, 1), 12),
      datasets: CATEGORY_DATASETS[category] || CATEGORY_DATASETS.all,
    },
  };

  const res = await fetch(BATCHDATA_SEARCH, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`BatchData invalid JSON (${res.status})`);
  }

  if (!res.ok) {
    const msg = data?.status?.message || data?.message || text.slice(0, 200);
    throw new Error(`BatchData ${res.status}: ${msg}`);
  }

  const properties =
    data?.results?.properties ||
    data?.results?.results ||
    data?.properties ||
    [];

  return { properties, meta: data?.meta, warnings: data?.warnings };
}

export async function getBatchDataProperties({ category = 'all', limit = 6 } = {}) {
  const key = getApiKey();
  if (!key) return null;

  const cap = Math.min(Math.max(Number(limit) || 6, 1), 12);
  const quickList = CATEGORY_QUICKLIST[category] || null;

  for (const query of FL_QUERIES) {
    try {
      const { properties, warnings } = await batchSearch({ query, quickList, category, take: cap });
      if (!properties.length) continue;

      const normalized = properties.map((p) => normalizeProperty(p, quickList));
      const filtered =
        category === 'all'
          ? normalized
          : normalized.filter((p) => p.categories.includes(category));

      if (filtered.length) {
        return {
          properties: filtered.slice(0, cap),
          source: 'batchdata',
          live: true,
          message: warnings?.length
            ? 'Some datasets filtered by your BatchData plan — upgrade for full foreclosure/bankruptcy fields.'
            : null,
        };
      }
    } catch (err) {
      if (FL_QUERIES.indexOf(query) === FL_QUERIES.length - 1) throw err;
      console.error(`BatchData search failed for ${query}:`, err.message);
    }
  }

  return {
    properties: [],
    source: 'batchdata',
    live: true,
    message: `No ${category} properties found in Florida for your BatchData plan.`,
  };
}

export async function testBatchDataKey() {
  const key = getApiKey();
  if (!key) return { ok: false, error: 'BATCHDATA_API_KEY not set in backend/.env' };

  try {
    const result = await batchSearch({
      query: 'Miami, FL',
      quickList: null,
      category: 'all',
      take: 1,
    });
    return {
      ok: true,
      count: result.properties.length,
      message: `${result.properties.length} property returned — BatchData is ready.`,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

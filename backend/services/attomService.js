import { ATTOM_SAMPLE_PROPERTIES } from '../data/attomSampleData.js';

const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

const FL_ZIPS = ['33101', '33301', '33432', '33004', '33019', '33139', '33441'];

const CATEGORY_MAP = {
  foreclosure: 'Foreclosure',
  bankruptcy: 'Bankruptcy',
  records: 'Property Records',
  mortgage: 'Mortgage Information',
  ownership: 'Ownership Data',
  equity: 'Equity Data',
};

function getAttomApiKey() {
  return process.env.ATTOM_API_KEY?.trim() || '';
}

function attomHeaders() {
  return {
    Accept: 'application/json',
    apikey: getAttomApiKey(),
  };
}

async function attomFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${ATTOM_BASE}${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: attomHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ATTOM ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function maskOwner(name) {
  if (!name) return 'Owner on file';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}***`;
  return `${parts[0]} ${parts[parts.length - 1][0]}***`;
}

function formatMoney(n) {
  const v = Number(n);
  if (!v || Number.isNaN(v)) return null;
  return Math.round(v);
}

function inferCategories(raw) {
  const cats = new Set(['records']);
  if (raw.foreclosure?.status || raw.foreclosure?.auctionDate || raw.distressType?.toLowerCase().includes('foreclosure')) {
    cats.add('foreclosure');
  }
  if (raw.distressType?.toLowerCase().includes('bankruptcy') || raw.bankruptcy) {
    cats.add('bankruptcy');
  }
  if (raw.mortgage?.balance || raw.mortgage?.lender || raw.mortgage?.originalAmount) {
    cats.add('mortgage');
  }
  if (raw.owner?.name) cats.add('ownership');
  if (raw.equity?.amount != null || raw.equity?.ltv != null) cats.add('equity');
  return [...cats];
}

function normalizeAttomProperty(prop, extras = {}) {
  const id = prop.identifier?.attomId || prop.identifier?.obPropId || prop.identifier?.Id;
  const addr = prop.address || {};
  const building = prop.building || {};
  const rooms = building.rooms || {};
  const size = building.size || {};
  const owner = prop.owner || prop.ownership || {};
  const mortgage = (prop.mortgage || prop.mortgages || [])[0] || prop.mortgage || {};
  const assessment = prop.assessment || prop.assessment?.assessed || {};
  const avm = prop.avm || prop.valuation || {};
  const foreclosure = extras.foreclosure || prop.foreclosure || {};
  const equity = extras.equity || prop.homeEquity || prop.equity || {};

  const ownerName =
    owner.owner1?.fullName ||
    owner.owner1?.lastnamecompanyname ||
    owner.fullName ||
    owner.name ||
    foreclosure.borrowerNameOwner ||
    null;

  const distressType = foreclosure.distressType || extras.distressType || null;

  const normalized = {
    id: String(id || addr.oneLine || Math.random()),
    attomId: id,
    address: addr.line1 || addr.oneLine || 'Address on file',
    city: addr.locality || addr.city || '—',
    state: addr.countrySubd || addr.state || 'FL',
    zip: addr.postal1 || addr.postalCode || '',
    propertyType: prop.summary?.propclass || prop.summary?.proptype || 'Residential',
    beds: rooms.beds ?? rooms.bedsTotal ?? null,
    baths: rooms.bathstotal ?? rooms.bathsTotal ?? null,
    sqft: size.universalsize ?? size.livingSize ?? null,
    yearBuilt: prop.summary?.yearbuilt ?? null,
    assessedValue: formatMoney(assessment.assessed?.assdttlvalue || assessment.market?.mktttlvalue),
    avmValue: formatMoney(avm.amount?.value || avm.value),
    owner: {
      name: maskOwner(ownerName),
      ownerOccupied: owner.ownerOccupied ?? owner.absenteeIndicator === 'N',
      mailingCity: owner.mailing?.city || null,
    },
    mortgage: {
      lender: mortgage.lender?.lastnamecompanyname || mortgage.lenderName || foreclosure.lenderNameFullStandardized || null,
      balance: formatMoney(mortgage.amount || mortgage.loanBalance || foreclosure.loanBalance),
      originalAmount: formatMoney(mortgage.originalLoanAmount || foreclosure.originalLoanAmount),
      interestRate: mortgage.interestRate || foreclosure.originalLoanInterestRate || null,
      recordingDate: mortgage.recordingDate || foreclosure.originalLoanRecordingDate || null,
    },
    foreclosure: {
      status: foreclosure.status || (foreclosure.auctionDate ? 'Pre-Foreclosure' : distressType || null),
      auctionDate: foreclosure.auctionDate || foreclosure.auctionDateTime || null,
      defaultAmount: formatMoney(foreclosure.defaultAmount || foreclosure.delinquentAmount),
      recordingDate: foreclosure.foreclosureRecordingDate || null,
      caseNumber: foreclosure.caseNumber || null,
    },
    equity: {
      amount: formatMoney(equity.estimatedEquity || equity.equity || equity.amount),
      ltv: equity.ltv || equity.loanToValue || null,
    },
    distressType,
    bankruptcy: distressType?.toLowerCase().includes('bankruptcy') || false,
    apn: prop.identifier?.apn || null,
    source: 'attom',
  };

  normalized.categories = inferCategories(normalized);
  return normalized;
}

function getSampleProperties() {
  return ATTOM_SAMPLE_PROPERTIES.map((p) => ({ ...p, source: 'attom-sample' }));
}

async function enrichProperty(prop) {
  const attomId = prop.identifier?.attomId || prop.identifier?.obPropId;
  if (!attomId) return normalizeAttomProperty(prop);

  const extras = {};
  try {
    const [fc, eq] = await Promise.all([
      attomFetch('/preforeclosuredetails', { attomId }).catch(() => null),
      attomFetch('/valuation/homeequity', { ID: attomId }).catch(() => null),
    ]);
    const fcProp = fc?.property?.[0] || fc?.foreclosure?.[0];
    if (fcProp) {
      extras.foreclosure = fcProp.auction || fcProp.default || fcProp;
      extras.distressType = fcProp.default?.distressType;
    }
    const eqProp = eq?.property?.[0] || eq?.homeEquity?.[0];
    if (eqProp) extras.equity = eqProp.homeEquity || eqProp;
  } catch {
    /* enrichment optional */
  }
  return normalizeAttomProperty(prop, extras);
}

export async function getAttomProperties({ category = 'all', limit = 6 } = {}) {
  const cap = Math.min(Math.max(Number(limit) || 6, 1), 12);

  if (!getAttomApiKey()) {
    const sample = getSampleProperties();
    const filtered =
      category === 'all'
        ? sample
        : sample.filter((p) => p.categories.includes(category));
    return {
      properties: filtered.slice(0, cap),
      source: 'attom-sample',
      live: false,
      message: null,
    };
  }

  try {
    const zip = FL_ZIPS[Math.floor(Math.random() * FL_ZIPS.length)];
    const data = await attomFetch('/property/detailmortgageowner', {
      postalCode: zip,
      pagesize: String(cap + 2),
    });

    const rawList = data?.property || [];
    if (!rawList.length) throw new Error('No properties returned from ATTOM');

    const enriched = await Promise.all(rawList.slice(0, cap).map((p) => enrichProperty(p)));
    const filtered =
      category === 'all'
        ? enriched
        : enriched.filter((p) => p.categories.includes(category));

    return {
      properties: filtered.slice(0, cap),
      source: 'attom',
      live: true,
      message: null,
    };
  } catch (err) {
    console.error('ATTOM live fetch failed, using sample:', err.message);
    const sample = getSampleProperties();
    const filtered =
      category === 'all'
        ? sample
        : sample.filter((p) => p.categories.includes(category));
    return {
      properties: filtered.slice(0, cap),
      source: 'attom-sample',
      live: false,
      message: 'Live ATTOM unavailable — showing sample data',
    };
  }
}

export { CATEGORY_MAP };

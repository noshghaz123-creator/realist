import { countyNameToFips, fipsToCountyName } from '../data/floridaCountyFips.js';

/** Official PropertyRadar fieldsets — more reliable than a long custom field list */
export const PROPERTY_RADAR_FIELD_SETS = ['Overview', 'GridImport', 'Card'];

/** Legacy explicit fields kept for reference / export labels only */
export const PROPERTY_RADAR_FIELDS = [
  'RadarID', 'Address', 'FullAddress', 'City', 'State', 'ZipFive', 'County', 'APN', 'FIPS',
  'Owner', 'OwnerFirstName', 'OwnerLastName',
  'PrimaryName', 'PrimaryFirstName', 'PrimaryLastName',
  'OwnerAddress', 'OwnerCity', 'OwnerState', 'OwnerZipFive',
  'Latitude', 'Longitude', 'PType', 'AdvancedPropertyType', 'Beds', 'Baths', 'SqFt',
  'LotSize', 'LotSizeAcres', 'YearBuilt', 'AVM', 'AssessedValue', 'TotalLoanBalance',
  'AvailableEquity', 'EquityPercent', 'LastTransferRecDate', 'LastTransferValue',
  'LastTransferType', 'ListingPrice', 'ListingDate', 'ListingStatus',
  'isSiteVacant', 'isPreforeclosure', 'inTaxDelinquency', 'inBankruptcyProperty',
  'isSameMailingOrExempt', 'ForeclosureStage', 'PhoneAvailability', 'EmailAvailability',
  '_links',
];

function coercePropertyValue(val) {
  if (val === undefined || val === null || val === '') return null;
  if (Array.isArray(val)) {
    for (const item of val) {
      const coerced = coercePropertyValue(item);
      if (coerced !== null && coerced !== '') return coerced;
    }
    return null;
  }
  if (typeof val === 'object') {
    if (val.value !== undefined) return coercePropertyValue(val.value);
    if (val.Value !== undefined) return coercePropertyValue(val.Value);
    if (val.label !== undefined) return coercePropertyValue(val.label);
    if (val.Label !== undefined) return coercePropertyValue(val.Label);
  }
  return val;
}

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    const val = coercePropertyValue(obj[key]);
    if (val !== undefined && val !== null && val !== '') return val;
  }
  const byLower = {};
  for (const [k, v] of Object.entries(obj)) {
    byLower[k.toLowerCase()] = v;
  }
  for (const key of keys) {
    const val = coercePropertyValue(byLower[key.toLowerCase()]);
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return null;
}

function parseLinksObject(links) {
  if (!links) return null;
  if (typeof links === 'string') {
    try {
      return JSON.parse(links);
    } catch {
      return { href: links };
    }
  }
  return links;
}

function flattenRecordKeys(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const flat = { ...raw };
  for (const [key, value] of Object.entries(raw)) {
    if (!key.includes('.')) continue;
    const shortKey = key.split('.').pop();
    if (shortKey && (flat[shortKey] == null || flat[shortKey] === '')) {
      flat[shortKey] = value;
    }
  }
  return flat;
}

/** PropertyRadar may return nested objects or RadarID-only rows */
export function unwrapPropertyRadarRecord(raw) {
  if (raw == null) return {};
  if (typeof raw === 'string' || typeof raw === 'number') {
    return { RadarID: String(raw) };
  }
  if (typeof raw !== 'object') return {};

  let base = flattenRecordKeys(raw);

  const nested = [
    base.Property,
    base.property,
    base.Properties,
    base.properties,
    base.fields,
    base.Fields,
    base.data,
    base.Data,
    base.result,
    base.Result,
    base.attributes,
    base.Attributes,
  ].filter((part) => part && typeof part === 'object' && !Array.isArray(part));

  if (nested.length) {
    base = flattenRecordKeys({ ...nested[0], ...base });
  }

  return base;
}

function normalizeState(value) {
  const raw = coercePropertyValue(value);
  if (raw === undefined || raw === null || raw === '') return 'FL';

  const numeric = Number(raw);
  if (numeric === 12) return 'FL';

  const s = String(raw).trim().toUpperCase();
  if (!s || s === 'FL' || s === 'FLORIDA' || s === '12') return 'FL';
  if (s.includes('FLORIDA')) return 'FL';
  return s;
}

function extractRadarIdFromLinks(raw) {
  const links = parseLinksObject(raw?._links);
  if (!links) return null;

  const candidates = [];
  if (typeof links === 'string') candidates.push(links);
  if (typeof links === 'object') {
    for (const val of Object.values(links)) {
      if (typeof val === 'string') candidates.push(val);
      if (val?.href) candidates.push(val.href);
    }
  }

  for (const href of candidates) {
    const match = String(href).match(/\/properties\/([^/?#]+)/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

function resolveRadarId(source) {
  const direct = pick(source, 'RadarID', 'radarId', 'RadarId', 'PropertyRadarID');
  if (direct) return String(direct).trim();

  const fromLinks = extractRadarIdFromLinks(source);
  if (fromLinks) return fromLinks;

  const propertyKey = pick(source, 'PropertyKey');
  if (propertyKey != null) return `pk-${propertyKey}`;

  if (source?._syntheticId) return String(source._syntheticId);

  return '';
}

function buildFallbackRadarId(mapped, raw) {
  const apn = pick(raw, 'APN', 'apn');
  if (apn) return `apn-${String(apn).replace(/\s+/g, '')}`;
  const parts = [
    mapped.propertyAddress || mapped.street,
    mapped.city,
    mapped.zip,
    mapped.county,
  ]
    .filter(Boolean)
    .join('|');
  if (parts) {
    return `fl-${Buffer.from(parts).toString('base64url').slice(0, 40)}`;
  }
  const fingerprint = JSON.stringify(raw);
  if (fingerprint && fingerprint !== '{}') {
    return `fl-${Buffer.from(fingerprint).toString('base64url').slice(0, 40)}`;
  }
  return '';
}

function toNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ownerName(raw) {
  const first = pick(raw, 'OwnerFirstName', 'PrimaryFirstName');
  const last = pick(raw, 'OwnerLastName', 'PrimaryLastName');
  if (first || last) return [first, last].filter(Boolean).join(' ').trim();
  return pick(raw, 'Owner', 'PrimaryName', 'OwnerName', 'FullName');
}

function ownerPhone(raw) {
  return pick(
    raw,
    'PrimaryPhone1',
    'PrimaryMobilePhone1',
    'OwnerPhone',
    'PrimaryContactPhone',
    'PrimaryPhone',
    'Phone',
    'OwnerPhoneNumber',
    'CellPhone',
    'HomePhone'
  );
}

function ownerEmail(raw) {
  return pick(
    raw,
    'PrimaryEmail1',
    'OwnerEmail',
    'PrimaryContactEmail',
    'PrimaryEmail',
    'Email',
    'OwnerEmailAddress'
  );
}

/** Accept any row returned from a Florida PropertyRadar search */
export function qualifiesProperty(lead, { trustFloridaSearch = false } = {}) {
  if (!lead || typeof lead !== 'object') return false;

  const state = normalizeState(lead.state);
  if (state !== 'FL' && !trustFloridaSearch) return false;

  return Boolean(
    String(lead.radarId || '').trim() ||
    String(lead.propertyAddress || lead.street || '').trim() ||
    String(lead.city || '').trim() ||
    String(lead.zip || '').trim() ||
    String(lead.apn || '').trim() ||
    String(lead.county || '').trim() ||
    String(lead.ownerName || '').trim()
  );
}

/** Owner name + phone + valid email (best quality lead) */
export function hasFullContact(lead) {
  if (!qualifiesProperty(lead)) return false;
  if (!String(lead.ownerName || '').trim()) return false;
  if (!String(lead.ownerPhone || '').trim()) return false;
  const email = String(lead.ownerEmail || '').trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function contactScore(lead) {
  if (hasFullContact(lead)) return 3;
  if (String(lead.ownerName || '').trim()) return 2;
  if (String(lead.ownerPhone || '').trim() || String(lead.ownerEmail || '').trim()) return 2;
  return 1;
}

export function mapPropertyRadarRecord(raw, { cacheKey, featured = false } = {}) {
  const source = unwrapPropertyRadarRecord(raw);
  let radarId = resolveRadarId(source);
  const avm = toNumber(pick(source, 'AVM', 'AssessedValue', 'MyValue'));
  const loan = toNumber(pick(source, 'TotalLoanBalance', 'OpenLienBalance', 'MortgageBalance'));
  const equity = toNumber(pick(source, 'AvailableEquity')) ?? (avm != null && loan != null ? avm - loan : null);
  const equityPct = toNumber(pick(source, 'EquityPercent'));
  const computedPct =
    equityPct ??
    (avm && equity != null && avm > 0 ? Math.round((equity / avm) * 1000) / 10 : null);

  const mapped = {
    radarId,
    cacheKey,
    featured,
    ownerName: ownerName(source),
    ownerPhone: ownerPhone(source),
    ownerEmail: ownerEmail(source),
    propertyAddress: pick(source, 'FullAddress', 'Address', 'SiteAddress', 'propertyAddress'),
    street: pick(source, 'Address', 'SiteAddress', 'Street', 'FullAddress'),
    city: pick(source, 'City'),
    state: normalizeState(pick(source, 'State', 'state')),
    zip: pick(source, 'ZipFive', 'Zip', 'ZipCode')?.toString?.() ?? pick(source, 'ZipFive', 'Zip'),
    county: (() => {
      const countyVal = pick(source, 'County', 'FIPS', 'fips');
      if (countyVal == null || countyVal === '') return null;
      if (/^\d+$/.test(String(countyVal))) return fipsToCountyName(countyVal);
      return countyVal;
    })(),
    latitude: toNumber(pick(source, 'Latitude', 'Lat')),
    longitude: toNumber(pick(source, 'Longitude', 'Lng', 'Lon')),
    propertyType: pick(source, 'PType', 'PropertyType', 'AdvancedPropertyType'),
    bedrooms: toNumber(pick(source, 'Beds', 'Bedrooms')),
    bathrooms: toNumber(pick(source, 'Baths', 'Bathrooms')),
    livingArea: toNumber(pick(source, 'SqFt', 'LivingArea', 'BuildingArea')),
    lotSize: toNumber(pick(source, 'LotSize', 'LotSizeAcres')),
    yearBuilt: toNumber(pick(source, 'YearBuilt')),
    estimatedValue: avm,
    mortgageBalance: loan,
    equity,
    equityPercentage: computedPct,
    purchaseDate: toDate(pick(source, 'LastTransferRecDate', 'PurchaseDate')),
    purchasePrice: toNumber(pick(source, 'LastTransferValue', 'PurchasePrice')),
    ownerOccupied: Boolean(pick(source, 'isSameMailingOrExempt', 'OwnerOccupied')),
    vacant: Boolean(pick(source, 'isSiteVacant', 'Vacant')),
    mlsStatus: pick(source, 'ListingStatus', 'MLSStatus', 'StatusLevel'),
    taxStatus: pick(source, 'inTaxDelinquency', 'DelinquentYear', 'TaxStatus', 'TaxDelinquent'),
    preForeclosure: Boolean(pick(source, 'isPreforeclosure', 'PreForeclosure', 'inForeclosure')),
    bankruptcy: Boolean(pick(source, 'inBankruptcyProperty', 'isBankruptcy', 'Bankruptcy')),
    lienInformation: pick(source, 'PropertyHasOpenLiens', 'NumberLoans', 'LienCount')?.toString?.() ?? null,
    lastSaleDate: toDate(pick(source, 'LastTransferRecDate', 'SaleDate', 'LastSaleDate')),
    lastSalePrice: toNumber(pick(source, 'LastTransferValue', 'SaleAmount', 'LastSalePrice')),
    apn: pick(source, 'APN'),
    leadStatus: 'active',
    source: 'propertyradar',
    rawData: source,
  };

  if (!mapped.radarId) {
    mapped.radarId = buildFallbackRadarId(mapped, source);
  }

  return mapped;
}

export function hasDistressFilters(filters = {}) {
  return ['preForeclosure', 'bankruptcy', 'taxDelinquent'].some(
    (key) => filters[key] === true || filters[key] === 'true'
  );
}

const DISTRESS_CRITERIA_MAP = [
  ['preForeclosure', 'Preforeclosure'],
  ['bankruptcy', 'Bankruptcy'],
  ['taxDelinquent', 'TaxDelinquent'],
];

function isTruthyDistressFlag(val) {
  if (val === true || val === 1 || val === '1') return true;
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s || /^(no|false|0|none)$/i.test(s)) return false;
    return true;
  }
  return false;
}

export function matchesDistressPostFilters(mapped, filters = {}) {
  if (filters.preForeclosure === true || filters.preForeclosure === 'true') {
    if (!mapped.preForeclosure) return false;
  }
  if (filters.bankruptcy === true || filters.bankruptcy === 'true') {
    if (!mapped.bankruptcy) return false;
  }
  if (filters.taxDelinquent === true || filters.taxDelinquent === 'true') {
    const taxFlag =
      mapped.taxStatus ??
      pick(mapped.rawData || {}, 'inTaxDelinquency', 'DelinquentYear', 'TaxDelinquent');
    if (!isTruthyDistressFlag(taxFlag)) return false;
  }
  return true;
}

function appendDistressCriteria(criteria, filters) {
  const values = DISTRESS_CRITERIA_MAP.filter(
    ([key]) => filters[key] === true || filters[key] === 'true'
  ).map(([, label]) => label);

  if (values.length) {
    criteria.push({ name: 'InDistress', value: values });
  }
}

export function buildSearchCriteria(filters = {}, { omitDistress = false } = {}) {
  const criteria = [];

  // Florida only — always enforced
  criteria.push({ name: 'State', value: ['FL'] });

  // PhoneAvailability / EmailAvailability require a higher PropertyRadar plan — filter after fetch instead.

  if (filters.county) {
    const fips = countyNameToFips(filters.county);
    if (fips) {
      criteria.push({ name: 'County', value: [fips] });
    }
  }
  if (filters.city) criteria.push({ name: 'City', value: [filters.city] });
  if (filters.zipCode) {
    const zip = Number(String(filters.zipCode).replace(/\D/g, '').slice(0, 5));
    if (zip) criteria.push({ name: 'ZipFive', value: [zip] });
  }

  const ptype = filters.propertyType || 'both';
  if (ptype === 'both') {
    criteria.push({
      name: 'PropertyType',
      value: [{ name: 'PType', value: ['SFR', 'MFR'] }],
    });
  } else if (ptype === 'SFR' || ptype === 'sfr') {
    criteria.push({
      name: 'PropertyType',
      value: [{ name: 'PType', value: ['SFR'] }],
    });
  } else if (ptype === 'MFR' || ptype === 'mfr') {
    criteria.push({
      name: 'PropertyType',
      value: [{ name: 'PType', value: ['MFR'] }],
    });
  }

  if (filters.bedrooms) {
    const beds = numOrNull(filters.bedrooms);
    if (beds != null) criteria.push({ name: 'Beds', value: [[beds, null]] });
  }
  if (filters.bathrooms) {
    const baths = numOrNull(filters.bathrooms);
    if (baths != null) criteria.push({ name: 'Baths', value: [[baths, null]] });
  }

  const avmMin = numOrNull(filters.priceMin) ?? numOrNull(filters.estimatedValueMin);
  let avmMax = numOrNull(filters.priceMax) ?? numOrNull(filters.estimatedValueMax);
  if (avmMin != null || avmMax != null) {
    criteria.push({ name: 'AVM', value: [[avmMin, avmMax]] });
  }

  const mortgageMin = numOrNull(filters.mortgageBalanceMin);
  const mortgageMax = numOrNull(filters.mortgageBalanceMax);
  if (mortgageMin != null || mortgageMax != null) {
    criteria.push({
      name: 'TotalLoanBalance',
      value: [[mortgageMin, mortgageMax]],
    });
  }

  let equityMin = numOrNull(filters.equityMin);
  const equityMax = numOrNull(filters.equityMax);
  if (filters.highEquity === true || filters.highEquity === 'true') {
    equityMin = equityMin != null ? Math.max(equityMin, 100000) : 100000;
  }
  if (equityMin != null || equityMax != null) {
    criteria.push({
      name: 'AvailableEquity',
      value: [[equityMin, equityMax]],
    });
  }
  if (filters.ownerOccupied === true || filters.ownerOccupied === 'true') {
    criteria.push({ name: 'isSameMailingOrExempt', value: [1] });
  }
  if (filters.vacant === true || filters.vacant === 'true') {
    criteria.push({ name: 'isSiteVacant', value: [1] });
  }
  if (!omitDistress) {
    appendDistressCriteria(criteria, filters);
  }

  return criteria;
}

function numOrNull(value) {
  if (value === '' || value == null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Try progressively wider searches when strict filters return nothing */
export function buildFilterFallbacks(filters = {}) {
  const full = { ...filters, state: 'FL' };
  const withLocation = { state: 'FL' };
  if (filters.county) withLocation.county = filters.county;
  if (filters.city) withLocation.city = filters.city;
  if (filters.propertyType && filters.propertyType !== 'both') {
    withLocation.propertyType = filters.propertyType;
  }

  const countyOnly = { state: 'FL' };
  if (filters.county) countyOnly.county = filters.county;

  const cityOnly = { state: 'FL' };
  if (filters.city) cityOnly.city = filters.city;

  const steps = [
    full,
    withLocation,
    Object.keys(countyOnly).length > 1 ? countyOnly : null,
    Object.keys(cityOnly).length > 1 ? cityOnly : null,
    { state: 'FL', propertyType: 'both' },
    { state: 'FL' },
  ].filter(Boolean);

  const seen = new Set();
  return steps.filter((step) => {
    const key = JSON.stringify(step);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function flattenForExport(lead) {
  const raw = lead.rawData && typeof lead.rawData === 'object' ? lead.rawData : {};
  const base = {
    Owner: lead.ownerName,
    OwnerPhone: lead.ownerPhone,
    OwnerEmail: lead.ownerEmail,
    Address: lead.propertyAddress || lead.street,
    Street: lead.street,
    City: lead.city,
    State: lead.state,
    Zip: lead.zip,
    County: lead.county,
    Bedrooms: lead.bedrooms,
    Bathrooms: lead.bathrooms,
    LivingArea: lead.livingArea,
    LotSize: lead.lotSize,
    YearBuilt: lead.yearBuilt,
    EstimatedValue: lead.estimatedValue,
    MortgageBalance: lead.mortgageBalance,
    Equity: lead.equity,
    EquityPercentage: lead.equityPercentage,
    PurchaseDate: lead.purchaseDate,
    PurchasePrice: lead.purchasePrice,
    OwnerOccupied: lead.ownerOccupied,
    Vacant: lead.vacant,
    Bankruptcy: lead.bankruptcy,
    PreForeclosure: lead.preForeclosure,
    TaxStatus: lead.taxStatus,
    Latitude: lead.latitude,
    Longitude: lead.longitude,
    APN: lead.apn,
    PropertyType: lead.propertyType,
    MLSStatus: lead.mlsStatus,
    LastSaleDate: lead.lastSaleDate,
    LastSalePrice: lead.lastSalePrice,
    LienInformation: lead.lienInformation,
    RadarID: lead.radarId,
    Source: lead.source,
    CreatedAt: lead.createdAt,
    UpdatedAt: lead.updatedAt,
  };

  const merged = { ...raw, ...base };
  Object.keys(raw).forEach((k) => {
    if (!(k in base)) merged[k] = raw[k];
  });
  return merged;
}

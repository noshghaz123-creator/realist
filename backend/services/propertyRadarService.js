import { PROPERTY_RADAR_FIELD_SETS } from '../utils/propertyRadarMapper.js';

const BASE_URL = 'https://api.propertyradar.com/v1';

function getApiKey() {
  return process.env.PROPERTYRADAR_API_KEY?.trim() || '';
}

export function hasPropertyRadarKey() {
  return Boolean(getApiKey());
}

export function maskApiKey(key = getApiKey()) {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function parsePropertyRadarError(data, status) {
  if (!data || typeof data !== 'object') {
    return `PropertyRadar request failed (${status})`;
  }

  const parts = [
    data.error,
    data.error_description,
    data.message,
    data.detail,
    typeof data.errors === 'string' ? data.errors : null,
  ].filter(Boolean);

  if (parts.length) return parts.join(' — ');

  if (data.error && data.error_description) {
    return `${data.error}: ${data.error_description}`;
  }

  return `PropertyRadar request failed (${status})`;
}

function rowsFromColumnarResults(data) {
  const block = data?.results;
  if (!block || Array.isArray(block) || typeof block !== 'object') return null;

  const keys = Object.keys(block);
  const arrayKeys = keys.filter((key) => Array.isArray(block[key]));
  if (!arrayKeys.length) return null;

  const rowCount = Math.max(...arrayKeys.map((key) => block[key].length));
  if (!rowCount) return null;

  const rows = [];
  for (let i = 0; i < rowCount; i += 1) {
    const row = {};
    for (const key of keys) {
      const cleanKey = key.includes('.') ? key.split('.').pop() : key;
      row[cleanKey] = Array.isArray(block[key]) ? block[key][i] : block[key];
    }
    rows.push(row);
  }
  return rows;
}

function normalizePropertyRadarResults(data) {
  const columnar = rowsFromColumnarResults(data);
  const rawList = columnar
    ?? (Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.properties)
        ? data.properties
        : Array.isArray(data?.data)
          ? data.data
          : []);

  return rawList.map((item) => {
    if (item == null) return {};
    if (typeof item === 'string' || typeof item === 'number') {
      return { RadarID: String(item) };
    }
    return item;
  });
}

export async function searchPropertyRadar({ criteria, purchase = 1, limit = 25, start = 0 }) {
  const key = getApiKey();
  if (!key) {
    throw new Error('PropertyRadar API key is not configured on the server.');
  }

  const params = new URLSearchParams({
    Purchase: String(purchase),
    Limit: String(limit),
    Start: String(start),
  });
  PROPERTY_RADAR_FIELD_SETS.forEach((fieldSet) => params.append('Fields', fieldSet));

  const res = await fetch(`${BASE_URL}/properties?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ Criteria: criteria }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parsePropertyRadarError(data, res.status));
  }

  const results = normalizePropertyRadarResults(data);

  return {
    results,
    resultCount: data.resultCount ?? results.length ?? 0,
    totalCount:
      data.totalResultCount ??
      data.totalCount ??
      data.resultCount ??
      results.length ??
      0,
    totalCost: data.totalCost ?? '0',
    apiUsage: results.length ?? 0,
  };
}

export async function previewPropertyRadarCount(criteria) {
  const key = getApiKey();
  if (!key) return { totalCount: 0, ok: false, message: 'API key missing' };

  const params = new URLSearchParams({ Purchase: '0', Limit: '1', Start: '0' });
  const res = await fetch(`${BASE_URL}/properties?${params.toString()}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ Criteria: criteria }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      totalCount: 0,
      ok: false,
      message: parsePropertyRadarError(data, res.status),
    };
  }

  return {
    totalCount: data.totalResultCount ?? data.totalCount ?? data.resultCount ?? 0,
    ok: true,
    message: 'Connected',
  };
}

/** Free check (Purchase=0) — verifies API key and subscription without using exports */
export async function testPropertyRadarConnection() {
  if (!hasPropertyRadarKey()) {
    return { ok: false, configured: false, message: 'PROPERTYRADAR_API_KEY missing in backend/.env' };
  }

  const preview = await previewPropertyRadarCount([{ name: 'State', value: ['FL'] }]);
  return {
    ok: preview.ok,
    configured: true,
    keyHint: maskApiKey(),
    message: preview.message,
    sampleCount: preview.totalCount,
  };
}

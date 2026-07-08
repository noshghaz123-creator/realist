import PropertyLead from '../models/PropertyLead.js';
import LeadCache from '../models/LeadCache.js';
import SyncHistory from '../models/SyncHistory.js';
import User from '../models/User.js';
import { searchPropertyRadar } from './propertyRadarService.js';
import { buildCacheKey, cacheExpiresAt } from '../utils/cacheKey.js';
import {
  buildSearchCriteria,
  buildFilterFallbacks,
  mapPropertyRadarRecord,
  unwrapPropertyRadarRecord,
  qualifiesProperty,
  hasFullContact,
  contactScore,
  hasDistressFilters,
  matchesDistressPostFilters,
} from '../utils/propertyRadarMapper.js';

export const BROWSE_BATCH_SIZE = 10;
export const PAGE_SIZE = BROWSE_BATCH_SIZE;
export const FEATURED_LIMIT = 10;

async function getUserSavedPropertyLeadIds() {
  const users = await User.find({
    $or: [
      { 'myPropertyLeads.0': { $exists: true } },
      { 'favouritePropertyLeads.0': { $exists: true } },
    ],
  })
    .select('myPropertyLeads favouritePropertyLeads')
    .lean();

  const ids = new Set();
  for (const user of users) {
    (user.myPropertyLeads || []).forEach((id) => ids.add(String(id)));
    (user.favouritePropertyLeads || []).forEach((id) => ids.add(String(id)));
  }
  return [...ids];
}

async function clearCacheLeadsExceptSaved(cacheKey) {
  const preserveIds = await getUserSavedPropertyLeadIds();
  if (!preserveIds.length) {
    await PropertyLead.deleteMany({ cacheKey });
    return;
  }
  await PropertyLead.deleteMany({
    cacheKey,
    _id: { $nin: preserveIds },
  });
}

const API_FETCH_CHUNK = 25;
const MAX_SCAN_PAGES = 20;

function pickRadarId(raw) {
  const source = unwrapPropertyRadarRecord(raw);
  const direct =
    source?.RadarID ||
    source?.RadarId ||
    source?.radarId ||
    source?.radarID ||
    null;
  if (direct) return String(direct);

  let links = source?._links;
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links);
    } catch {
      links = { href: links };
    }
  }
  if (links && typeof links === 'object') {
    for (const val of Object.values(links)) {
      const href = typeof val === 'string' ? val : val?.href;
      if (!href) continue;
      const match = String(href).match(/\/properties\/([^/?#]+)/i);
      if (match?.[1]) return match[1];
    }
  }

  if (source?.PropertyKey != null) return `pk-${source.PropertyKey}`;
  if (source?._syntheticId) return String(source._syntheticId);
  return null;
}

export async function getValidCache(cacheKey) {
  const cache = await LeadCache.findOne({ cacheKey });
  if (!cache) return null;
  if (cache.expiresAt <= new Date()) return null;
  return cache;
}

export async function paginateCachedLeads(cacheKey) {
  const records = await PropertyLead.find({ cacheKey })
    .sort({ createdAt: -1 })
    .limit(BROWSE_BATCH_SIZE)
    .lean();
  return {
    records,
    total: records.length,
    page: 1,
    pageSize: BROWSE_BATCH_SIZE,
  };
}

async function saveRecords(cacheKey, records, { featured = false } = {}) {
  if (!records.length) return 0;

  const ops = records.map((raw) => {
    const mapped = mapPropertyRadarRecord(raw, { cacheKey, featured });
    if (!mapped.radarId || !qualifiesProperty(mapped, { trustFloridaSearch: true })) return null;
    return {
      updateOne: {
        filter: { radarId: mapped.radarId },
        update: { $set: mapped },
        upsert: true,
      },
    };
  }).filter(Boolean);

  if (!ops.length) return 0;

  try {
    const result = await PropertyLead.bulkWrite(ops, { ordered: false });
    const written =
      (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.insertedCount || 0);
    return written || ops.length;
  } catch (err) {
    console.error('PropertyLead bulkWrite failed:', err.message);
    if (err.writeErrors?.length) {
      console.error('First write error:', err.writeErrors[0]?.errmsg || err.writeErrors[0]);
    }
    return 0;
  }
}

function forceAcceptRawRecord(normalizedRaw, index, start) {
  const withId = { ...normalizedRaw };
  if (!pickRadarId(withId) && !resolveRadarIdFromRaw(withId)) {
    withId._syntheticId = `fl-${start}-${index}-${Date.now()}`;
  }
  return withId;
}

function resolveRadarIdFromRaw(raw) {
  const mapped = mapPropertyRadarRecord(raw, { cacheKey: 'preview' });
  return mapped.radarId || pickRadarId(raw);
}

/** Scan PropertyRadar until we collect `targetCount` qualified FL leads (prefer full contact) */
async function fetchQualifiedRecords(filters, radarStart, targetCount = BROWSE_BATCH_SIZE) {
  let criteria = buildSearchCriteria(filters);
  let postFilterDistress = false;
  const ranked = [];
  const seenIds = new Set();
  let start = radarStart;
  let totalAvailable = 0;
  let apiUsage = 0;
  let pages = 0;
  let rawScanned = 0;

  while (ranked.length < targetCount && pages < MAX_SCAN_PAGES) {
    let batch;
    try {
      batch = await searchPropertyRadar({
        criteria,
        purchase: 1,
        limit: API_FETCH_CHUNK,
        start,
      });
    } catch (err) {
      if (
        !postFilterDistress &&
        hasDistressFilters(filters) &&
        /Unexpected Criterion/i.test(err.message)
      ) {
        postFilterDistress = true;
        criteria = buildSearchCriteria(filters, { omitDistress: true });
        batch = await searchPropertyRadar({
          criteria,
          purchase: 1,
          limit: API_FETCH_CHUNK,
          start,
        });
      } else {
        throw err;
      }
    }

    apiUsage += batch.apiUsage || batch.results?.length || 0;
    totalAvailable = batch.totalCount || totalAvailable;

    if (!batch.results?.length) break;

    rawScanned += batch.results.length;

    let acceptedThisBatch = 0;

    for (const raw of batch.results) {
      const normalizedRaw = unwrapPropertyRadarRecord(raw);
      const preview = mapPropertyRadarRecord(normalizedRaw, { cacheKey: 'preview' });

      if (!preview.radarId) {
        preview.radarId = pickRadarId(normalizedRaw) || preview.radarId;
      }

      if (!qualifiesProperty(preview, { trustFloridaSearch: true })) {
        continue;
      }
      if (postFilterDistress && !matchesDistressPostFilters(preview, filters)) {
        continue;
      }

      const id = preview.radarId || pickRadarId(normalizedRaw);
      if (id && seenIds.has(String(id))) continue;
      if (id) seenIds.add(String(id));
      ranked.push({
        raw: normalizedRaw,
        score: contactScore(preview),
      });
      acceptedThisBatch += 1;
    }

    if (acceptedThisBatch === 0 && batch.results.length > 0) {
      const sample = unwrapPropertyRadarRecord(batch.results[0]);
      console.warn(
        'PropertyRadar rows returned but mapping failed; using fallback accept. Sample keys:',
        Object.keys(sample).slice(0, 20).join(', ') || '(empty)'
      );

      batch.results.forEach((raw, index) => {
        const normalizedRaw = forceAcceptRawRecord(unwrapPropertyRadarRecord(raw), index, start);
        const preview = mapPropertyRadarRecord(normalizedRaw, { cacheKey: 'preview' });
        const id = preview.radarId || pickRadarId(normalizedRaw);
        if (id && seenIds.has(String(id))) return;
        if (id) seenIds.add(String(id));
        ranked.push({
          raw: normalizedRaw,
          score: contactScore(preview) || 1,
        });
      });
    }

    ranked.sort((a, b) => b.score - a.score);

    start += batch.results.length;
    pages += 1;
    if (start >= (batch.totalCount || start)) break;
  }

  ranked.sort((a, b) => b.score - a.score);
  const results = ranked.slice(0, targetCount).map((r) => r.raw);
  const fullContactCount = ranked.filter((r) => r.score === 3).length;

  return {
    results,
    nextStart: start,
    totalAvailable,
    apiUsage,
    rawScanned,
    fullContactCount,
  };
}

async function fetchQualifiedWithFallbacks(filters, radarStart, targetCount) {
  const steps = buildFilterFallbacks(filters);
  let lastResult = null;

  for (let i = 0; i < steps.length; i += 1) {
    const stepFilters = steps[i];
    const result = await fetchQualifiedRecords(stepFilters, radarStart, targetCount);
    lastResult = result;

    if (result.results.length > 0) {
      return {
        ...result,
        usedFilters: stepFilters,
        broadened: i > 0,
      };
    }
  }

  return {
    ...(lastResult || {
      results: [],
      nextStart: radarStart,
      totalAvailable: 0,
      apiUsage: 0,
      rawScanned: 0,
      fullContactCount: 0,
    }),
    usedFilters: steps[steps.length - 1],
    broadened: steps.length > 1,
  };
}

/** Search = first 10 qualified leads; Refresh = next 10 qualified leads */
export async function fetchBrowseBatch(filters, { advance = false } = {}) {
  const normalized = { ...filters, state: 'FL' };
  const cacheKey = buildCacheKey(normalized, 'search');

  let radarStart = 0;
  if (advance) {
    const existing = await getValidCache(cacheKey);
    if (!existing) {
      throw new Error('Please run Search first before refreshing.');
    }
    radarStart = existing.radarStart || 0;
  }

  const fetchFn = advance ? fetchQualifiedRecords : fetchQualifiedWithFallbacks;
  const {
    results,
    nextStart,
    totalAvailable,
    apiUsage,
    rawScanned,
    fullContactCount = 0,
    broadened = false,
  } = await fetchFn(normalized, radarStart, BROWSE_BATCH_SIZE);

  if (!results.length) {
    if (advance) {
      throw new Error('No more properties available for these filters.');
    }
    if (rawScanned > 0) {
      throw new Error(
        'PropertyRadar returned results but they could not be loaded. Please restart the backend and try Search again.'
      );
    }
    throw new Error(
      'No properties found in Florida for these filters. Clear extra filters and search again — try Orange county or Orlando city only.'
    );
  }

  await clearCacheLeadsExceptSaved(cacheKey);
  const saved = await saveRecords(cacheKey, results);

  if (saved === 0 && results.length > 0) {
    throw new Error('Properties received from PropertyRadar but could not be saved. Please try again.');
  }

  await LeadCache.findOneAndUpdate(
    { cacheKey },
    {
      cacheKey,
      filters: normalized,
      type: 'search',
      expiresAt: cacheExpiresAt(),
      totalRecords: saved,
      totalAvailable,
      radarStart: nextStart,
      apiRecordsUsed: apiUsage,
      lastSyncedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  await SyncHistory.create({
    action: 'search_refresh',
    status: 'success',
    recordsAffected: saved,
    apiUsage,
    message: advance
      ? `Next ${saved} qualified FL properties (offset ${radarStart})`
      : `First ${saved} qualified FL properties`,
  });

  const records = await PropertyLead.find({ cacheKey }).sort({ createdAt: -1 }).lean();

  let message;
  if (fullContactCount >= saved) {
    message = `Showing ${saved} properties with full owner contact.`;
  } else if (fullContactCount > 0) {
    message = `Showing ${saved} properties (${fullContactCount} with name, phone & email).`;
  } else {
    message = `Showing ${saved} Florida properties. Owner contact fills in when available on your PropertyRadar plan.`;
  }
  if (broadened) {
    message += ' Some filters were relaxed automatically to find results.';
  }

  return {
    records,
    total: saved,
    totalAvailable,
    cacheKey,
    page: 1,
    pageSize: BROWSE_BATCH_SIZE,
    batchNumber: Math.floor(radarStart / BROWSE_BATCH_SIZE) + 1,
    hasMore: nextStart < totalAvailable,
    fromCache: false,
    filters: normalized,
    message,
    broadened,
  };
}

export async function syncFeaturedLeads(triggeredBy = null) {
  const filters = { state: 'FL', propertyType: 'both' };
  const cacheKey = buildCacheKey(filters, 'featured');

  await PropertyLead.updateMany({ featured: true }, { $set: { featured: false } });

  const { results, apiUsage } = await fetchQualifiedRecords(filters, 0, FEATURED_LIMIT);

  await PropertyLead.deleteMany({ cacheKey });
  await saveRecords(cacheKey, results, { featured: true });

  const expiresAt = cacheExpiresAt();
  await LeadCache.findOneAndUpdate(
    { cacheKey },
    {
      cacheKey,
      filters,
      type: 'featured',
      expiresAt,
      totalRecords: results.length,
      radarStart: results.length,
      totalAvailable: results.length,
      apiRecordsUsed: apiUsage,
      lastSyncedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  await SyncHistory.create({
    action: triggeredBy ? 'admin_sync' : 'cron_featured',
    status: 'success',
    recordsAffected: results.length,
    apiUsage,
    message: `Featured leads synced (${results.length})`,
    triggeredBy,
  });

  return results.length;
}

export async function getFeaturedLeads(limit = FEATURED_LIMIT) {
  const featured = await PropertyLead.find({ featured: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return featured.filter((l) => qualifiesProperty(l));
}

export async function clearAllCache() {
  const [leads, caches] = await Promise.all([
    PropertyLead.deleteMany({}),
    LeadCache.deleteMany({}),
  ]);
  await SyncHistory.create({
    action: 'cache_clear',
    status: 'success',
    recordsAffected: leads.deletedCount || 0,
    message: `Cleared ${leads.deletedCount || 0} leads and ${caches.deletedCount || 0} cache entries`,
  });
  return { leadsDeleted: leads.deletedCount || 0, cachesDeleted: caches.deletedCount || 0 };
}

export async function getAdminStats() {
  const [totalCachedLeads, lastSync, apiUsageAgg, lastCache] = await Promise.all([
    PropertyLead.countDocuments(),
    SyncHistory.findOne().sort({ createdAt: -1 }).lean(),
    SyncHistory.aggregate([{ $group: { _id: null, total: { $sum: '$apiUsage' } } }]),
    LeadCache.findOne().sort({ lastSyncedAt: -1 }).lean(),
  ]);

  return {
    totalCachedLeads,
    apiUsage: apiUsageAgg[0]?.total || 0,
    lastSync: lastSync?.createdAt || lastCache?.lastSyncedAt || null,
    lastSyncAction: lastSync?.action || null,
    cacheEntries: await LeadCache.countDocuments(),
  };
}

export async function getExportRows(cacheKey, idsParam) {
  const filter = { cacheKey };
  if (idsParam) {
    const ids = String(idsParam).split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length) filter.radarId = { $in: ids };
  }
  return PropertyLead.find(filter).sort({ createdAt: -1 }).limit(BROWSE_BATCH_SIZE).lean();
}

export async function fetchAndCache(filters, { replace = true } = {}) {
  return fetchBrowseBatch(filters, { advance: false });
}

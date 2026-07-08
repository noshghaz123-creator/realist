import crypto from 'crypto';

export function buildCacheKey(filters = {}, type = 'search') {
  const normalized = JSON.stringify(filters, Object.keys(filters).sort());
  return crypto.createHash('sha256').update(`${type}:${normalized}`).digest('hex');
}

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export function cacheExpiresAt(from = Date.now()) {
  return new Date(from + CACHE_TTL_MS);
}

import { syncFeaturedLeads } from './leadCacheService.js';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
let started = false;
let timerId = null;

async function runFeaturedSync() {
  try {
    console.log('[cron] Syncing featured leads from PropertyRadar...');
    const count = await syncFeaturedLeads();
    console.log(`[cron] Featured sync complete (${count} records).`);
  } catch (err) {
    console.error('[cron] Featured sync failed:', err.message);
  }
}

export function startFeaturedSyncCron() {
  if (started) return;
  started = true;

  timerId = setInterval(runFeaturedSync, SIX_HOURS_MS);
  if (typeof timerId.unref === 'function') timerId.unref();
}

export function stopFeaturedSyncCron() {
  if (timerId) clearInterval(timerId);
  started = false;
  timerId = null;
}

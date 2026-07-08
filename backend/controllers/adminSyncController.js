import SyncHistory from '../models/SyncHistory.js';
import {
  clearAllCache,
  fetchAndCache,
  getAdminStats,
  syncFeaturedLeads,
} from '../services/leadCacheService.js';

export async function getStats(req, res) {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function adminSync(req, res) {
  try {
    const { action } = req.body || {};
    if (action === 'featured') {
      const count = await syncFeaturedLeads(req.user._id);
      return res.json({ message: 'Featured leads refreshed successfully.', count });
    }
    if (action === 'cache') {
      const result = await fetchAndCache(req.body?.filters || { state: 'FL' }, {
        replace: true,
        type: 'search',
      });
      return res.json({ message: 'Cache refreshed successfully.', ...result });
    }
    return res.status(400).json({ message: 'Invalid sync action.' });
  } catch (err) {
    await SyncHistory.create({
      action: 'admin_sync',
      status: 'failed',
      message: err.message,
      triggeredBy: req.user?._id,
    });
    res.status(500).json({ message: err.message });
  }
}

export async function clearCache(req, res) {
  try {
    const result = await clearAllCache();
    res.json({ message: 'Cache cleared successfully.', ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

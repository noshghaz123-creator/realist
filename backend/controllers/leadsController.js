import PropertyLead from '../models/PropertyLead.js';
import User from '../models/User.js';
import {
  fetchBrowseBatch,
  getFeaturedLeads,
  getValidCache,
  paginateCachedLeads,
  getExportRows,
  BROWSE_BATCH_SIZE,
} from '../services/leadCacheService.js';
import { parseSearchFilters, validateSearchFilters } from '../validators/leadSearchValidator.js';
import { buildExcelBuffer } from '../utils/excelExport.js';
import { assertLeadQuota, consumeLeadQuota, quotaSnapshot } from '../services/leadQuotaService.js';
import { createUserNotification, formatLeadLabel } from '../services/notificationService.js';

async function applyQuotaToBrowseResult(user, result) {
  if (!user || user.role === 'admin') {
    return { ...result, ...quotaSnapshot(user) };
  }

  assertLeadQuota(user, 1);

  let records = result.records || [];
  const max = user.leadsRemaining ?? 0;
  if (records.length > max) {
    records = records.slice(0, max);
  }

  if (records.length === 0) {
    throw new Error('No leads remaining on your account. Contact admin for on-demand access.');
  }

  const updated = await consumeLeadQuota(user._id, records.length);
  return {
    ...result,
    records,
    ...quotaSnapshot(updated),
  };
}

export async function getFeatured(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 10);
    const leads = await getFeaturedLeads(limit);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function searchLeads(req, res) {
  try {
    const filters = parseSearchFilters(req.body);
    const error = validateSearchFilters(filters);
    if (error) return res.status(400).json({ message: error });

    if (req.user.role === 'buyer') {
      assertLeadQuota(req.user, 1);
      const remaining = req.user.leadsRemaining ?? 0;
      if (remaining <= 0) {
        return res.status(403).json({
          message: 'No leads remaining on your account. Contact admin for on-demand access.',
        });
      }
    }

    const result = await fetchBrowseBatch(filters, { advance: false });
    const finalResult = await applyQuotaToBrowseResult(req.user, result);
    const count = finalResult.records?.length || 0;

    if (req.user.role === 'buyer' && count > 0) {
      await createUserNotification(req.user._id, {
        title: 'Leads Extracted',
        message: `You extracted ${count} Florida lead${count === 1 ? '' : 's'}. ${finalResult.leadsRemaining ?? 0} remaining on your plan.`,
        type: 'lead',
      });
    }

    res.json({
      ...finalResult,
      message: `Showing ${count} properties. ${finalResult.leadsRemaining ?? 0} leads remaining.`,
    });
  } catch (err) {
    const status = /remaining|limit/i.test(err.message) ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
}

export async function listLeads(req, res) {
  try {
    const { cacheKey, page = 1 } = req.query;
    if (!cacheKey) {
      return res.status(400).json({ message: 'cacheKey is required. Run a search first.' });
    }

    const cache = await getValidCache(cacheKey);
    if (!cache) {
      return res.status(410).json({ message: 'Cache expired. Please search again.' });
    }

    const result = await paginateCachedLeads(cacheKey, Number(page));
    res.json({ ...result, cacheKey, fromCache: true, ...quotaSnapshot(req.user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function refreshLeads(req, res) {
  try {
    const filters = parseSearchFilters(req.body?.filters || req.body);
    const error = validateSearchFilters(filters);
    if (error) return res.status(400).json({ message: error });

    if (req.user.role === 'buyer') {
      assertLeadQuota(req.user, 1);
      const remaining = req.user.leadsRemaining ?? 0;
      if (remaining <= 0) {
        return res.status(403).json({
          message: 'No leads remaining on your account. Contact admin for on-demand access.',
        });
      }
    }

    const result = await fetchBrowseBatch(filters, { advance: true });
    const finalResult = await applyQuotaToBrowseResult(req.user, result);
    const count = finalResult.records?.length || 0;

    if (req.user.role === 'buyer' && count > 0) {
      await createUserNotification(req.user._id, {
        title: 'Leads Refreshed',
        message: `Next batch loaded — ${count} propert${count === 1 ? 'y' : 'ies'}. ${finalResult.leadsRemaining ?? 0} leads remaining.`,
        type: 'lead',
      });
    }

    res.json({
      ...finalResult,
      message: `Leads refreshed. ${finalResult.leadsRemaining ?? 0} leads remaining.`,
    });
  } catch (err) {
    const status = /remaining|limit/i.test(err.message) ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
}

export async function exportLeads(req, res) {
  try {
    const { cacheKey } = req.query;
    if (!cacheKey) return res.status(400).json({ message: 'cacheKey is required.' });

    const cache = await getValidCache(cacheKey);
    if (!cache) return res.status(410).json({ message: 'Cache expired. Please search again.' });

    const rows = await getExportRows(cacheKey, req.query.ids);
    const buffer = await buildExcelBuffer(rows);

    if (req.user.role === 'buyer') {
      await createUserNotification(req.user._id, {
        title: 'Excel Downloaded',
        message: `Exported ${rows.length} browse lead${rows.length === 1 ? '' : 's'} to Excel.`,
        type: 'lead',
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="realist-leads.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function findPropertyLeadByParam(id) {
  if (!id) return null;
  const idStr = String(id);
  if (/^[a-f\d]{24}$/i.test(idStr)) {
    const lead = await PropertyLead.findById(idStr).lean();
    if (lead) return lead;
  }
  return PropertyLead.findOne({ radarId: idStr }).lean();
}

function pickLeadSnapshot(body = {}) {
  if (!body || typeof body !== 'object') return null;
  const radarId = body.radarId || body.RadarID;
  if (!radarId) return null;

  const snapshot = { ...body };
  delete snapshot._id;
  delete snapshot.id;
  delete snapshot.__v;
  snapshot.radarId = String(radarId);
  if (!snapshot.cacheKey) snapshot.cacheKey = 'saved';
  if (!snapshot.state) snapshot.state = 'FL';
  return snapshot;
}

async function upsertPropertyLeadSnapshot(snapshot) {
  if (!snapshot?.radarId) return null;
  const doc = await PropertyLead.findOneAndUpdate(
    { radarId: snapshot.radarId },
    { $set: snapshot },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return doc;
}

async function resolvePropertyLead(leadId, snapshot) {
  let lead = await findPropertyLeadByParam(leadId);
  if (lead) return lead;

  const normalized = pickLeadSnapshot(snapshot);
  if (!normalized) return null;

  if (!normalized.radarId && leadId) {
    normalized.radarId = String(leadId);
  }

  return upsertPropertyLeadSnapshot(normalized);
}

async function pruneUserPropertyList(user, listField) {
  const ids = user[listField] || [];
  if (!ids.length) return user;

  const existing = await PropertyLead.find({ _id: { $in: ids } }).select('_id').lean();
  const existingSet = new Set(existing.map((l) => String(l._id)));
  const pruned = ids.filter((id) => existingSet.has(String(id)));

  if (pruned.length !== ids.length) {
    user[listField] = pruned;
    await user.save();
  }
  return user;
}

async function toggleUserPropertyList(userId, listField, leadId, snapshot) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const lead = await resolvePropertyLead(leadId, snapshot);
  if (!lead) throw new Error('Property lead not found');

  const oid = lead._id;
  const list = user[listField] || [];
  const idx = list.findIndex((item) => item.toString() === oid.toString());
  if (idx >= 0) list.splice(idx, 1);
  else list.push(oid);

  user[listField] = list;
  await user.save();
  return { user, lead, added: idx < 0 };
}

export async function toggleFavouritePropertyLead(req, res) {
  try {
    const { user, lead, added } = await toggleUserPropertyList(
      req.user._id,
      'favouritePropertyLeads',
      req.params.id,
      req.body?.lead
    );
    const label = formatLeadLabel(lead);
    await createUserNotification(req.user._id, {
      title: added ? 'Added to Favourites' : 'Removed from Favourites',
      message: added
        ? `${label} saved to your Favourites.`
        : `${label} removed from Favourites.`,
      type: 'lead',
    });
    res.json({
      added,
      favouritePropertyLeads: user.favouritePropertyLeads,
      message: added ? 'Added to Favourites' : 'Removed from Favourites',
      lead,
    });
  } catch (err) {
    res.status(err.message === 'Property lead not found' ? 404 : 500).json({ message: err.message });
  }
}

export async function toggleMyPropertyLead(req, res) {
  try {
    const { user, lead, added } = await toggleUserPropertyList(
      req.user._id,
      'myPropertyLeads',
      req.params.id,
      req.body?.lead
    );
    const label = formatLeadLabel(lead);
    await createUserNotification(req.user._id, {
      title: added ? 'Added to My Leads' : 'Removed from My Leads',
      message: added
        ? `${label} saved to My Leads.`
        : `${label} removed from My Leads.`,
      type: 'lead',
    });
    res.json({
      added,
      myPropertyLeads: user.myPropertyLeads,
      message: added ? 'Added to My Leads' : 'Removed from My Leads',
      lead,
    });
  } catch (err) {
    res.status(err.message === 'Property lead not found' ? 404 : 500).json({ message: err.message });
  }
}

export async function addAllMyPropertyLeads(req, res) {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const leadSnapshots = Array.isArray(req.body?.leads) ? req.body.leads : [];
    if (!ids.length && !leadSnapshots.length) {
      return res.status(400).json({ message: 'No leads to add.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = new Set((user.myPropertyLeads || []).map((id) => id.toString()));
    let addedCount = 0;

    const items = ids.length
      ? ids.map((id, index) => ({ id, snapshot: leadSnapshots[index] || leadSnapshots.find((l) => String(l?._id || l?.id || l?.radarId) === String(id)) }))
      : leadSnapshots.map((snapshot) => ({
          id: snapshot?._id || snapshot?.id || snapshot?.radarId,
          snapshot,
        }));

    for (const { id, snapshot } of items) {
      const lead = await resolvePropertyLead(id, snapshot);
      if (!lead) continue;
      const oidStr = lead._id.toString();
      if (existing.has(oidStr)) continue;
      user.myPropertyLeads.push(lead._id);
      existing.add(oidStr);
      addedCount += 1;
    }

    await user.save();

    if (addedCount > 0) {
      await createUserNotification(req.user._id, {
        title: 'Bulk Save to My Leads',
        message: `${addedCount} lead${addedCount === 1 ? '' : 's'} added to My Leads.`,
        type: 'lead',
      });
    }

    res.json({
      addedCount,
      skippedCount: ids.length - addedCount,
      myPropertyLeads: user.myPropertyLeads,
      message:
        addedCount > 0
          ? `${addedCount} lead${addedCount === 1 ? '' : 's'} added to My Leads successfully!`
          : 'All visible leads are already in My Leads.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getFavouritePropertyLeads(req, res) {
  try {
    let user = await User.findById(req.user._id);
    user = await pruneUserPropertyList(user, 'favouritePropertyLeads');
    user = await User.findById(req.user._id).populate('favouritePropertyLeads');
    res.json(user?.favouritePropertyLeads?.filter(Boolean) || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function getMyPropertyLeads(req, res) {
  try {
    let user = await User.findById(req.user._id);
    user = await pruneUserPropertyList(user, 'myPropertyLeads');
    user = await User.findById(req.user._id).populate('myPropertyLeads');
    res.json(user?.myPropertyLeads?.filter(Boolean) || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function exportMyPropertyLeads(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('myPropertyLeads');
    const leads = (user?.myPropertyLeads || []).filter(Boolean);
    if (!leads.length) {
      return res.status(400).json({ message: 'No saved leads to export.' });
    }

    const buffer = await buildExcelBuffer(leads);

    await createUserNotification(req.user._id, {
      title: 'My Leads Exported',
      message: `Downloaded ${leads.length} saved lead${leads.length === 1 ? '' : 's'} as Excel.`,
      type: 'lead',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="realist-my-leads.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export { BROWSE_BATCH_SIZE };

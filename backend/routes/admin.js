import express from 'express';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Contact from '../models/Contact.js';
import PropertyLead from '../models/PropertyLead.js';
import { protect, authorize } from '../middleware/auth.js';
import { TRIAL_LEAD_LIMIT } from '../services/leadQuotaService.js';
import { getPlatformSettings, updateManualRevenue } from '../services/platformSettingsService.js';
import { adminSync, clearCache } from '../controllers/adminSyncController.js';
import { getAdminStats } from '../services/leadCacheService.js';
import { testPropertyRadarConnection } from '../services/propertyRadarService.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', async (_req, res) => {
  try {
    const [settings, activeBuyers, propertyLeads, signups, contacts, unreadContacts, syncStats] =
      await Promise.all([
        getPlatformSettings(),
        User.countDocuments({ role: 'buyer' }),
        PropertyLead.countDocuments(),
        User.countDocuments({ role: 'buyer' }),
        Contact.countDocuments(),
        Contact.countDocuments({ status: 'new' }),
        getAdminStats(),
      ]);

    res.json({
      totalRevenue: settings.manualRevenue || 0,
      activeBuyers,
      propertyLeads,
      totalSignups: signups,
      totalContacts: contacts,
      unreadContacts,
      totalCachedLeads: syncStats.totalCachedLeads || 0,
      apiUsage: syncStats.apiUsage || 0,
      lastSync: syncStats.lastSync || null,
      cacheEntries: syncStats.cacheEntries || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/platform-settings', async (_req, res) => {
  try {
    const settings = await getPlatformSettings();
    res.json({ manualRevenue: settings.manualRevenue || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/platform-settings', async (req, res) => {
  try {
    const settings = await updateManualRevenue(req.body.manualRevenue);
    res.json({ manualRevenue: settings.manualRevenue || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const existing = await User.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    const updates = {};
    if (req.body.plan !== undefined) updates.plan = req.body.plan;
    if (req.body.role !== undefined) updates.role = req.body.role;

    if (req.body.leadLimit !== undefined) {
      const leadLimit = Math.max(0, Number(req.body.leadLimit) || 0);
      updates.leadLimit = leadLimit;
      updates.leadsRemaining = Math.max(0, leadLimit - (existing.leadsUsed || 0));
      if (leadLimit > TRIAL_LEAD_LIMIT && existing.plan === 'trial') {
        updates.plan = 'ondemand';
      }
    }

    if (req.body.leadsRemaining !== undefined && req.body.leadLimit === undefined) {
      updates.leadsRemaining = Math.max(0, Number(req.body.leadsRemaining) || 0);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/lead-usage', async (_req, res) => {
  try {
    const buyers = await User.find({ role: 'buyer' })
      .select('name email phone plan leadLimit leadsUsed leadsRemaining createdAt')
      .sort({ leadsUsed: -1, createdAt: -1 });
    res.json(buyers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/contacts', async (_req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/contacts/:id/read', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/leads', async (_req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/propertyradar-status', async (_req, res) => {
  try {
    const status = await testPropertyRadarConnection();
    res.json(status);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/sync', adminSync);
router.post('/clear-cache', clearCache);

export default router;

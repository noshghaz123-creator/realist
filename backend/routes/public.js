import express from 'express';
import Lead from '../models/Lead.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import PropertyLead from '../models/PropertyLead.js';
import { SHOWCASE_STATS, SHOWCASE_LEADS } from '../data/homeShowcase.js';
import { getFeaturedLeads } from '../services/leadCacheService.js';

const router = express.Router();

router.get('/home', async (_req, res) => {
  try {
    const [totalLeads, totalPurchases, buyers, dealsClosed, revenue, featuredDb] = await Promise.all([
      Lead.countDocuments(),
      Purchase.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      Purchase.countDocuments({ dealStatus: 'closed' }),
      Purchase.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      getFeaturedLeads(10).catch(() => []),
    ]);

    const realStats = {
      leadsDelivered: totalLeads + totalPurchases,
      investorsServed: buyers,
      leadAccuracy: totalPurchases
        ? Math.min(99, Math.round((dealsClosed / totalPurchases) * 100) + 70)
        : 94,
      dealsClosedValue: revenue[0]?.total || 0,
    };

    const stats = {
      leadsDelivered: Math.max(realStats.leadsDelivered, SHOWCASE_STATS.leadsDelivered),
      investorsServed: Math.max(realStats.investorsServed, SHOWCASE_STATS.investorsServed),
      leadAccuracy: Math.max(realStats.leadAccuracy, SHOWCASE_STATS.leadAccuracy),
      dealsClosedValue: Math.max(realStats.dealsClosedValue, SHOWCASE_STATS.dealsClosedValue),
    };

    let featuredLeads = Array.isArray(featuredDb) && featuredDb.length ? featuredDb : [];
    let featuredSource = 'live';

    if (!featuredLeads.length) {
      const propertyFeatured = await PropertyLead.find({ featured: true }).limit(10).lean();
      if (propertyFeatured.length) {
        featuredLeads = propertyFeatured;
      } else {
        featuredLeads = SHOWCASE_LEADS;
        featuredSource = 'demo';
      }
    }

    res.json({
      stats,
      featuredLeads: featuredLeads.slice(0, 10),
      featuredSource,
    });
  } catch {
    res.json({
      stats: SHOWCASE_STATS,
      featuredLeads: SHOWCASE_LEADS,
      featuredSource: 'demo',
    });
  }
});

export default router;

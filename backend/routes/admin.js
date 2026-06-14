import express from 'express';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Purchase from '../models/Purchase.js';
import { protect, authorize } from '../middleware/auth.js';
import { PLAN_LEADS } from '../config/plans.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', async (_req, res) => {
  try {
    const [totalRevenue, activeBuyers, activeLeads, totalLeads, dealsClosed, totalPurchases] =
      await Promise.all([
        Purchase.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
        User.countDocuments({ role: 'buyer', plan: { $ne: 'none' } }),
        Lead.countDocuments({ status: 'active' }),
        Lead.countDocuments(),
        Purchase.countDocuments({ dealStatus: 'closed' }),
        Purchase.countDocuments(),
      ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      activeBuyers,
      activeLeads,
      totalLeads,
      dealsClosed,
      totalPurchases,
    });
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
    const updates = {};
    if (req.body.plan !== undefined) {
      updates.plan = req.body.plan;
      if (req.body.leadsRemaining === undefined && PLAN_LEADS[req.body.plan] !== undefined) {
        updates.leadsRemaining = PLAN_LEADS[req.body.plan];
      }
    }
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.leadsRemaining !== undefined) updates.leadsRemaining = req.body.leadsRemaining;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
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

export default router;

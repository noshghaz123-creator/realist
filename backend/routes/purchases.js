import express from 'express';
import Purchase from '../models/Purchase.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/my', protect, authorize('buyer'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.dealStatus = status;

    let purchases = await Purchase.find(filter)
      .populate('lead')
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      purchases = purchases.filter(
        (p) =>
          p.lead?.city?.toLowerCase().includes(q) ||
          p.lead?.state?.toLowerCase().includes(q) ||
          p.lead?.ownerName?.toLowerCase().includes(q)
      );
    }

    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', protect, authorize('buyer'), async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id });
    const totalSpent = purchases.reduce((s, p) => s + p.amount, 0);
    const dealsClosed = purchases.filter((p) => p.dealStatus === 'closed').length;
    const inProgress = purchases.filter((p) => p.dealStatus === 'in_progress').length;

    res.json({
      totalPurchased: purchases.length,
      dealsClosed,
      inProgress,
      totalSpent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, authorize('buyer'), async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, user: req.user._id });
    if (!purchase) return res.status(404).json({ message: 'Not found' });

    if (req.body.dealStatus) purchase.dealStatus = req.body.dealStatus;
    if (req.body.privateNotes !== undefined) purchase.privateNotes = req.body.privateNotes;
    await purchase.save();

    const populated = await Purchase.findById(purchase._id).populate('lead');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/all', protect, authorize('admin'), async (_req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('lead')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

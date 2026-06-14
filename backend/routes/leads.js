import express from 'express';
import Lead from '../models/Lead.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const publicLead = (lead, purchasedIds = [], staff = false) => {
  const obj = lead.toObject ? lead.toObject() : lead;
  const purchased = staff || purchasedIds.some((id) => id.toString() === obj._id.toString());
  if (!purchased) {
    delete obj.ownerName;
    delete obj.ownerPhone;
    delete obj.ownerEmail;
    delete obj.address;
    delete obj.notes;
  }
  return { ...obj, purchased };
};

router.get('/', protect, async (req, res) => {
  try {
    const { search, type, tier, state, sort } = req.query;
    const filter = { status: 'active' };

    if (type && type !== 'all') filter.leadType = type;
    if (tier && tier !== 'all') filter.tier = tier;
    if (state && state !== 'all') filter.state = state;
    if (search) {
      filter.$or = [
        { city: new RegExp(search, 'i') },
        { state: new RegExp(search, 'i') },
        { leadType: new RegExp(search, 'i') },
      ];
    }

    let query = Lead.find(filter);
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const leads = await query;
    const purchases = await Purchase.find({ user: req.user._id }).select('lead');
    const purchasedIds = purchases.map((p) => p.lead);

    res.json(leads.map((l) => publicLead(l, purchasedIds)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/public', async (_req, res) => {
  try {
    const leads = await Lead.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5);
    res.json(
      leads.map((l) => {
        const obj = l.toObject();
        delete obj.ownerName;
        delete obj.ownerPhone;
        delete obj.ownerEmail;
        delete obj.address;
        delete obj.notes;
        return obj;
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/market-stats', async (_req, res) => {
  try {
    const [totalLeads, totalPurchases, buyers, dealsClosed, revenue] = await Promise.all([
      Lead.countDocuments(),
      Purchase.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      Purchase.countDocuments({ dealStatus: 'closed' }),
      Purchase.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      leadsDelivered: totalLeads + totalPurchases,
      investorsServed: buyers,
      leadAccuracy: totalPurchases
        ? Math.min(99, Math.round((dealsClosed / totalPurchases) * 100) + 70)
        : 94,
      dealsClosedValue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/favourites', protect, authorize('buyer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favourites');
    const active = (user.favourites || []).filter((l) => l && l.status === 'active');
    const purchases = await Purchase.find({ user: req.user._id }).select('lead');
    const purchasedIds = purchases.map((p) => p.lead);
    res.json(active.map((l) => publicLead(l, purchasedIds)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/staff', protect, authorize('admin', 'team'), async (_req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const isStaff = ['admin', 'team'].includes(req.user.role);
    const purchase = await Purchase.findOne({ user: req.user._id, lead: lead._id });
    const purchasedIds = isStaff || purchase ? [lead._id] : [];
    res.json(publicLead(lead, purchasedIds, isStaff));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/purchase', protect, authorize('buyer'), async (req, res) => {
  try {
    const buyer = await User.findById(req.user._id);
    if (buyer.leadsRemaining <= 0) {
      return res.status(400).json({ message: 'No leads remaining on your plan. Upgrade to continue.' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead || lead.status !== 'active') {
      return res.status(404).json({ message: 'Lead not available' });
    }

    const existing = await Purchase.findOne({ user: req.user._id, lead: lead._id });
    if (existing) return res.status(400).json({ message: 'Already purchased' });

    const purchase = await Purchase.create({
      user: req.user._id,
      lead: lead._id,
      amount: lead.price,
      dealStatus: 'contacted',
      privateNotes: '',
    });

    buyer.leadsRemaining -= 1;
    await buyer.save();

    if (lead.exclusive) {
      lead.status = 'sold';
      lead.purchasedBy = req.user._id;
      await lead.save();
    }

    const populated = await Purchase.findById(purchase._id).populate('lead');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/favourite', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const id = req.params.id;
    const idx = user.favourites.findIndex((f) => f.toString() === id);
    if (idx >= 0) user.favourites.splice(idx, 1);
    else user.favourites.push(id);
    await user.save();
    res.json({ favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, authorize('admin', 'team'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.user.role === 'team' && !body.status) body.status = 'inactive';
    const lead = await Lead.create(body);
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, authorize('admin', 'team'), async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { PLAN_LEADS } from '../config/plans.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

const sendUser = (user, res, status = 200) => {
  const token = signToken(user._id);
  res.status(status).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      phone: user.phone,
      company: user.company,
      location: user.location,
      bio: user.bio,
      favourites: user.favourites,
      leadsRemaining: user.leadsRemaining,
      preferences: user.preferences,
    },
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const userRole = role === 'team' ? 'team' : 'buyer';
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      plan: 'basic',
      leadsRemaining: 5,
    });
    sendUser(user, res, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    sendUser(user, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const fields = ['name', 'phone', 'company', 'location', 'bio'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) req.user[f] = req.body[f];
    });

    if (req.body.preferences) {
      req.user.preferences = {
        ...req.user.preferences?.toObject?.() || req.user.preferences || {},
        ...req.body.preferences,
      };
    }

    if (req.body.plan && req.user.role === 'buyer') {
      const plan = req.body.plan;
      if (['basic', 'pro', 'enterprise'].includes(plan)) {
        req.user.plan = plan;
        req.user.leadsRemaining = PLAN_LEADS[plan] ?? req.user.leadsRemaining;
      }
    }

    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

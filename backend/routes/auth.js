import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { TRIAL_LEAD_LIMIT } from '../services/leadQuotaService.js';
import { createUserNotification } from '../services/notificationService.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

const MIN_PASSWORD_LENGTH = 8;

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
      avatar: user.avatar,
      favourites: user.favourites,
      favouritePropertyLeads: user.favouritePropertyLeads,
      myPropertyLeads: user.myPropertyLeads,
      leadLimit: user.leadLimit,
      leadsUsed: user.leadsUsed,
      leadsRemaining: user.leadsRemaining,
      preferences: user.preferences,
      createdAt: user.createdAt,
    },
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, company, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      company: company || '',
      location: location || '',
      role: 'buyer',
      plan: 'trial',
      leadLimit: TRIAL_LEAD_LIMIT,
      leadsUsed: 0,
      leadsRemaining: TRIAL_LEAD_LIMIT,
    });

    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length) {
      await Notification.insertMany(
        admins.map((a) => ({
          user: a._id,
          title: 'New Signup',
          message: `${name} (${email}) registered — 50-lead free trial started.`,
          type: 'system',
        }))
      );
    }

    await createUserNotification(user._id, {
      title: 'Welcome to REALIST',
      message: 'Your account is ready. Browse Florida leads and save your favourites!',
      type: 'system',
    });

    sendUser(user, res, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account exists with this email. Please sign up first.' });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }
    if (user.blocked && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
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
    const fields = ['name', 'phone', 'company', 'location'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) req.user[f] = req.body[f];
    });

    if (req.body.avatar !== undefined) {
      if (req.body.avatar === '' || req.body.avatar === null) {
        req.user.avatar = '';
      } else if (typeof req.body.avatar === 'string' && req.body.avatar.startsWith('data:image/')) {
        if (req.body.avatar.length > 600000) {
          return res.status(400).json({ message: 'Profile image is too large. Use a smaller image (max ~500KB).' });
        }
        req.user.avatar = req.body.avatar;
      } else {
        return res.status(400).json({ message: 'Invalid profile image format.' });
      }
    }

    if (req.body.preferences) {
      req.user.preferences = {
        ...req.user.preferences?.toObject?.() || req.user.preferences || {},
        ...req.body.preferences,
      };
    }

    await req.user.save();

    await createUserNotification(req.user._id, {
      title: 'Profile Updated',
      message: 'Your profile was saved successfully.',
      type: 'system',
    });

    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { contactQueryForUser, notifyAdminsOfUserReply } from '../services/contactService.js';

const router = express.Router();

async function resolveOptionalUser(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return await User.findById(decoded.id).select('-password');
  } catch {
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const authUser = await resolveOptionalUser(req);
    const normalizedEmail = (authUser?.email || email).trim().toLowerCase();

    const contact = await Contact.create({
      userId: authUser?._id || null,
      name: (authUser?.name || name).trim(),
      email: normalizedEmail,
      phone: (phone || authUser?.phone || '').trim(),
      subject: (subject || 'General inquiry').trim(),
      message: message.trim(),
      replies: [],
    });

    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length) {
      await Notification.insertMany(
        admins.map((a) => ({
          user: a._id,
          title: 'New Contact Form',
          message: `${contact.name} (${contact.email}): ${contact.subject}`,
          type: 'system',
        }))
      );
    }

    res.status(201).json({
      message: 'Thank you! We received your message. Check your Inbox for replies.',
      id: contact._id,
      contact,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/inbox', protect, authorize('buyer', 'admin'), async (req, res) => {
  try {
    const contacts = await Contact.find(contactQueryForUser(req.user))
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = contacts.map((c) => ({
      ...c,
      unreadReplies: (c.replies || []).filter((r) => r.from === 'admin' && !r.readByUser).length,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/inbox/:id', protect, authorize('buyer', 'admin'), async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      ...contactQueryForUser(req.user),
    });

    if (!contact) return res.status(404).json({ message: 'Conversation not found.' });

    let changed = false;
    for (const reply of contact.replies) {
      if (reply.from === 'admin' && !reply.readByUser) {
        reply.readByUser = true;
        changed = true;
      }
    }
    if (changed) await contact.save();

    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/inbox/:id/reply', protect, authorize('buyer', 'admin'), async (req, res) => {
  try {
    const body = req.body?.message?.trim();
    if (!body) return res.status(400).json({ message: 'Message is required.' });

    const contact = await Contact.findOne({
      _id: req.params.id,
      ...contactQueryForUser(req.user),
    });

    if (!contact) return res.status(404).json({ message: 'Conversation not found.' });

    contact.replies.push({ from: 'user', body, readByUser: true });
    contact.lastReplyAt = new Date();
    contact.status = 'new';
    await contact.save();

    await notifyAdminsOfUserReply(contact);

    res.json({ message: 'Reply sent.', contact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

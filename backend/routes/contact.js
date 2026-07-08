import express from 'express';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      subject: (subject || 'General inquiry').trim(),
      message: message.trim(),
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
      message: 'Thank you! We received your message and will contact you soon.',
      id: contact._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

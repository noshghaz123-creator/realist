import Contact from '../models/Contact.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { createUserNotification } from './notificationService.js';

async function findUserForContact(contact) {
  if (contact.userId) {
    const byId = await User.findById(contact.userId);
    if (byId) return byId;
  }
  return User.findOne({ email: contact.email, role: 'buyer' });
}

export async function adminReplyToContact(contactId, message) {
  const body = message?.trim();
  if (!body) throw new Error('Reply message is required.');

  const contact = await Contact.findById(contactId);
  if (!contact) throw new Error('Contact not found.');

  contact.replies.push({ from: 'admin', body, readByUser: false });
  contact.lastReplyAt = new Date();
  contact.status = 'read';
  await contact.save();

  const user = await findUserForContact(contact);
  if (user) {
    await createUserNotification(user._id, {
      title: 'New Reply from Admin',
      message: `Regarding "${contact.subject}": ${body.slice(0, 120)}${body.length > 120 ? '…' : ''}`,
      type: 'system',
    });
  }

  return contact;
}

export function contactQueryForUser(user) {
  const email = user.email?.toLowerCase();
  return {
    $or: [{ userId: user._id }, ...(email ? [{ email }] : [])],
  };
}

export async function notifyAdminsOfUserReply(contact) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (!admins.length) return;
  await Notification.insertMany(
    admins.map((a) => ({
      user: a._id,
      title: 'Inbox Reply',
      message: `${contact.name} replied: ${contact.subject}`,
      type: 'system',
    }))
  );
}

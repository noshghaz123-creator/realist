import Notification from '../models/Notification.js';

export function formatLeadLabel(lead) {
  if (!lead) return 'Property lead';
  if (lead.propertyAddress) return lead.propertyAddress;
  if (lead.city) return `${lead.city}, FL`;
  return 'Property lead';
}

export async function createUserNotification(userId, { title, message, type = 'lead' }) {
  if (!userId) return null;
  try {
    return await Notification.create({ user: userId, title, message, type });
  } catch (err) {
    console.warn('Notification create failed:', err.message);
    return null;
  }
}

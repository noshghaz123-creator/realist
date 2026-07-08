import User from './models/User.js';
import Lead from './models/Lead.js';
import Purchase from './models/Purchase.js';
import Notification from './models/Notification.js';

const DEMO_EMAILS = ['alex@realist.com', 'team@realist.com'];

/** Remove legacy demo seed data — admin dashboard shows real data only */
export async function cleanupDemoData() {
  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select('_id');
  const demoIds = demoUsers.map((u) => u._id);

  if (demoIds.length) {
    await Purchase.deleteMany({ user: { $in: demoIds } });
    await Notification.deleteMany({ user: { $in: demoIds } });
    await User.deleteMany({ _id: { $in: demoIds } });
    console.log('Removed demo users (alex@realist.com, team@realist.com)');
  }

  const legacyLeads = await Lead.countDocuments();
  if (legacyLeads > 0) {
    await Purchase.deleteMany({});
    await Lead.deleteMany({});
    console.log(`Removed ${legacyLeads} legacy marketplace demo leads`);
  }
}

export async function seedIfEmpty() {
  await cleanupDemoData();
  await ensureAdminAccount();
}

/** Dedicated admin account — always available */
export async function ensureAdminAccount() {
  const email = 'admin@realist.com';
  const password = process.env.ADMIN_PASSWORD || 'RealistAdmin#2026!';
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      name: 'REALIST Admin',
      email,
      password,
      role: 'admin',
      plan: 'enterprise',
      leadsRemaining: 9999,
    });
    console.log('Admin account created:', email);
    return admin;
  }
  if (admin.role !== 'admin') {
    admin.role = 'admin';
  }
  admin.password = password;
  admin.markModified('password');
  await admin.save();
  return admin;
}

import User from '../models/User.js';

export const TRIAL_LEAD_LIMIT = 50;

export function resolveLeadLimit(user) {
  if (user?.leadLimit != null && user.leadLimit >= 0) return user.leadLimit;
  const computed = (user?.leadsRemaining ?? 0) + (user?.leadsUsed ?? 0);
  return computed > 0 ? computed : TRIAL_LEAD_LIMIT;
}

export function assertLeadQuota(user, required = 1) {
  if (!user || user.role === 'admin') return;
  const remaining = user.leadsRemaining ?? 0;
  const limit = resolveLeadLimit(user);
  if (remaining < required || (user.leadsUsed ?? 0) >= limit) {
    throw new Error(
      `You have ${Math.max(0, remaining)} leads remaining (limit: ${limit}). Contact admin for on-demand access.`
    );
  }
}

export async function consumeLeadQuota(userId, count) {
  if (!count || count <= 0) return null;

  const user = await User.findById(userId);
  if (!user || user.role === 'admin') return user;

  const limit = resolveLeadLimit(user);
  const remaining = user.leadsRemaining ?? Math.max(0, limit - (user.leadsUsed ?? 0));
  const actualCount = Math.min(count, remaining);

  if (actualCount <= 0) {
    throw new Error('No leads remaining on your account. Contact admin for on-demand access.');
  }

  const used = (user.leadsUsed ?? 0) + actualCount;
  user.leadsUsed = used;
  user.leadLimit = limit;
  user.leadsRemaining = Math.max(0, limit - used);
  await user.save();
  return user;
}

export function quotaSnapshot(user) {
  if (!user) return {};
  const limit = resolveLeadLimit(user);
  return {
    leadLimit: limit,
    leadsUsed: user.leadsUsed ?? 0,
    leadsRemaining: user.leadsRemaining ?? Math.max(0, limit - (user.leadsUsed ?? 0)),
  };
}

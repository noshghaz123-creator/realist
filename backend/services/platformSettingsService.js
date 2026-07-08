import PlatformSettings from '../models/PlatformSettings.js';

export async function getPlatformSettings() {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({ manualRevenue: 0 });
  }
  return settings;
}

export async function updateManualRevenue(amount) {
  const value = Math.max(0, Number(amount) || 0);
  const settings = await PlatformSettings.findOneAndUpdate(
    {},
    { manualRevenue: value },
    { new: true, upsert: true }
  );
  return settings;
}

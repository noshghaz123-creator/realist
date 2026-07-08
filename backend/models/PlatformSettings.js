import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    manualRevenue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('PlatformSettings', platformSettingsSchema);

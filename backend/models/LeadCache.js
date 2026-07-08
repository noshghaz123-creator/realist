import mongoose from 'mongoose';

const leadCacheSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    type: { type: String, enum: ['search', 'featured'], default: 'search' },
    expiresAt: { type: Date, required: true, index: true },
    totalRecords: { type: Number, default: 0 },
    totalAvailable: { type: Number, default: 0 },
    radarStart: { type: Number, default: 0 },
    apiRecordsUsed: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('LeadCache', leadCacheSchema);

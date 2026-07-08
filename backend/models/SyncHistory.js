import mongoose from 'mongoose';

const syncHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['featured_sync', 'search_refresh', 'cache_clear', 'admin_sync', 'cron_featured'],
      required: true,
    },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    recordsAffected: { type: Number, default: 0 },
    apiUsage: { type: Number, default: 0 },
    message: String,
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

syncHistorySchema.index({ createdAt: -1 });

export default mongoose.model('SyncHistory', syncHistorySchema);

import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    amount: { type: Number, required: true },
    dealStatus: {
      type: String,
      enum: ['contacted', 'in_progress', 'closed'],
      default: 'contacted',
    },
    privateNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Purchase', purchaseSchema);

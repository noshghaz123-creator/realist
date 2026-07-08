import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    from: { type: String, enum: ['admin', 'user'], required: true },
    body: { type: String, required: true, trim: true },
    readByUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const contactSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, default: '', trim: true },
    subject: { type: String, default: 'General inquiry', trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'read'], default: 'new' },
    replies: [replySchema],
    lastReplyAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Contact', contactSchema);

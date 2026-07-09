import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'admin', 'team'], default: 'buyer' },
    plan: { type: String, enum: ['trial', 'ondemand', 'basic', 'pro', 'enterprise', 'none'], default: 'trial' },
    phone: String,
    company: String,
    location: String,
    bio: String,
    avatar: String,
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
    favouritePropertyLeads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PropertyLead' }],
    myPropertyLeads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PropertyLead' }],
    leadLimit: { type: Number, default: 50 },
    leadsUsed: { type: Number, default: 0 },
    leadsRemaining: { type: Number, default: 50 },
    blocked: { type: Boolean, default: false },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsAlerts: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);

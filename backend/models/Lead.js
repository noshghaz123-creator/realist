import mongoose from 'mongoose';

const LEAD_TYPES = [
  'pre-foreclosure',
  'foreclosure',
  'probate',
  'tax-delinquent',
  'absentee-owner',
  'vacant',
  'abandoned',
  'bankruptcy',
  'medical',
  'distressed',
];

const leadSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    state: { type: String, required: true },
    propertyType: { type: String, required: true },
    beds: Number,
    baths: Number,
    sqft: Number,
    leadType: { type: String, enum: LEAD_TYPES, required: true },
    tier: { type: String, enum: ['basic', 'qualified', 'premium'], required: true },
    estValue: { type: Number, required: true },
    arv: { type: Number, required: true },
    repairCost: { type: Number, default: 0 },
    price: { type: Number, required: true },
    exclusive: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    sellerMotivated: { type: Boolean, default: false },
    directContact: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'sold', 'inactive'], default: 'active' },
    ownerName: String,
    ownerPhone: String,
    ownerEmail: String,
    address: String,
    notes: String,
    purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export { LEAD_TYPES };
export default mongoose.model('Lead', leadSchema);

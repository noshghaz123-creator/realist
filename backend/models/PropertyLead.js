import mongoose from 'mongoose';

const propertyLeadSchema = new mongoose.Schema(
  {
    radarId: { type: String, required: true, index: true },
    cacheKey: { type: String, index: true },
    featured: { type: Boolean, default: false, index: true },

    ownerName: String,
    ownerPhone: String,
    ownerEmail: String,
    propertyAddress: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    county: String,
    latitude: Number,
    longitude: Number,

    propertyType: String,
    bedrooms: Number,
    bathrooms: Number,
    livingArea: Number,
    lotSize: Number,
    yearBuilt: Number,

    estimatedValue: Number,
    mortgageBalance: Number,
    equity: Number,
    equityPercentage: Number,

    purchaseDate: Date,
    purchasePrice: Number,
    ownerOccupied: Boolean,
    vacant: Boolean,
    mlsStatus: String,
    taxStatus: String,
    preForeclosure: Boolean,
    bankruptcy: Boolean,
    lienInformation: String,
    lastSaleDate: Date,
    lastSalePrice: Number,
    apn: String,

    leadStatus: { type: String, default: 'active' },
    source: { type: String, default: 'propertyradar' },
    rawData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

propertyLeadSchema.index({ cacheKey: 1, createdAt: -1 });
propertyLeadSchema.index({ state: 1, city: 1, zip: 1 });
propertyLeadSchema.index({ featured: 1, updatedAt: -1 });

export default mongoose.model('PropertyLead', propertyLeadSchema);

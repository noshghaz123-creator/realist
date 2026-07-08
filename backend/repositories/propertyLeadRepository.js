import PropertyLead from '../models/PropertyLead.js';
import LeadCache from '../models/LeadCache.js';

export const propertyLeadRepository = {
  findByCacheKey(cacheKey, { skip = 0, limit = 25 } = {}) {
    return PropertyLead.find({ cacheKey }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },
  countByCacheKey(cacheKey) {
    return PropertyLead.countDocuments({ cacheKey });
  },
  deleteByCacheKey(cacheKey) {
    return PropertyLead.deleteMany({ cacheKey });
  },
  findFeatured(limit = 10) {
    return PropertyLead.find({ featured: true }).sort({ updatedAt: -1 }).limit(limit).lean();
  },
  countAll() {
    return PropertyLead.countDocuments();
  },
  deleteAll() {
    return PropertyLead.deleteMany({});
  },
};

export const leadCacheRepository = {
  findByKey(cacheKey) {
    return LeadCache.findOne({ cacheKey });
  },
  upsert(cacheKey, data) {
    return LeadCache.findOneAndUpdate({ cacheKey }, data, { upsert: true, new: true });
  },
  deleteAll() {
    return LeadCache.deleteMany({});
  },
  countAll() {
    return LeadCache.countDocuments();
  },
  findLatest() {
    return LeadCache.findOne().sort({ lastSyncedAt: -1 }).lean();
  },
};

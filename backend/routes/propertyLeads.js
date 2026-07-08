import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  exportLeads,
  getFeatured,
  listLeads,
  refreshLeads,
  searchLeads,
  toggleFavouritePropertyLead,
  toggleMyPropertyLead,
  addAllMyPropertyLeads,
  getFavouritePropertyLeads,
  getMyPropertyLeads,
  exportMyPropertyLeads,
} from '../controllers/leadsController.js';

const router = express.Router();

router.get('/featured', getFeatured);
router.get('/favourites', protect, authorize('buyer', 'admin'), getFavouritePropertyLeads);
router.get('/my-saved', protect, authorize('buyer', 'admin'), getMyPropertyLeads);
router.get('/export/my-leads', protect, authorize('buyer', 'admin'), exportMyPropertyLeads);
router.get('/export', protect, authorize('buyer', 'admin'), exportLeads);
router.get('/', protect, authorize('buyer', 'admin'), listLeads);
router.post('/search', protect, authorize('buyer', 'admin'), searchLeads);
router.post('/refresh', protect, authorize('buyer', 'admin'), refreshLeads);
router.post('/my-leads/bulk', protect, authorize('buyer', 'admin'), addAllMyPropertyLeads);
router.post('/:id/favourite', protect, authorize('buyer', 'admin'), toggleFavouritePropertyLead);
router.post('/:id/my-leads', protect, authorize('buyer', 'admin'), toggleMyPropertyLead);

export default router;

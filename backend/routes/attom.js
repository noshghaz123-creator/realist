import express from 'express';
import { getDistressProperties, CATEGORY_MAP, getDataSources } from '../services/distressDataService.js';

const router = express.Router();

router.get('/categories', (_req, res) => {
  res.json(CATEGORY_MAP);
});

router.get('/sources', (_req, res) => {
  res.json(getDataSources());
});

router.get('/properties', async (req, res) => {
  try {
    const { category = 'all', limit = '6' } = req.query;
    const valid = ['all', ...Object.keys(CATEGORY_MAP)];
    if (!valid.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Use: ${valid.join(', ')}` });
    }
    const result = await getDistressProperties({ category, limit });
    res.json(result);
  } catch (err) {
    console.error('Property data API error:', err.message);
    res.status(502).json({
      message: err.message || 'Failed to fetch property data',
      properties: [],
      source: 'error',
    });
  }
});

export default router;

import { CATEGORY_MAP } from './attomService.js';
import { getBatchDataProperties, hasBatchDataKey } from './batchDataService.js';

export async function getDistressProperties({ category = 'all', limit = 6 } = {}) {
  const cap = Math.min(Math.max(Number(limit) || 6, 1), 12);

  if (!hasBatchDataKey()) {
    return {
      properties: [],
      source: 'batchdata',
      live: false,
      message: 'BatchData API key not configured in backend/.env',
    };
  }

  try {
    return await getBatchDataProperties({ category, limit: cap });
  } catch (err) {
    const msg = err.message || 'BatchData request failed';
    return {
      properties: [],
      source: 'batchdata',
      live: false,
      message: msg.includes('Insufficient balance')
        ? 'Add credits to your BatchData account at app.batchdata.com to load live property data.'
        : msg,
    };
  }
}

export { CATEGORY_MAP };

export function getDataSources() {
  return {
    batchdata: hasBatchDataKey(),
    primary: 'batchdata',
  };
}

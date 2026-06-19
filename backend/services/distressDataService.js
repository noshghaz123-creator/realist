import { CATEGORY_MAP } from './attomService.js';
import { ATTOM_SAMPLE_PROPERTIES } from '../data/attomSampleData.js';
import { getBatchDataProperties, hasBatchDataKey } from './batchDataService.js';

function getSampleProperties(category, cap) {
  const sample = ATTOM_SAMPLE_PROPERTIES.map((p) => ({ ...p, source: 'sample' }));
  const filtered =
    category === 'all' ? sample : sample.filter((p) => p.categories.includes(category));
  return filtered.slice(0, cap);
}

function sampleFallback(category, cap, message) {
  return {
    properties: getSampleProperties(category, cap),
    source: 'sample',
    live: false,
    message,
  };
}

export async function getDistressProperties({ category = 'all', limit = 6 } = {}) {
  const cap = Math.min(Math.max(Number(limit) || 6, 1), 12);

  if (!hasBatchDataKey()) {
    return sampleFallback(
      category,
      cap,
      'BatchData API key not configured — showing sample data.'
    );
  }

  try {
    const result = await getBatchDataProperties({ category, limit: cap });
    if (result?.properties?.length > 0) return result;

    const reason = result?.message?.includes('Insufficient balance')
      ? 'BatchData account has insufficient credits — showing sample data.'
      : result?.message
        ? `${result.message} Showing sample data.`
        : 'No live properties found — showing sample data.';

    return sampleFallback(category, cap, reason);
  } catch (err) {
    const msg = err.message || 'BatchData request failed';
    const reason = msg.includes('Insufficient balance')
      ? 'BatchData account has insufficient credits — showing sample data.'
      : `Live data unavailable — showing sample data.`;

    return sampleFallback(category, cap, reason);
  }
}

export { CATEGORY_MAP };

export function getDataSources() {
  return {
    batchdata: hasBatchDataKey(),
    primary: 'batchdata',
  };
}

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const lines = [];

try {
  const { searchPropertyRadar } = await import('../services/propertyRadarService.js');
  const { buildSearchCriteria, mapPropertyRadarRecord, qualifiesProperty } = await import(
    '../utils/propertyRadarMapper.js'
  );

  const filters = { county: 'Orange', city: 'Orlando', propertyType: 'both' };
  const criteria = buildSearchCriteria(filters);
  lines.push(`criteria: ${JSON.stringify(criteria)}`);

  const batch = await searchPropertyRadar({ criteria, purchase: 1, limit: 5, start: 0 });
  lines.push(`batch keys: ${Object.keys(batch).join(', ')}`);
  lines.push(`resultCount: ${batch.results?.length}`);

  if (batch.results?.[0]) {
    const raw = batch.results[0];
    lines.push(`raw keys: ${Object.keys(raw).join(', ')}`);
    lines.push(`raw sample: ${JSON.stringify(raw).slice(0, 1500)}`);

    const mapped = mapPropertyRadarRecord(raw, { cacheKey: 'debug' });
    lines.push(`mapped: ${JSON.stringify({
      radarId: mapped.radarId,
      state: mapped.state,
      city: mapped.city,
      propertyAddress: mapped.propertyAddress,
      apn: mapped.apn,
    })}`);
    lines.push(`qualifies: ${qualifiesProperty(mapped)}`);

    let q = 0;
    for (const r of batch.results) {
      if (qualifiesProperty(mapPropertyRadarRecord(r, { cacheKey: 'debug' }))) q += 1;
    }
    lines.push(`qualified ${q} of ${batch.results.length}`);
  } else {
    lines.push('no results in batch');
  }
} catch (err) {
  lines.push(`ERROR: ${err.stack || err.message}`);
}

const outPath = path.join(__dirname, '..', 'pr-debug.txt');
fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${outPath}`);

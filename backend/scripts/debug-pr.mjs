import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, '..', '.env') });

const out = [];
const log = (line) => out.push(String(line));

try {
  const { searchPropertyRadar } = await import('../services/propertyRadarService.js');
  const {
    buildSearchCriteria,
    mapPropertyRadarRecord,
    qualifiesProperty,
    unwrapPropertyRadarRecord,
  } = await import('../utils/propertyRadarMapper.js');

  const filters = { county: 'Orange', city: 'Orlando', propertyType: 'both' };
  const criteria = buildSearchCriteria(filters);
  log('CRITERIA: ' + JSON.stringify(criteria));

  const batch = await searchPropertyRadar({ criteria, purchase: 1, limit: 5, start: 0 });
  log('BATCH_KEYS: ' + Object.keys(batch).join(', '));
  log('COUNT: ' + (batch.results?.length ?? 0));

  for (let i = 0; i < Math.min(3, batch.results?.length || 0); i += 1) {
    const raw = batch.results[i];
    log(`\n--- RECORD ${i} ---`);
    log('RAW_KEYS: ' + Object.keys(raw || {}).join(', '));
    log('RAW: ' + JSON.stringify(raw).slice(0, 2000));
    const unwrapped = unwrapPropertyRadarRecord(raw);
    log('UNWRAPPED_KEYS: ' + Object.keys(unwrapped || {}).join(', '));
    const mapped = mapPropertyRadarRecord(raw, { cacheKey: 'debug' });
    log('MAPPED: ' + JSON.stringify({
      radarId: mapped.radarId,
      state: mapped.state,
      city: mapped.city,
      propertyAddress: mapped.propertyAddress,
      county: mapped.county,
      apn: mapped.apn,
    }));
    log('QUALIFIES: ' + qualifiesProperty(mapped));
  }

  let q = 0;
  for (const r of batch.results || []) {
    if (qualifiesProperty(mapPropertyRadarRecord(r, { cacheKey: 'debug' }))) q += 1;
  }
  log('\nQUALIFIED: ' + q + ' of ' + (batch.results?.length || 0));
} catch (err) {
  log('ERROR: ' + (err.stack || err.message));
}

const outPath = path.join(dir, '..', 'pr-debug.txt');
fs.writeFileSync(outPath, out.join('\n'));
process.stdout.write('WROTE ' + outPath + '\n' + out.join('\n'));

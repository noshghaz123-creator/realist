import dotenv from 'dotenv';
import { testBatchDataKey } from '../services/batchDataService.js';

dotenv.config();

const result = await testBatchDataKey();

if (result.ok) {
  console.log(`BatchData API key works — ${result.message}`);
  process.exit(0);
}

console.error(`BatchData API key failed: ${result.error}`);
console.error('Get your key at https://app.batchdata.com after signup, then add to backend/.env:');
console.error('BATCHDATA_API_KEY=your_40_character_token');
process.exit(1);

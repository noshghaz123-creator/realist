import dotenv from 'dotenv';

dotenv.config();

const key = process.env.ATTOM_API_KEY?.trim();

if (!key) {
  console.error('ATTOM_API_KEY is not set in backend/.env');
  process.exit(1);
}

const res = await fetch(
  'https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detailmortgageowner?postalCode=33301&pagesize=1',
  { headers: { Accept: 'application/json', apikey: key } }
);

if (res.ok) {
  const data = await res.json();
  const count = data?.property?.length ?? 0;
  console.log(`ATTOM API key works — ${count} property returned. Live data is ready.`);
  process.exit(0);
}

const body = await res.text();
console.error(`ATTOM API key failed (${res.status}). Update backend/.env with a new key from https://api.developer.attomdata.com/`);
console.error(body.slice(0, 200));
process.exit(1);

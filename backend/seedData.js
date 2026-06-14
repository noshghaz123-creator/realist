import User from './models/User.js';
import Lead from './models/Lead.js';
import Purchase from './models/Purchase.js';
import Notification from './models/Notification.js';

/** South Florida–focused seed data aligned with REALIST business plan */
const leads = [
  {
    city: 'Miami', state: 'FL', propertyType: 'Single Family', beds: 3, baths: 2, sqft: 1650,
    leadType: 'pre-foreclosure', tier: 'premium', estValue: 385000, arv: 465000, repairCost: 42000, price: 399,
    sellerMotivated: true, directContact: true, urgent: true,
    ownerName: 'James Williams', ownerPhone: '(305) 555-0143',
    address: '4821 SW 8th St, Miami, FL 33134', notes: 'Seller confirmed interest. Behind on payments 90 days.',
  },
  {
    city: 'Fort Lauderdale', state: 'FL', propertyType: 'Duplex', beds: 4, baths: 2, sqft: 2100,
    leadType: 'tax-delinquent', tier: 'qualified', estValue: 310000, arv: 395000, repairCost: 28000, price: 249,
    sellerMotivated: true, directContact: true,
    ownerName: 'Maria Garcia', ownerPhone: '(954) 555-0287',
    address: '1247 NE 4th Ave, Fort Lauderdale, FL 33301',
  },
  {
    city: 'West Palm Beach', state: 'FL', propertyType: 'Single Family', beds: 4, baths: 3, sqft: 2400,
    leadType: 'probate', tier: 'premium', estValue: 425000, arv: 520000, repairCost: 55000, price: 449,
    sellerMotivated: true, directContact: true,
    ownerName: 'Robert Chen', ownerPhone: '(561) 555-0391',
    address: '892 Clematis St, West Palm Beach, FL 33401', notes: 'Estate sale. Heirs want quick close.',
  },
  {
    city: 'Hialeah', state: 'FL', propertyType: 'Townhouse', beds: 2, baths: 1, sqft: 1100,
    leadType: 'vacant', tier: 'basic', estValue: 265000, arv: 310000, repairCost: 18000, price: 35,
    ownerName: 'Lisa Park', ownerPhone: '(305) 555-0512',
    address: '3300 W 12th Ave, Hialeah, FL 33012',
  },
  {
    city: 'Boca Raton', state: 'FL', propertyType: 'Single Family', beds: 5, baths: 3, sqft: 3200,
    leadType: 'absentee-owner', tier: 'premium', estValue: 680000, arv: 820000, repairCost: 72000, price: 899,
    exclusive: true, urgent: true, sellerMotivated: true, directContact: true,
    ownerName: 'David Miller', ownerPhone: '(561) 555-0678',
    address: '4521 NW 2nd Ave, Boca Raton, FL 33431', notes: 'Out-of-state owner. Wants immediate sale.',
  },
  {
    city: 'Tampa', state: 'FL', propertyType: 'Single Family', beds: 3, baths: 2, sqft: 1750,
    leadType: 'foreclosure', tier: 'qualified', estValue: 295000, arv: 360000, repairCost: 32000, price: 199,
    sellerMotivated: true,
    ownerName: 'Carlos Rivera', ownerPhone: '(813) 555-0823',
    address: '1200 N Florida Ave, Tampa, FL 33602',
  },
  {
    city: 'Hollywood', state: 'FL', propertyType: 'Condo', beds: 2, baths: 2, sqft: 1200,
    leadType: 'bankruptcy', tier: 'qualified', estValue: 240000, arv: 295000, repairCost: 22000, price: 175,
    directContact: true,
    ownerName: 'Sarah Johnson', ownerPhone: '(954) 555-0945',
    address: '789 Hollywood Blvd, Hollywood, FL 33019',
  },
  {
    city: 'Pompano Beach', state: 'FL', propertyType: 'Single Family', beds: 3, baths: 2, sqft: 1580,
    leadType: 'abandoned', tier: 'basic', estValue: 320000, arv: 390000, repairCost: 45000, price: 45,
    ownerName: 'Frank Ortiz', ownerPhone: '(954) 555-1102',
    address: '2100 NE 36th St, Pompano Beach, FL 33064',
  },
  {
    city: 'Orlando', state: 'FL', propertyType: 'Single Family', beds: 4, baths: 2, sqft: 1900,
    leadType: 'medical', tier: 'premium', estValue: 355000, arv: 430000, repairCost: 38000, price: 349,
    sellerMotivated: true, directContact: true, urgent: true,
    ownerName: 'Patricia Moore', ownerPhone: '(407) 555-2234',
    address: '5600 Curry Ford Rd, Orlando, FL 32822', notes: 'Health-related move. Highly motivated.',
  },
  {
    city: 'Davie', state: 'FL', propertyType: 'Single Family', beds: 3, baths: 2, sqft: 1420,
    leadType: 'distressed', tier: 'qualified', estValue: 278000, arv: 340000, repairCost: 26000, price: 189,
    status: 'inactive',
    ownerName: 'Kevin Brooks', ownerPhone: '(954) 555-3310',
    address: '4100 SW 64th Ave, Davie, FL 33314', notes: 'Pending team verification.',
  },
];

export async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) return;

  console.log('Seeding database...');

  const buyer = await User.create({
    name: 'Alex Thompson', email: 'alex@realist.com', password: 'demo123',
    role: 'buyer', plan: 'pro', leadsRemaining: 42, phone: '+1 (305) 555-1234',
    company: 'Thompson Investments', location: 'Miami, FL',
  });

  await User.create([
    { name: 'Admin User', email: 'admin@realist.com', password: 'demo123', role: 'admin', plan: 'enterprise' },
    { name: 'Team Member', email: 'team@realist.com', password: 'demo123', role: 'team', plan: 'enterprise' },
  ]);

  const createdLeads = await Lead.insertMany(leads);

  await Purchase.create([
    { user: buyer._id, lead: createdLeads[0]._id, amount: 399, dealStatus: 'in_progress',
      privateNotes: 'Called seller twice. Very motivated. Setting up property visit.' },
    { user: buyer._id, lead: createdLeads[2]._id, amount: 449, dealStatus: 'contacted',
      privateNotes: 'Left voicemail. Awaiting callback from estate attorney.' },
    { user: buyer._id, lead: createdLeads[3]._id, amount: 35, dealStatus: 'closed',
      privateNotes: 'Deal closed! Property purchased at $198,000.' },
  ]);

  buyer.favourites = [createdLeads[4]._id, createdLeads[1]._id];
  await buyer.save();

  const admin = await User.findOne({ email: 'admin@realist.com' });
  await Notification.insertMany([
    { user: buyer._id, title: 'New Lead Available', message: 'Exclusive absentee-owner lead in Boca Raton, FL.', type: 'lead' },
    { user: buyer._id, title: 'Lead Purchased', message: 'You successfully unlocked Miami pre-foreclosure lead.', type: 'purchase' },
    { user: admin._id, title: 'New User Signup', message: 'A new investor registered on the platform.', type: 'system' },
  ]);

  console.log('Seed complete. Demo: alex@realist.com / demo123');
}

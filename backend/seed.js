import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Lead from './models/Lead.js';
import Purchase from './models/Purchase.js';
import Notification from './models/Notification.js';

dotenv.config();

const leads = [
  {
    city: 'Phoenix',
    state: 'AZ',
    propertyType: 'Single Family',
    beds: 3,
    baths: 2,
    sqft: 1850,
    leadType: 'foreclosure',
    tier: 'premium',
    estValue: 320000,
    arv: 385000,
    price: 299,
    ownerName: 'James Williams',
    ownerPhone: '(602) 555-0143',
    ownerEmail: 'jwilliams@email.com',
    address: '4821 W Camelback Rd, Phoenix, AZ 85031',
    notes: 'Seller motivated, behind on payments.',
  },
  {
    city: 'Houston',
    state: 'TX',
    propertyType: 'Duplex',
    beds: 4,
    baths: 2,
    sqft: 2200,
    leadType: 'vacant',
    tier: 'qualified',
    estValue: 210000,
    arv: 265000,
    price: 149,
    ownerName: 'Maria Garcia',
    ownerPhone: '(713) 555-0287',
    address: '1247 Oak Street, Houston, TX 77002',
  },
  {
    city: 'Atlanta',
    state: 'GA',
    propertyType: 'Single Family',
    beds: 4,
    baths: 3,
    sqft: 2400,
    leadType: 'probate',
    tier: 'premium',
    estValue: 275000,
    arv: 340000,
    price: 249,
    ownerName: 'Robert Chen',
    ownerPhone: '(404) 555-0391',
    address: '892 Peachtree Ln, Atlanta, GA 30309',
    notes: 'Estate sale, heirs want quick close.',
  },
  {
    city: 'Las Vegas',
    state: 'NV',
    propertyType: 'Condo',
    beds: 2,
    baths: 1,
    sqft: 980,
    leadType: 'distressed',
    tier: 'basic',
    estValue: 185000,
    arv: 220000,
    price: 49,
    ownerName: 'Lisa Park',
    ownerPhone: '(702) 555-0512',
    address: '3300 S Las Vegas Blvd, Las Vegas, NV 89109',
  },
  {
    city: 'Dallas',
    state: 'TX',
    propertyType: 'Single Family',
    beds: 5,
    baths: 3,
    sqft: 3200,
    leadType: 'pre-foreclosure',
    tier: 'premium',
    estValue: 415000,
    arv: 510000,
    price: 499,
    exclusive: true,
    urgent: true,
    ownerName: 'David Miller',
    ownerPhone: '(214) 555-0678',
    address: '4521 Preston Rd, Dallas, TX 75205',
    notes: 'Immediate sale needed.',
  },
  {
    city: 'Miami',
    state: 'FL',
    propertyType: 'Townhouse',
    beds: 3,
    baths: 2,
    sqft: 1650,
    leadType: 'foreclosure',
    tier: 'qualified',
    estValue: 290000,
    arv: 355000,
    price: 199,
    ownerName: 'Carlos Rivera',
    ownerPhone: '(305) 555-0823',
    address: '1200 Brickell Ave, Miami, FL 33131',
  },
  {
    city: 'Denver',
    state: 'CO',
    propertyType: 'Single Family',
    beds: 3,
    baths: 2,
    sqft: 1900,
    leadType: 'vacant',
    tier: 'basic',
    estValue: 340000,
    arv: 410000,
    price: 79,
    ownerName: 'Sarah Johnson',
    ownerPhone: '(303) 555-0945',
    address: '789 Colfax Ave, Denver, CO 80203',
  },
];

import { getMongoUri } from './config/startDb.js';

async function seed() {
  const uri = await getMongoUri();
  await mongoose.connect(uri);
  console.log('Connected. Seeding...');

  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Purchase.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const buyer = await User.create({
    name: 'Alex Thompson',
    email: 'alex@realist.com',
    password: 'demo123',
    role: 'buyer',
    plan: 'pro',
    leadsRemaining: 12,
    phone: '+1 (555) 123-4567',
    company: 'Thompson Investments',
    location: 'Dallas, TX',
  });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@realist.com',
    password: 'demo123',
    role: 'admin',
    plan: 'enterprise',
  });

  const team = await User.create({
    name: 'Team Member',
    email: 'team@realist.com',
    password: 'demo123',
    role: 'team',
    plan: 'enterprise',
  });

  const createdLeads = await Lead.insertMany(leads);

  await Purchase.create([
    {
      user: buyer._id,
      lead: createdLeads[0]._id,
      amount: 299,
      dealStatus: 'in_progress',
      privateNotes: 'Called seller twice. Very motivated. Setting up property visit.',
    },
    {
      user: buyer._id,
      lead: createdLeads[2]._id,
      amount: 249,
      dealStatus: 'contacted',
      privateNotes: 'Left voicemail. Awaiting callback.',
    },
    {
      user: buyer._id,
      lead: createdLeads[3]._id,
      amount: 49,
      dealStatus: 'closed',
      privateNotes: 'Deal closed! Property purchased at $138,000.',
    },
  ]);

  buyer.favourites = [createdLeads[4]._id, createdLeads[1]._id];
  await buyer.save();

  await Notification.insertMany([
    {
      user: buyer._id,
      title: 'New Lead Available',
      message: 'A new premium lead in Dallas, TX has been listed.',
      type: 'lead',
    },
    {
      user: buyer._id,
      title: 'Lead Purchased',
      message: 'You successfully unlocked Phoenix, AZ lead.',
      type: 'purchase',
    },
    {
      user: admin._id,
      title: 'New User Signup',
      message: 'A new investor registered on the platform.',
      type: 'system',
    },
  ]);

  console.log('Seed complete!');
  console.log('Demo accounts:');
  console.log('  Buyer: alex@realist.com / demo123');
  console.log('  Admin: admin@realist.com / demo123');
  console.log('  Team:  team@realist.com / demo123');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/startDb.js';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import purchaseRoutes from './routes/purchases.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import newsletterRoutes from './routes/newsletter.js';
import attomRoutes from './routes/attom.js';
import { seedIfEmpty } from './seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin(origin, callback) {
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (
        !origin ||
        origin === allowed ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/attom', attomRoutes);

connectDB()
  .then(() => seedIfEmpty())
  .then(() => {
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other backend process (Ctrl+C) and run npm run dev again.`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    if (/authentication failed|bad auth/i.test(err.message)) {
      console.error('Fix: Check MONGODB_URI username/password in backend/.env (Atlas → Database Access).');
    } else if (/whitelist|IP/i.test(err.message)) {
      console.error('Fix: Atlas → Network Access → Add IP → Allow Access from Anywhere (0.0.0.0/0).');
    } else if (!process.env.MONGODB_URI) {
      console.error('Fix: Add MONGODB_URI to backend/.env (MongoDB Atlas connection string).');
    }
    process.exit(1);
  });

import express from 'express';

const router = express.Router();
const subscribers = new Set();

router.post('/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email?.includes('@')) {
    return res.status(400).json({ message: 'Valid email required' });
  }
  subscribers.add(email.toLowerCase());
  res.json({ message: 'Subscribed successfully!' });
});

export default router;

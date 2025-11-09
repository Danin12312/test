// /pages/api/gettoken.js

import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

// Initialize client using the REDIS_URL
const client = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Generate the unique token (Only the UUID part)
  const token = randomUUID();

  // 2. Set default data
  const defaultBalance = 500;
  const userData = {
    balance: defaultBalance,
    roundId: 0,
  };

  // 3. Store the data in Redis
  try {
    // 'set' command: must 'stringify' the object
    await client.set(token, JSON.stringify(userData));

    // 4. Return the new token and balance
    res.status(200).json({
      token: token,
      balance: defaultBalance,
    });
  } catch (error) {
    console.error('Failed to set token in Redis:', error);
    res.status(500).json({ error: 'Failed to create token.' });
  }
}

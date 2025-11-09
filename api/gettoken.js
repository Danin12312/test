// /pages/api/gettoken.js

import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Generate the unique token
  const randomPart = Math.floor(Math.random() * 9000000) + 1000000;
  const uuidPart = randomUUID();
  const token = `${randomPart}/${uuidPart}`;

  // 2. Set default data
  const defaultBalance = 500;
  const userData = {
    balance: defaultBalance,
    roundId: 0, // Start round count at 0
  };

  // 3. Store the data in Vercel KV
  try {
    await kv.set(token, userData);

    // 4. Return the new token and balance
    res.status(200).json({
      token: token,
      balance: defaultBalance,
    });
  } catch (error) {
    console.error('Failed to set token in KV:', error);
    res.status(500).json({ error: 'Failed to create token.' });
  }
}

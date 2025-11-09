// /pages/api/gettoken.js

import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

function setCORSHeaders(req, res) {
  // ------------------------------------------------------------------
  // ⚠️ YOU MUST UPDATE THIS LINE ⚠️
  //
  // Put your *exact* frontend domain here.
  // If you ran "npx serve", this will be 'http://localhost:3000'
  //
  const origin = 'https://test-1wfy.vercel.app/'; // <-- ⚠️ UPDATE THIS
  //
  // ------------------------------------------------------------------
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin); // Must be a specific domain
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Accept, Authorization'
  );
}

// Initialize client using the REDIS_URL
const client = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Generate the unique token (Only the UUID part)
  const token = randomUUID();

  // 2. Set default data
  const defaultBalance = 50000;
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

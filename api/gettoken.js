// /pages/api/gettoken.js

import { crypto } from 'crypto';

// ⚠️ WARNING: This in-memory 'db' is for local testing ONLY.
// It will NOT work on Vercel because serverless functions are stateless.
// You MUST replace this with a real database like Vercel KV.
// See the explanation below.
const db = new Map();

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Generate the unique token
  const randomPart = Math.floor(Math.random() * 9000000) + 1000000;
  const uuidPart = crypto.randomUUID();
  const token = `${randomPart}/${uuidPart}`;

  // 2. Set default data
  const defaultBalance = 500;
  const userData = {
    balance: defaultBalance,
    roundId: 0, // Start round count at 0
  };

  // 3. Store the data (using the placeholder 'db')
  // In a real app, you would 'await kv.set(token, userData)'
  db.set(token, userData);
  console.log('DB state after /gettoken:', db); // For testing

  // 4. Return the new token and balance
  res.status(200).json({
    token: token,
    balance: defaultBalance,
  });
}

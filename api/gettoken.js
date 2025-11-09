import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

// Initialize client using the REDIS_URL
const client = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const randomPart = Math.floor(Math.random() * 9000000) + 1000000;
  const uuidPart = randomUUID();
  const token = `${randomPart}/${uuidPart}`;

  const defaultBalance = 500;
  const userData = {
    balance: defaultBalance,
    roundId: 0,
  };

  try {
    // 'set' command is different: must 'stringify' the object
    await client.set(token, JSON.stringify(userData));

    res.status(200).json({
      token: token,
      balance: defaultBalance,
    });
  } catch (error) {
    console.error('Failed to set token in Redis:', error);
    res.status(500).json({ error: 'Failed to create token.' });
  }
}

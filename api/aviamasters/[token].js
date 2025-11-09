import { Redis } from 'ioredis';

// Initialize client using the REDIS_URL
const client = new Redis(process.env.REDIS_URL);

// ... (Keep your helper functions 'calculateWin' and 'createLastActionId' here) ...

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.query;
  const { command, options } = req.body;

  let userDataString;
  try {
    // 1. Get user data string
    userDataString = await client.get(token);
  } catch (error) {
    console.error('Failed to get token from Redis:', error);
    return res.status(500).json({ error: 'Database error.' });
  }

  if (!userDataString) {
    return res.status(404).json({ error: 'Token not found or invalid.' });
  }

  // 2. We must 'parse' the string back into an object
  let userData = JSON.parse(userDataString);
  
  // === COMMAND: INIT ===
  if (command === 'init') {
    userData.roundId += 1;
    // Save updated data (must stringify)
    await client.set(token, JSON.stringify(userData)); 

    // ... (The rest of your 'init' response JSON is the same) ...
    // ...
    return res.status(200).json(response);
  }

  // === COMMAND: SPIN ===
  if (command === 'spin') {
    // ... (Your 'spin' logic is the same) ...
    
    // Save new data back to Redis (must stringify)
    await client.set(token, JSON.stringify(userData));

    // ... (The rest of your 'spin' response JSON is the same) ...
    // ...
    return res.status(200).json(response);
  }

  return res.status(400).json({ error: 'Unknown command.' });
}

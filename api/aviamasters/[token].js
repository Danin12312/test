// /pages/api/Aviamasters/[token].js

import { Redis } from 'ioredis';

const client = new Redis(process.env.REDIS_URL);

// --- Re-usable function to add all CORS headers ---
// --- FIX: Added 'req' as an argument ---
function setCORSHeaders(req, res) {
  const origin = req.headers.origin; // Dynamically get the origin
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Accept, Authorization'
  );
}

// --- Helper function to simulate win logic ---
function calculateWin(bet) {
  // --- START TEST ---
  // Forcing a win of 2x the bet to prove the balance math works.
  const winAmount = bet * 2;
  return winAmount;
  // --- END TEST ---
}

// --- Helper function to generate a "last action ID" ---
function createLastActionId(roundId) {
  const timestamp = Date.now();
  return `${timestamp}_${roundId}`;
}

// --- Main API Handler ---
export default async function handler(req, res) {
  // --- Add CORS Headers to all responses ---
  // --- FIX: Passed 'req' to the function ---
  setCORSHeaders(req, res);

  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Handle the main POST request
  if (req.method === 'POST') {
    const { token } = req.query;
    const { command, options } = req.body;

    let userDataString;
    try {
      userDataString = await client.get(token);
    } catch (error) {
      console.error('Failed to get token from Redis:', error);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (!userDataString) {
      return res.status(404).json({ error: 'Token not found or invalid.' });
    }

    let userData = JSON.parse(userDataString);

    // === COMMAND: INIT ===
    if (command === 'init') {
      userData.roundId += 1; // Increment roundId
      await client.set(token, JSON.stringify(userData));

      const response = {
        api_version: '2',
        options: {
          available_bets: [
            10, 20, 50, 100, 150, 200, 250, 500, 1000, 2000, 5000, 10000,
            20000, 35000, 50000, 75000, 100000,
          ],
          default_bet: 50,
          paytable: {}, paytables: {}, special_symbols: [], lines: [],
          reels: { main: [] }, layout: { reels: 1, rows: 1 },
          currency: {
            code: 'GEMS', symbol: 'GEMS', subunits: 100, exponent: 2,
          },
          screen: [],
          default_seed: 19270016,
        },
        balance: { game: 0, wallet: userData.balance },
        flow: {
          round_id: userData.roundId,
          last_action_id: `${userData.roundId}_1`,
          state: 'ready',
          command: 'init',
          available_actions: ['init', 'spin'],
        },
      };
      return res.status(200).json(response);
    }

    // === COMMAND: SPIN ===
    if (command === 'spin') {
      const betAmount = parseInt(options.bet, 10);
      const currentBalance = parseInt(userData.balance, 10);

      if (currentBalance < betAmount) {
        return res.status(400).json({ error: 'Insufficient funds.' });
      }

      const winAmount = calculateWin(betAmount); 
      const newBalance = currentBalance - betAmount + winAmount;

      userData.balance = newBalance;
      await client.set(token, JSON.stringify(userData));

      const response = {
        api_version: '2',
        outcome: {
          screen: null, special_symbols: null,
          bet: betAmount,
          win: winAmount,
          wins: [],
          storage: { 
            seed: Math.floor(Math.random() * 99999999) 
          },
        },
        balance: {
          game: 0,
          wallet: newBalance,
        },
        flow: {
          round_id: userData.roundId,
          last_action_id: `${userData.roundId}_1`,
          state: 'closed',
          command: 'spin',
          available_actions: ['init', 'spin'],
        },
      };
      return res.status(200).json(response);
    }

    return res.status(400).json({ error: 'Unknown command.' });
  }

  // 3. Reject all other methods
  return res.status(405).json({ error: 'Method Not Allowed' });
}

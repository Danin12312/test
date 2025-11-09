// /pages/api/aviamasters/[token].js

import { Redis } from 'ioredis';

// Initialize the Redis client.
// It automatically finds and uses the process.env.REDIS_URL
const client = new Redis(process.env.REDIS_URL);

// Helper function to simulate win logic
function calculateWin(bet) {
  const winChance = Math.random();
  let winMultiplier = 0;

  if (winChance > 0.8) {
    // 20% chance to win 1x-2x
    winMultiplier = 1 + Math.random();
  } else if (winChance > 0.6) {
    // 20% chance to win 0.5x
    winMultiplier = 0.5;
  }
  // 60% chance to win 0

  const winAmount = Math.floor(bet * winMultiplier);
  return winAmount;
}

// Helper function to generate a "last action ID"
function createLastActionId(roundId) {
  const timestamp = Date.now();
  return `${timestamp}_${roundId}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.query; // Get token from the URL
  const { command, options } = req.body;

  let userDataString;
  try {
    // 1. Get user data string from Redis
    userDataString = await client.get(token);
  } catch (error) {
    console.error('Failed to get token from Redis:', error);
    return res.status(500).json({ error: 'Database error.' });
  }

  if (!userDataString) {
    return res.status(404).json({ error: 'Token not found or invalid.' });
  }

  // 2. Parse the string from Redis back into a JSON object
  let userData = JSON.parse(userDataString);

  // === COMMAND: INIT ===
  if (command === 'init') {
    userData.roundId += 1; // Increment roundId

    // Save updated roundId back to Redis (must stringify)
    await client.set(token, JSON.stringify(userData));

    const response = {
      api_version: '2',
      options: {
        available_bets: [
          10, 20, 50, 100, 150, 200, 250, 500, 1000, 2000, 5000, 10000,
          20000, 35000, 50000, 75000, 100000,
        ],
        default_bet: 50,
        paytable: {},
        paytables: {},
        special_symbols: [],
        lines: [],
        reels: { main: [] },
        layout: { reels: 1, rows: 1 },
        currency: {
          code: 'KATANICA',
          symbol: 'KATANICA',
          subunits: 100,
          exponent: 2,
        },
        screen: [],
        default_seed: 19270016,
      },
      balance: {
        game: 0,
        wallet: userData.balance, // Use the stored balance
      },
      flow: {
        round_id: userData.roundId, // Use the stored round ID
        last_action_id: createLastActionId(userData.roundId),
        state: 'ready',
        command: 'init',
        available_actions: ['init', 'spin'],
      },
    };
    return res.status(200).json(response);
  }

  // === COMMAND: SPIN ===
  if (command === 'spin') {
    const betAmount = options.bet;

    if (userData.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient funds.' });
    }

    const winAmount = calculateWin(betAmount);
    const newBalance = userData.balance - betAmount + winAmount;

    // Update user data
    userData.balance = newBalance;

    // Save new balance back to Redis (must stringify)
    await client.set(token, JSON.stringify(userData));

    const response = {
      api_version: '2',
      outcome: {
        screen: null,
        special_symbols: null,
        bet: betAmount,
        win: winAmount,
        wins: [],
        storage: {
          seed: Math.random().toString(), // New random seed
        },
      },
      balance: {
        game: 0,
        wallet: newBalance, // The new, updated balance
      },
      flow: {
        round_id: userData.roundId, // The current round ID
        last_action_id: createLastActionId(userData.roundId),
        state: 'closed',
        command: 'spin',
        available_actions: ['init', 'spin'],
      },
    };
    return res.status(200).json(response);
  }

  return res.status(400).json({ error: 'Unknown command.' });
}

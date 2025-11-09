// /pages/api/aviamasters/[token].js

// ⚠️ WARNING: This in-memory 'db' is for local testing ONLY.
// You MUST replace this with a real database like Vercel KV.
const db = new Map();

// Helper function to simulate win logic
// You can make this as complex as you want.
function calculateWin(bet) {
  // Makes it "hard to win" (e.g., ~80% chance of losing)
  const winChance = Math.random();
  let winMultiplier = 0;

  if (winChance > 0.8) {
    // If they win, give them between 1x and 2x their bet
    winMultiplier = 1 + Math.random(); // Random number between 1.0 and 2.0
  } else if (winChance > 0.6) {
    // Small win (e.g., 20% chance of getting 0.5x bet)
    winMultiplier = 0.5;
  }
  // Otherwise, winMultiplier remains 0 (loss)

  const winAmount = Math.floor(bet * winMultiplier);
  return winAmount;
}

// Helper function to generate a "last action ID"
function createLastActionId(roundId) {
  const timestamp = Date.now();
  return `${timestamp}_${roundId}`;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.query; // Get token from the URL (e.g., /api/aviamasters/TOKEN_HERE)
  const { command, options } = req.body;

  // 1. Get user data from our 'db'
  // In a real app: const userData = await kv.get(token);
  const userData = db.get(token);
  console.log('DB state at start of /aviamasters:', db); // For testing

  if (!userData) {
    return res.status(404).json({ error: 'Token not found or invalid.' });
  }

  // === COMMAND: INIT ===
  if (command === 'init') {
    // Increment roundId for this "init" action
    userData.roundId += 1;
    
    // In a real app: await kv.set(token, userData);
    db.set(token, userData); // Save the incremented roundId

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
          code: 'GEMS',
          symbol: 'GEMS',
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

    // Check for sufficient funds
    if (userData.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient funds.' });
    }

    // 2. Calculate game logic
    const winAmount = calculateWin(betAmount);
    const newBalance = userData.balance - betAmount + winAmount;

    // 3. Update user data
    userData.balance = newBalance;
    // We use the *same* roundId as the 'init' command for the 'spin' that follows
    // If you want a new roundId for every spin, you would increment it here.
    // Based on your example, it seems the roundId stays the same for the spin.

    // 4. Save new data back to 'db'
    // In a real app: await kv.set(token, userData);
    db.set(token, userData);

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
        game: 0, // You can change this if needed
        wallet: newBalance, // The new, updated balance
      },
      flow: {
        round_id: userData.roundId, // The current round ID
        last_action_id: createLastActionId(userData.roundId), // A new action ID for this spin
        state: 'closed',
        command: 'spin',
        available_actions: ['init', 'spin'],
      },
    };
    return res.status(200).json(response);
  }

  // Fallback for unknown commands
  return res.status(400).json({ error: 'Unknown command.' });
}

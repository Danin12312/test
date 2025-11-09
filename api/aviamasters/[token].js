// /pages/api/Aviamasters/[token].js

import { Redis } from 'ioredis';

// Initialize the Redis client.
const client = new Redis(process.env.REDIS_URL);

// --- Re-usable function to add all CORS headers ---
function setCORSHeaders(req, res) {
  const origin = req.headers.origin; 
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

// --- Helper function to generate a "last action ID" ---
function createLastActionId(roundId) {
  const timestamp = Date.now();
  return `${timestamp}_${roundId}`;
}

// -----------------------------------------------------------------
// --- GAME LOGIC (Extracted from index-BUV3pfE2.js) ---
// -----------------------------------------------------------------

const Oa = 2147483648;
const Fa = 1103515245;
const Ma = 12345;
const bs = 1e-4;
const Re = Math.pow(2, 13); // 8192
const La = 250 * Re;
const Va = 110;
const vs = 2;
const li = 1350;
const Ga = 2500;
const Wa = 4050;
const tn = 20;

// This is the "en" class (Seeded Random Number Generator)
class SeededRandom {
  constructor() {
    this.state0 = 0;
    this.state1 = 0;
    this.state2 = 0;
  }
  seed(e) {
    this.state0 = e;
    this.state1 = e * 213947 + 1238971;
    this.state2 = e * 7431 + 94823;
    this.random();
  }
  random(e = Number.MAX_SAFE_INTEGER) {
    let i = this.state0, s = this.state1;
    this.state0 = s;
    i ^= i << 23;
    i ^= i >> 17;
    i ^= s;
    i ^= s >> 26;
    this.state1 = i;
    this.state2 = (Fa * this.state2 + Ma) % Oa;
    return (this.state0 + this.state1 + this.state2) % e;
  }
}

// This is the "Y" class (Bonus)
class Bonus {
  constructor(e, i, s, r, a = 1, o = 0) {
    this.add = 0;
    this.multiply = 0;
    this.y = 0;
    this.x = 0;
    this.rarity = 0;
    this.collected = !1;
    this.yAdd = 0;
    this.random = i;
    this.speed = 0;
    this.reSpawnsToTurnRocket = 0;
    this.currentRespawn = 0;
    this.isRocket = !1;
    this.bonuses = [];
    this.game = e;
    this.reSpawnsToTurnRocket = o;
    this.add = r;
    this.multiply = a;
    this.rarity = 2e3 + r * 400 + a * 2e3;
    this.yAdd = s;
  }
  newRound() {
    this.isRocket = !1;
    this.currentRespawn = 0;
    this.respawn();
  }
  respawn() {
    this.x = this.random.random(this.rarity) + 4e3;
    this.y = -this.random.random(4e3) - 700;
    while (this.bonuses.some(e => e !== this && Math.abs(e.x - this.x) < 300 && Math.abs(e.y - this.y) < 450)) {
      this.y -= 200;
    }
  }
  update() {
    this.x += this.game.xSpeed + this.speed;
    if (this.x <= 0) {
      const e = Math.abs(this.game.playerY - this.y) <= 220;
      if (e) {
        this.collected = !0;
        if (this.isRocket || this.multiply < 1) {
          let r = Math.max(1, Math.floor(this.game.win * 0.5));
          this.game.win -= r;
          this.game.win < 0 && (this.game.win = 0);
        } else {
          this.game.win += this.add * Re;
          this.game.win *= this.multiply;
        }
        this.game.win = Math.min(La, this.game.win);
        const i = Math.max(-this.game.ySpeed + 20, Math.floor((6e3 + this.game.playerY + 0.5) / 64));
        const s = this.isRocket ? tn : this.yAdd;
        this.game.ySpeed = Math.max(-i, -Va, this.game.ySpeed + s);
        s < 0 && (this.game.ySpeed = Math.min(s, this.game.ySpeed));
      }
      this.currentRespawn++;
      this.currentRespawn === this.reSpawnsToTurnRocket && (this.isRocket = !0);
      this.respawn();
    }
  }
}

// This is the "Ua" class (Flight Model)
class FlightModel {
  constructor() {
    this.win = 1;
    this.playerY = 0;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.shipX = 0;
    this.isFinished = !0;
    this.landed = !1;
    this.distance = 0;
    this.random = new SeededRandom();
    this.bonuses = [
      new Bonus(this, this.random, -40, 1, 1, 1), new Bonus(this, this.random, -40, 1, 1, 2),
      new Bonus(this, this.random, -40, 1, 1, 3), new Bonus(this, this.random, -40, 2, 1, 4),
      new Bonus(this, this.random, -40, 2, 1, 5), new Bonus(this, this.random, -40, 5, 1, 6),
      new Bonus(this, this.random, -40, 10, 1, 7), new Bonus(this, this.random, -40, 0, 2, 8),
      new Bonus(this, this.random, -40, 0, 3, 9), new Bonus(this, this.random, -40, 0, 4, 10),
      new Bonus(this, this.random, -40, 0, 5, 11), new Bonus(this, this.random, tn, 0, 0.5)
    ];
    for (const e of this.bonuses) e.bonuses = this.bonuses;
  }
  seed(e) {
    this.distance = 0;
    this.isFinished = !1;
    this.win = Re; // 8192
    this.landed = !1;
    this.ySpeed = -78;
    this.xSpeed = -80;
    this.playerY = 0;
    this.shipX = 0;
    typeof e != "undefined" && this.random.seed(e);
    for (const i of this.bonuses) i.y = -1e6;
    for (const i of this.bonuses) i.newRound();
  }
  update() {
    this.shipX += this.xSpeed;
    this.distance -= this.xSpeed;
    this.shipX < -Ga && (this.shipX = Wa);
    if (this.landed) {
      this.shipX > -li ? (this.xSpeed && (this.xSpeed += vs), this.xSpeed === 0 && (this.isFinished = !0))
      : (this.landed = !1, this.isFinished = !0);
    } else {
      this.ySpeed < 60 && this.ySpeed++; // 60 is Ha
      this.playerY += this.ySpeed;
      if (this.playerY >= 0) {
        this.shipX > -li && this.shipX < li ? (this.landed = !0, this.ySpeed = 0, this.playerY = 0)
        : this.isFinished = !0;
        this.xSpeed && (this.xSpeed += vs);
      }
    }
    for (const e of this.bonuses) e.update();
  }
  getTotalWinMultiplier() {
    return this.landed ? this.win / Re : 0;
  }
}

// This is the "Ya" function (Win Calculator)
const calculateWinAmount = (t, e) => t >= 0.95 ? Math.ceil(t * e - bs) : Math.floor(t * e + bs);

// -----------------------------------------------------------------
// --- END GAME LOGIC ---
// -----------------------------------------------------------------


// --- Main API Handler ---
export default async function handler(req, res) {
  // --- Add CORS Headers to all responses ---
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
            code: 'KATANICA', // Matched to your frontend
            symbol: 'KATANICA', // Matched to your frontend
            subunits: 100,
            exponent: 2,
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

      // --- THIS IS THE NEW LOGIC ---
      // 1. Create a new seed
      const newSeed = Math.floor(Math.random() * 99999999);

      // 2. Run the real game model
      const model = new FlightModel();
      model.seed(newSeed);
      while (!model.isFinished) {
        model.update();
      }

      // 3. Get the results from the model
      const winMultiplier = model.getTotalWinMultiplier();
      const winAmount = calculateWinAmount(winMultiplier, betAmount);
      const newBalance = currentBalance - betAmount + winAmount;
      // --- END NEW LOGIC ---

      userData.balance = newBalance;
      await client.set(token, JSON.stringify(userData));

      // The API sends the real win and the seed that created it
      const response = {
        api_version: '2',
        outcome: {
          screen: null, special_symbols: null,
          bet: betAmount,
          win: winAmount, // This is the real win
          wins: [],
          storage: { 
            seed: newSeed // This is the seed the frontend will use
          },
        },
        balance: {
          game: 0,
          wallet: newBalance, // This is the real balance
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

// Simple JSON file persistence — replaces PostgreSQL for the prototype.
// Loads on boot, writes atomically on every change (debounced).
//
// Production would migrate this 1:1 to the schema in PRD § 8.3.4.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { BRAWLER_ORDER, BRAWLERS, STARTING_BRAWLER } from '../shared/brawlers.js';

const DB_PATH = path.resolve(process.cwd(), '../data/db.json');

let db = {
  users: {},          // username (lower) -> { id, username, passwordHash, salt, createdAt }
  profiles: {},       // userId -> profile
  sessions: {},       // token -> { userId, createdAt }
  meta: { nextUserId: 1 },
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      console.log(`[db] loaded ${Object.keys(db.users).length} users`);
    } else {
      console.log('[db] starting fresh db');
    }
  } catch (e) {
    console.error('[db] load error:', e.message);
  }
}
let _saveTimer = null;
function saveDb() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH + '.tmp', JSON.stringify(db, null, 2));
      fs.renameSync(DB_PATH + '.tmp', DB_PATH);
    } catch (e) { console.error('[db] save error:', e.message); }
  }, 250);
}
loadDb();

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function defaultProfile(userId, displayName) {
  const brawlers = {};
  // Start with one Common Brawler
  brawlers[STARTING_BRAWLER] = {
    brawlerId: STARTING_BRAWLER,
    powerLevel: 1, powerPoints: 0,
    trophies: 0, highestTrophies: 0,
    starPower1Unlocked: false, starPower2Unlocked: false,
    gadgetUnlocked: false,
    wins: 0, losses: 0,
  };
  return {
    userId, displayName,
    avatarId: 1,
    totalTrophies: 0, highestTrophies: 0,
    totalWins: 0, totalLosses: 0,
    gems: 50,
    gold: 100,
    brawlTokens: 100,
    starPoints: 0,
    brawlers,
    trophyRoadClaimed: [],
    battlePassXP: 0,
    battlePassTier: 0,
    battlePassPremium: false,
    battlePassClaimed: [],
    quests: generateDailyQuests(),
    weeklyQuests: generateWeeklyQuests(),
    lastDailyReset: todayKey(),
    lastWeeklyReset: weekKey(),
    matchHistory: [],
    createdAt: Date.now(),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────────────────

export function registerUser(username, password) {
  username = String(username || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { error: 'Username must be 3-20 characters (letters, numbers, _)' };
  }
  if (!password || password.length < 4) {
    return { error: 'Password must be at least 4 characters' };
  }
  const key = username.toLowerCase();
  if (db.users[key]) return { error: 'Username already taken' };

  const id = 'u' + (db.meta.nextUserId++);
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  db.users[key] = { id, username, passwordHash, salt, createdAt: Date.now() };
  db.profiles[id] = defaultProfile(id, username);
  saveDb();
  return { userId: id };
}

export function loginUser(username, password) {
  const key = String(username || '').toLowerCase();
  const u = db.users[key];
  if (!u) return { error: 'Invalid credentials' };
  if (hashPassword(password, u.salt) !== u.passwordHash) return { error: 'Invalid credentials' };
  // Issue session token
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { userId: u.id, createdAt: Date.now() };
  saveDb();
  return { token, userId: u.id };
}

export function logoutUser(token) {
  delete db.sessions[token];
  saveDb();
}

export function userFromToken(token) {
  const s = db.sessions[token];
  if (!s) return null;
  return s.userId;
}

// Guest login — for one-click trial without registering
export function createGuest() {
  const id = 'g' + Date.now().toString(36) + crypto.randomBytes(2).toString('hex');
  const username = 'Guest_' + id.slice(-5);
  db.profiles[id] = defaultProfile(id, username);
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { userId: id, createdAt: Date.now() };
  saveDb();
  return { token, userId: id, guest: true };
}

// ──────────────────────────────────────────────────────────────────────────
// PROFILE
// ──────────────────────────────────────────────────────────────────────────

export function getProfile(userId) {
  const p = db.profiles[userId];
  if (!p) return null;
  // Refresh daily/weekly quests if rolled over
  if (p.lastDailyReset !== todayKey()) {
    p.quests = generateDailyQuests();
    p.lastDailyReset = todayKey();
  }
  if (p.lastWeeklyReset !== weekKey()) {
    p.weeklyQuests = generateWeeklyQuests();
    p.lastWeeklyReset = weekKey();
  }
  return p;
}

export function saveProfile() { saveDb(); }

// ──────────────────────────────────────────────────────────────────────────
// MATCH RESULT APPLICATION
// ──────────────────────────────────────────────────────────────────────────

export function applyMatchResult(userId, brawlerId, result, modeId) {
  const p = getProfile(userId);
  if (!p) return null;
  const br = p.brawlers[brawlerId];
  if (!br) return null;
  br.trophies = Math.max(0, br.trophies + (result.trophyChange || 0));
  br.highestTrophies = Math.max(br.highestTrophies, br.trophies);
  if (result.placement === 1) { br.wins++; p.totalWins++; }
  else { br.losses++; p.totalLosses++; }
  p.totalTrophies = Object.values(p.brawlers).reduce((s, b) => s + b.trophies, 0);
  p.highestTrophies = Math.max(p.highestTrophies, p.totalTrophies);

  // Tokens per match (capped by daily token cap — simplified: 100 tokens per match)
  p.brawlTokens += 25;

  // Battle pass XP
  const xp = 20 + (result.placement === 1 ? 10 : 0);
  p.battlePassXP += xp;
  while (p.battlePassXP >= 100 && p.battlePassTier < 60) {
    p.battlePassXP -= 100;
    p.battlePassTier++;
  }

  // Quest progress
  updateQuestProgress(p, modeId, result);

  // Match history (keep last 20)
  p.matchHistory.unshift({
    at: Date.now(), mode: modeId, brawlerId,
    placement: result.placement,
    trophyChange: result.trophyChange,
    kills: result.kills, deaths: result.deaths, damageDealt: result.damageDealt,
  });
  if (p.matchHistory.length > 20) p.matchHistory.length = 20;

  saveDb();
  return { profile: p };
}

// ──────────────────────────────────────────────────────────────────────────
// PROGRESSION ACTIONS
// ──────────────────────────────────────────────────────────────────────────

import { POWER_LEVEL_COSTS } from '../shared/brawlers.js';

export function upgradeBrawler(userId, brawlerId) {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  const br = p.brawlers[brawlerId]; if (!br) return { error: 'not owned' };
  if (br.powerLevel >= 10) return { error: 'max level' };
  const cost = POWER_LEVEL_COSTS[br.powerLevel];
  if (!cost) return { error: 'no cost defined' };
  const [gold, pp] = cost;
  if (p.gold < gold) return { error: 'not enough gold' };
  if (br.powerPoints < pp) return { error: 'not enough power points' };
  p.gold -= gold; br.powerPoints -= pp; br.powerLevel++;
  // Auto-unlock things at certain levels
  if (br.powerLevel === 7 && !br.gadgetUnlocked) br.gadgetUnlocked = true;
  if (br.powerLevel === 9 && !br.starPower1Unlocked) br.starPower1Unlocked = true;
  if (br.powerLevel === 10 && !br.starPower2Unlocked) br.starPower2Unlocked = true;
  saveDb();
  return { profile: p };
}

export function openBox(userId, type = 'brawl') {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  const cost = type === 'mega' ? 1000 : type === 'big' ? 300 : 100;
  if (p.brawlTokens < cost) return { error: 'not enough tokens' };
  p.brawlTokens -= cost;

  const rolls = type === 'mega' ? 10 : type === 'big' ? 3 : 1;
  const items = [];
  for (let i = 0; i < rolls; i++) items.push(...rollBoxItem(p));
  saveDb();
  return { profile: p, items };
}

function rollBoxItem(p) {
  // Simplified rates from PRD § 12.2
  const r = Math.random();
  // 4% chance of a Brawler unlock (if any locked Brawlers exist)
  if (r < 0.04) {
    const locked = BRAWLER_ORDER.filter(id => !p.brawlers[id]);
    if (locked.length) {
      // Weight toward common: pick first 1-3 with higher probability
      const id = locked[Math.floor(Math.random() * Math.min(locked.length, 3))];
      p.brawlers[id] = {
        brawlerId: id, powerLevel: 1, powerPoints: 0,
        trophies: 0, highestTrophies: 0,
        starPower1Unlocked: false, starPower2Unlocked: false, gadgetUnlocked: false,
        wins: 0, losses: 0,
      };
      return [{ kind: 'brawler', id, rarity: BRAWLERS[id].rarity }];
    }
  }
  // 70% power points → pick a random owned brawler
  if (r < 0.74) {
    const owned = Object.keys(p.brawlers);
    const id = owned[Math.floor(Math.random() * owned.length)];
    const amt = 5 + Math.floor(Math.random() * 25);
    p.brawlers[id].powerPoints += amt;
    return [{ kind: 'power_points', brawlerId: id, amount: amt }];
  }
  // Else: gold
  const amt = 10 + Math.floor(Math.random() * 60);
  p.gold += amt;
  return [{ kind: 'gold', amount: amt }];
}

// ──────────────────────────────────────────────────────────────────────────
// QUESTS
// ──────────────────────────────────────────────────────────────────────────

const DAILY_QUEST_TEMPLATES = [
  { id: 'win2',   text: 'Win 2 matches',                    target: 2,    reward: { brawlTokens: 50 },  type: 'wins' },
  { id: 'play3',  text: 'Play 3 matches',                   target: 3,    reward: { brawlTokens: 30 },  type: 'matches' },
  { id: 'dmg5k',  text: 'Deal 5,000 damage',                target: 5000, reward: { brawlTokens: 40 },  type: 'damage' },
  { id: 'kill5',  text: 'Get 5 eliminations',               target: 5,    reward: { brawlTokens: 40 },  type: 'kills' },
  { id: 'gem10',  text: 'Collect 10 gems in Gem Grab',      target: 10,   reward: { brawlTokens: 50 },  type: 'gems', mode: 'gem_grab' },
];
const WEEKLY_QUEST_TEMPLATES = [
  { id: 'wwin10', text: 'Win 10 matches',                   target: 10,   reward: { brawlTokens: 200, gold: 50 }, type: 'wins' },
  { id: 'wkill25',text: 'Get 25 eliminations',              target: 25,   reward: { brawlTokens: 250 },           type: 'kills' },
  { id: 'wplay20',text: 'Play 20 matches',                  target: 20,   reward: { brawlTokens: 200, gems: 5 },  type: 'matches' },
];
function generateDailyQuests() {
  const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map(q => ({ ...q, progress: 0, claimed: false }));
}
function generateWeeklyQuests() {
  return WEEKLY_QUEST_TEMPLATES.map(q => ({ ...q, progress: 0, claimed: false }));
}
function updateQuestProgress(p, modeId, result) {
  const all = [...p.quests, ...p.weeklyQuests];
  for (const q of all) {
    if (q.claimed) continue;
    if (q.mode && q.mode !== modeId) continue;
    if (q.type === 'matches') q.progress = Math.min(q.target, q.progress + 1);
    else if (q.type === 'wins' && result.placement === 1) q.progress = Math.min(q.target, q.progress + 1);
    else if (q.type === 'kills') q.progress = Math.min(q.target, q.progress + (result.kills || 0));
    else if (q.type === 'damage') q.progress = Math.min(q.target, q.progress + (result.damageDealt || 0));
    else if (q.type === 'gems' && modeId === 'gem_grab') q.progress = Math.min(q.target, q.progress + (result.gemsCollected || 0));
  }
}
export function claimQuest(userId, questId) {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  const all = [...p.quests, ...p.weeklyQuests];
  const q = all.find(x => x.id === questId);
  if (!q) return { error: 'no quest' };
  if (q.claimed) return { error: 'already claimed' };
  if (q.progress < q.target) return { error: 'not complete' };
  q.claimed = true;
  if (q.reward.brawlTokens) p.brawlTokens += q.reward.brawlTokens;
  if (q.reward.gold) p.gold += q.reward.gold;
  if (q.reward.gems) p.gems += q.reward.gems;
  saveDb();
  return { profile: p };
}

// ──────────────────────────────────────────────────────────────────────────
// TROPHY ROAD
// ──────────────────────────────────────────────────────────────────────────

export const TROPHY_ROAD = [
  { trophies: 10,    reward: { gold: 50 } },
  { trophies: 50,    reward: { brawlTokens: 100 } },
  { trophies: 100,   reward: { brawlerToken: 'rare' } },
  { trophies: 200,   reward: { gold: 200 } },
  { trophies: 300,   reward: { gems: 10 } },
  { trophies: 500,   reward: { gold: 500, brawlTokens: 200 } },
  { trophies: 750,   reward: { gems: 20 } },
  { trophies: 1000,  reward: { brawlerToken: 'super_rare' } },
  { trophies: 1500,  reward: { gold: 1000 } },
  { trophies: 2000,  reward: { brawlerToken: 'epic' } },
  { trophies: 3000,  reward: { gems: 50 } },
];

export function claimTrophyRoad(userId, index) {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  const milestone = TROPHY_ROAD[index];
  if (!milestone) return { error: 'no milestone' };
  if (p.totalTrophies < milestone.trophies) return { error: 'not enough trophies' };
  if (p.trophyRoadClaimed.includes(index)) return { error: 'already claimed' };
  p.trophyRoadClaimed.push(index);
  const r = milestone.reward;
  if (r.gold) p.gold += r.gold;
  if (r.brawlTokens) p.brawlTokens += r.brawlTokens;
  if (r.gems) p.gems += r.gems;
  if (r.brawlerToken) {
    // Unlock a random locked Brawler of approximately that rarity
    const rarityMap = { rare: 'RARE', super_rare: 'SUPER_RARE', epic: 'EPIC', mythic: 'MYTHIC' };
    const targetRarity = rarityMap[r.brawlerToken];
    const candidates = BRAWLER_ORDER.filter(id => !p.brawlers[id] && BRAWLERS[id].rarity === targetRarity);
    if (candidates.length) {
      const id = candidates[Math.floor(Math.random() * candidates.length)];
      p.brawlers[id] = {
        brawlerId: id, powerLevel: 1, powerPoints: 0,
        trophies: 0, highestTrophies: 0,
        starPower1Unlocked: false, starPower2Unlocked: false, gadgetUnlocked: false,
        wins: 0, losses: 0,
      };
    } else {
      p.gold += 200;   // compensation if all brawlers of that rarity already owned
    }
  }
  saveDb();
  return { profile: p };
}

// ──────────────────────────────────────────────────────────────────────────
// SHOP — fake purchases (no real payment)
// ──────────────────────────────────────────────────────────────────────────

export const GEM_PACKS = [
  { id: 'pack_30',   gems: 30,   priceUSD: 1.99 },
  { id: 'pack_80',   gems: 80,   priceUSD: 4.99 },
  { id: 'pack_170',  gems: 170,  priceUSD: 9.99 },
  { id: 'pack_360',  gems: 360,  priceUSD: 19.99 },
  { id: 'pack_950',  gems: 950,  priceUSD: 49.99 },
  { id: 'pack_2000', gems: 2000, priceUSD: 99.99 },
];

export function buyGemPack(userId, packId) {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  const pack = GEM_PACKS.find(x => x.id === packId);
  if (!pack) return { error: 'no pack' };
  p.gems += pack.gems;
  saveDb();
  return { profile: p, gemsAdded: pack.gems };
}

export const SHOP_OFFERS = [
  { id: 'offer_tokens100',   name: '100 Tokens',         cost: { gems: 30 },  reward: { brawlTokens: 100 } },
  { id: 'offer_gold500',     name: '500 Gold',           cost: { gems: 50 },  reward: { gold: 500 } },
  { id: 'offer_brawlbox',    name: 'Brawl Box',          cost: { gems: 10 },  reward: { box: 'brawl' } },
  { id: 'offer_bigbox',      name: 'Big Box',            cost: { gems: 30 },  reward: { box: 'big' } },
  { id: 'offer_megabox',     name: 'Mega Box',           cost: { gems: 80 },  reward: { box: 'mega' } },
  { id: 'offer_battlepass',  name: 'Battle Pass — Premium', cost: { gems: 169 }, reward: { battlePass: true } },
];

export function buyOffer(userId, offerId) {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  const offer = SHOP_OFFERS.find(o => o.id === offerId);
  if (!offer) return { error: 'no offer' };
  if (offer.cost.gems > p.gems) return { error: 'not enough gems' };
  p.gems -= offer.cost.gems;
  let items = [];
  if (offer.reward.brawlTokens) p.brawlTokens += offer.reward.brawlTokens;
  if (offer.reward.gold) p.gold += offer.reward.gold;
  if (offer.reward.box) {
    const r = openBoxInternal(p, offer.reward.box);
    items = r.items;
  }
  if (offer.reward.battlePass) p.battlePassPremium = true;
  saveDb();
  return { profile: p, items };
}

function openBoxInternal(p, type) {
  const rolls = type === 'mega' ? 10 : type === 'big' ? 3 : 1;
  const items = [];
  for (let i = 0; i < rolls; i++) items.push(...rollBoxItem(p));
  return { items };
}

// ──────────────────────────────────────────────────────────────────────────
// BATTLE PASS
// ──────────────────────────────────────────────────────────────────────────

export const BATTLE_PASS_REWARDS = (() => {
  // Generate 60 tiers with a mix of rewards (free + premium tracks)
  const tiers = [];
  for (let t = 1; t <= 60; t++) {
    const free = (t % 3 === 0) ? { brawlTokens: 20 } : null;
    const premium = {};
    if (t % 5 === 0) premium.gems = 10;
    else if (t % 4 === 0) premium.gold = 100;
    else if (t % 3 === 0) premium.brawlTokens = 50;
    else premium.powerPoints = 5;
    tiers.push({ tier: t, free, premium });
  }
  return tiers;
})();

export function claimBattlePass(userId, tier) {
  const p = getProfile(userId); if (!p) return { error: 'no profile' };
  if (tier > p.battlePassTier) return { error: 'not yet unlocked' };
  if (p.battlePassClaimed.includes(tier)) return { error: 'already claimed' };
  p.battlePassClaimed.push(tier);
  const t = BATTLE_PASS_REWARDS[tier - 1]; if (!t) return { error: 'no tier' };
  if (t.free && t.free.brawlTokens) p.brawlTokens += t.free.brawlTokens;
  if (p.battlePassPremium) {
    const pr = t.premium;
    if (pr.gems) p.gems += pr.gems;
    if (pr.gold) p.gold += pr.gold;
    if (pr.brawlTokens) p.brawlTokens += pr.brawlTokens;
    if (pr.powerPoints) {
      // Distribute to a random owned brawler
      const owned = Object.keys(p.brawlers);
      const id = owned[Math.floor(Math.random() * owned.length)];
      p.brawlers[id].powerPoints += pr.powerPoints;
    }
  }
  saveDb();
  return { profile: p };
}

// ──────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ──────────────────────────────────────────────────────────────────────────

export function leaderboard(limit = 20) {
  return Object.values(db.profiles)
    .map(p => ({ displayName: p.displayName, totalTrophies: p.totalTrophies, totalWins: p.totalWins }))
    .sort((a, b) => b.totalTrophies - a.totalTrophies)
    .slice(0, limit);
}

// ──────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
}
function weekKey() {
  const d = new Date();
  const firstDay = new Date(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d - firstDay) / 86400000 + firstDay.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

// Matchmaking — PRD § 7.5. Simplified to a per-mode queue with bot fill.

import { MODES } from '../shared/modes/index.js';
import { MAPS_BY_MODE, pickMap } from '../shared/maps/index.js';
import { BRAWLER_ORDER } from '../shared/brawlers.js';
import { Match } from './match.js';

const queues = {};                  // modeId -> [{ userId, brawlerId, sessionId, joinedAt, displayName, powerLevel }]
const activeMatches = new Map();    // matchId -> Match
const sessionToMatch = new Map();   // sessionId -> matchId
const BOT_FILL_DELAY_MS = 8000;     // fill with bots after this wait

for (const id of Object.keys(MODES)) queues[id] = [];

export function enqueue(entry) {
  const mode = MODES[entry.mode];
  if (!mode) return { error: 'unknown mode' };
  // Remove any existing entry for this session
  for (const id of Object.keys(queues)) {
    queues[id] = queues[id].filter(e => e.sessionId !== entry.sessionId);
  }
  queues[entry.mode].push({ ...entry, joinedAt: Date.now() });
  return tryMatchmake(entry.mode);
}

export function leaveQueue(sessionId) {
  for (const id of Object.keys(queues)) {
    queues[id] = queues[id].filter(e => e.sessionId !== sessionId);
  }
}

export function tryMatchmake(modeId) {
  const mode = MODES[modeId];
  const q = queues[modeId];
  const needed = mode.teamSize * mode.teamCount;
  const oldestWait = q.length ? Date.now() - q[0].joinedAt : 0;
  // Fill with bots if we have at least 1 real player and waited too long, or if just 1 player and want to play
  if (q.length >= needed) {
    return _createMatchFromQueue(modeId, q.splice(0, needed));
  }
  if (q.length >= 1 && oldestWait > BOT_FILL_DELAY_MS) {
    return _createMatchFromQueueWithBots(modeId, q.splice(0, q.length));
  }
  // Instant-bot fallback for solo players who request it via `wantBots: true`
  const instantBotPlayer = q.find(e => e.wantBots);
  if (instantBotPlayer) {
    const idx = q.indexOf(instantBotPlayer);
    q.splice(idx, 1);
    return _createMatchFromQueueWithBots(modeId, [instantBotPlayer]);
  }
  return null;
}

// Background ticker — runs matchmaking sweeps
export function startMatchmakerTicker() {
  setInterval(() => {
    for (const modeId of Object.keys(queues)) tryMatchmake(modeId);
  }, 1000);
}

function _createMatchFromQueue(modeId, entries) {
  const mode = MODES[modeId];
  const mapId = pickMap(modeId).id;
  const participants = [];
  if (mode.teamCount === 2) {
    // Alternate team assignment
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      participants.push({
        playerId: e.sessionId, brawlerId: e.brawlerId,
        powerLevel: e.powerLevel, isBot: false,
        displayName: e.displayName,
        team: (i % 2) + 1,
      });
    }
  } else {
    // Showdown: everyone solo, team = their slot
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      participants.push({
        playerId: e.sessionId, brawlerId: e.brawlerId,
        powerLevel: e.powerLevel, isBot: false,
        displayName: e.displayName,
        team: i + 1,
      });
    }
  }
  return _startMatch(modeId, mapId, participants, entries);
}

function _createMatchFromQueueWithBots(modeId, entries) {
  const mode = MODES[modeId];
  const mapId = pickMap(modeId).id;
  const needed = mode.teamSize * mode.teamCount;
  const participants = [];
  if (mode.teamCount === 2) {
    for (let i = 0; i < entries.length; i++) {
      participants.push({
        playerId: entries[i].sessionId, brawlerId: entries[i].brawlerId,
        powerLevel: entries[i].powerLevel, isBot: false,
        displayName: entries[i].displayName,
        team: (i % 2) + 1,
      });
    }
    // Fill remaining with bots, alternating teams
    let botSeq = 1;
    while (participants.length < needed) {
      const team = (participants.length % 2) + 1;
      participants.push({
        playerId: 'bot_' + botSeq, brawlerId: randomBotBrawler(),
        powerLevel: 1, isBot: true,
        displayName: 'Bot-' + (botSeq++),
        team,
      });
    }
  } else {
    for (let i = 0; i < entries.length; i++) {
      participants.push({
        playerId: entries[i].sessionId, brawlerId: entries[i].brawlerId,
        powerLevel: entries[i].powerLevel, isBot: false,
        displayName: entries[i].displayName,
        team: i + 1,
      });
    }
    let botSeq = 1;
    while (participants.length < needed) {
      participants.push({
        playerId: 'bot_' + botSeq, brawlerId: randomBotBrawler(),
        powerLevel: 1, isBot: true,
        displayName: 'Bot-' + botSeq,
        team: participants.length + 1,
      });
      botSeq++;
    }
  }
  return _startMatch(modeId, mapId, participants, entries);
}

function _startMatch(modeId, mapId, participants, entries) {
  const match = new Match(modeId, mapId, participants);
  activeMatches.set(match.id, match);
  for (const e of entries) sessionToMatch.set(e.sessionId, match.id);
  return { matchId: match.id, mapId, participants };
}

function randomBotBrawler() {
  // Only use Common/Rare brawlers for bots (simpler abilities)
  const pool = ['shard', 'vex', 'thorn', 'blaze', 'zap'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getMatch(matchId) { return activeMatches.get(matchId); }
export function getMatchForSession(sessionId) {
  const id = sessionToMatch.get(sessionId);
  return id ? activeMatches.get(id) : null;
}
export function endMatch(matchId) {
  const m = activeMatches.get(matchId);
  if (!m) return;
  for (const p of m.players.values()) sessionToMatch.delete(p.id);
  activeMatches.delete(matchId);
}
export function listActiveMatches() {
  return [...activeMatches.values()].map(m => ({
    id: m.id, mode: m.mode.id, players: m.players.size,
    elapsedMs: Date.now() - m.startedAt, ended: m.ended,
  }));
}

export function getQueueStatus(modeId) {
  return { mode: modeId, count: queues[modeId]?.length || 0 };
}

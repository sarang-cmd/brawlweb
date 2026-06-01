// BrawlWeb server — accounts, matchmaking, game rooms, REST API + WebSocket.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { WebSocketServer } from 'ws';

import { TICK_MS } from '../shared/protocol.js';
import { MODES } from '../shared/modes/index.js';
import { BRAWLERS, BRAWLER_ORDER } from '../shared/brawlers.js';
import { ALL_MAPS, MAPS_BY_MODE } from '../shared/maps/index.js';
import {
  registerUser, loginUser, logoutUser, userFromToken, createGuest,
  getProfile, upgradeBrawler, openBox, claimQuest,
  TROPHY_ROAD, claimTrophyRoad,
  GEM_PACKS, SHOP_OFFERS, buyGemPack, buyOffer,
  BATTLE_PASS_REWARDS, claimBattlePass,
  applyMatchResult, leaderboard,
} from './db.js';
import {
  enqueue, leaveQueue, getMatch, getMatchForSession, endMatch,
  startMatchmakerTicker, getQueueStatus,
} from './matchmaker.js';

// ──────────────────────────────────────────────────────────────────────────
// STATIC FILE SERVER + REST API
// ──────────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const CLIENT_DIR = path.resolve(__dirname, '../client');
const SHARED_DIR = path.resolve(__dirname, '../shared');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...headers });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', (c) => { buf += c; if (buf.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function auth(req) {
  const h = req.headers['authorization'] || '';
  if (!h.startsWith('Bearer ')) return null;
  return userFromToken(h.slice(7));
}

const httpServer = http.createServer(async (req, res) => {
  // CORS for local dev convenience
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  const parsed = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsed.pathname;

  try {
    // ── API routes ────────────────────────────────────────────────────────
    if (pathname.startsWith('/api/')) {
      if (req.method === 'POST' && pathname === '/api/auth/register') {
        const body = await readJsonBody(req);
        const r = registerUser(body.username, body.password);
        if (r.error) return send(res, 400, r);
        const login = loginUser(body.username, body.password);
        return send(res, 200, login);
      }
      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await readJsonBody(req);
        const r = loginUser(body.username, body.password);
        return send(res, r.error ? 401 : 200, r);
      }
      if (req.method === 'POST' && pathname === '/api/auth/guest') {
        return send(res, 200, createGuest());
      }
      if (req.method === 'DELETE' && pathname === '/api/auth/logout') {
        const h = req.headers['authorization'] || '';
        if (h.startsWith('Bearer ')) logoutUser(h.slice(7));
        return send(res, 200, { ok: true });
      }
      // ── catalog (no auth) ──
      if (req.method === 'GET' && pathname === '/api/catalog') {
        return send(res, 200, {
          brawlers: BRAWLER_ORDER.map(id => BRAWLERS[id]),
          brawlerOrder: BRAWLER_ORDER,
          modes: MODES,
          maps: ALL_MAPS,
          mapsByMode: MAPS_BY_MODE,
          gemPacks: GEM_PACKS,
          shopOffers: SHOP_OFFERS,
          trophyRoad: TROPHY_ROAD,
          battlePassRewards: BATTLE_PASS_REWARDS,
        });
      }

      // ── authenticated routes ──
      const userId = auth(req);
      if (!userId) return send(res, 401, { error: 'unauthorized' });

      if (req.method === 'GET' && pathname === '/api/profile') {
        return send(res, 200, { profile: getProfile(userId) });
      }
      if (req.method === 'POST' && pathname === '/api/upgrade') {
        const body = await readJsonBody(req);
        return send(res, 200, upgradeBrawler(userId, body.brawlerId));
      }
      if (req.method === 'POST' && pathname === '/api/box/open') {
        const body = await readJsonBody(req);
        return send(res, 200, openBox(userId, body.type || 'brawl'));
      }
      if (req.method === 'POST' && pathname === '/api/quest/claim') {
        const body = await readJsonBody(req);
        return send(res, 200, claimQuest(userId, body.questId));
      }
      if (req.method === 'POST' && pathname === '/api/trophyroad/claim') {
        const body = await readJsonBody(req);
        return send(res, 200, claimTrophyRoad(userId, body.index));
      }
      if (req.method === 'POST' && pathname === '/api/shop/buy_offer') {
        const body = await readJsonBody(req);
        return send(res, 200, buyOffer(userId, body.offerId));
      }
      if (req.method === 'POST' && pathname === '/api/shop/buy_pack') {
        const body = await readJsonBody(req);
        return send(res, 200, buyGemPack(userId, body.packId));
      }
      if (req.method === 'POST' && pathname === '/api/bp/claim') {
        const body = await readJsonBody(req);
        return send(res, 200, claimBattlePass(userId, body.tier));
      }
      if (req.method === 'GET' && pathname === '/api/leaderboard') {
        return send(res, 200, { leaderboard: leaderboard(20) });
      }
      if (req.method === 'GET' && pathname === '/api/queue/status') {
        const mode = parsed.searchParams.get('mode');
        return send(res, 200, getQueueStatus(mode));
      }
      return send(res, 404, { error: 'unknown api route' });
    }

    // ── Static files ─────────────────────────────────────────────────────
    let urlPath = pathname === '/' ? '/index.html' : pathname;
    let filePath;
    if (urlPath.startsWith('/shared/')) {
      filePath = path.join(SHARED_DIR, urlPath.replace('/shared/', ''));
    } else {
      filePath = path.join(CLIENT_DIR, urlPath);
    }
    if (!filePath.startsWith(CLIENT_DIR) && !filePath.startsWith(SHARED_DIR)) {
      return send(res, 403, 'forbidden');
    }
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT') return send(res, 404, { error: 'not found' });
    console.error(e);
    return send(res, 500, { error: 'internal error' });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// WEBSOCKET — for active match
// ──────────────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server: httpServer });
const wsByMatch = new Map();   // matchId -> Set<ws>
const sessionByWs = new Map(); // ws -> sessionId

wss.on('connection', (ws, req) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      // Client says: "I'm authenticated, please put me in my match"
      const userId = userFromToken(msg.token);
      if (!userId) { ws.send(JSON.stringify({ type: 'error', error: 'unauth' })); return; }
      const profile = getProfile(userId);
      const match = getMatchForSession(userId);
      if (!match) { ws.send(JSON.stringify({ type: 'error', error: 'no match' })); return; }
      sessionByWs.set(ws, userId);
      if (!wsByMatch.has(match.id)) wsByMatch.set(match.id, new Set());
      wsByMatch.get(match.id).add(ws);

      // Send welcome with map + brawler info
      ws.send(JSON.stringify({
        type: 'welcome',
        yourId: userId,
        match: {
          id: match.id, mode: match.mode.id,
          mapId: match.map.id, map: match.map,
          participants: [...match.players.values()].map(p => ({
            id: p.id, brawlerId: p.brawlerId, team: p.team,
            displayName: p.displayName, isBot: p.isBot,
          })),
        },
        brawlers: BRAWLERS,
        myProfile: profile,
      }));
      return;
    }

    if (msg.type === 'input') {
      const sessionId = sessionByWs.get(ws);
      if (!sessionId) return;
      const match = getMatchForSession(sessionId);
      if (!match) return;
      match.applyInput(sessionId, msg);
      return;
    }

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: msg.t }));
      return;
    }

    if (msg.type === 'leave_match') {
      // Treat as conceding the match for this player
      const sessionId = sessionByWs.get(ws);
      if (!sessionId) return;
      const match = getMatchForSession(sessionId);
      if (match) {
        const p = match.players.get(sessionId);
        if (p) { p.alive = false; p.respawnAt = Date.now() + 999999; }
      }
      return;
    }
  });

  ws.on('close', () => {
    sessionByWs.delete(ws);
    for (const set of wsByMatch.values()) set.delete(ws);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// MATCH TICKER — drives all active matches at 20Hz
// ──────────────────────────────────────────────────────────────────────────

import { listActiveMatches } from './matchmaker.js';

setInterval(() => {
  const now = Date.now();
  for (const info of listActiveMatches()) {
    const match = getMatch(info.id);
    if (!match) continue;
    match.step(now);
    // Broadcast
    const set = wsByMatch.get(match.id);
    if (set) {
      for (const ws of set) {
        if (ws.readyState !== 1) continue;
        const sessionId = sessionByWs.get(ws);
        const state = match.serializeState(sessionId);
        ws.send(JSON.stringify(state));
      }
    }
    if (match.ended) {
      // Apply match results to all real players
      if (match.result) {
        for (const part of match.result.participants) {
          if (part.isBot) continue;
          applyMatchResult(part.playerId, part.brawlerId, part, match.mode.id);
        }
      }
      // Leave match active for ~5s so result screen shows, then clean up
      setTimeout(() => endMatch(match.id), 6000);
    }
  }
}, TICK_MS);

startMatchmakerTicker();

// ──────────────────────────────────────────────────────────────────────────
// MATCHMAKING ENDPOINT (HTTP) — separate from queue/status above
// ──────────────────────────────────────────────────────────────────────────

const _origHandler = httpServer.listeners('request')[0];
httpServer.removeAllListeners('request');
httpServer.on('request', async (req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'POST' && parsed.pathname === '/api/queue/join') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const userId = auth(req);
    if (!userId) return send(res, 401, { error: 'unauthorized' });
    const body = await readJsonBody(req);
    const profile = getProfile(userId);
    if (!profile.brawlers[body.brawlerId]) return send(res, 400, { error: 'brawler not owned' });
    const result = enqueue({
      sessionId: userId,
      mode: body.mode,
      brawlerId: body.brawlerId,
      powerLevel: profile.brawlers[body.brawlerId].powerLevel,
      displayName: profile.displayName,
      wantBots: !!body.wantBots,
    });
    return send(res, 200, { queued: true, match: result });
  }
  if (req.method === 'DELETE' && parsed.pathname === '/api/queue/leave') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const userId = auth(req);
    if (!userId) return send(res, 401, { error: 'unauthorized' });
    leaveQueue(userId);
    return send(res, 200, { ok: true });
  }
  if (req.method === 'GET' && parsed.pathname === '/api/match/poll') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const userId = auth(req);
    if (!userId) return send(res, 401, { error: 'unauthorized' });
    const match = getMatchForSession(userId);
    return send(res, 200, { matchId: match ? match.id : null });
  }
  // Fall through to original handler
  _origHandler(req, res);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════╗`);
  console.log(`║  BrawlWeb server running on :${PORT}        ║`);
  console.log(`║  Open http://localhost:${PORT} to play     ║`);
  console.log(`╚══════════════════════════════════════════╝`);
});

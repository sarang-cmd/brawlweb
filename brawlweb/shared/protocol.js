// Shared WebSocket message protocol (PRD § 10.1)
// Kept as plain JSON for the Phase 0 prototype.
// MessagePack would be a drop-in upgrade for production.

export const MSG = {
  // Client -> Server
  HELLO: 'hello',
  INPUT: 'input',
  PING: 'ping',

  // Server -> Client
  WELCOME: 'welcome',       // sent once: yourId, map, brawler config, tickRate
  STATE: 'state',           // delta state every tick
  PLAYER_JOINED: 'joined',
  PLAYER_LEFT: 'left',
  PONG: 'pong',
};

export const TICK_RATE = 20;            // PRD § 8.3.1
export const TICK_MS = 1000 / TICK_RATE;

# BrawlWeb — Full Prototype

A browser-based, top-down, real-time multiplayer arena brawler inspired by Supercell's
Brawl Stars. Built from the ground up to demonstrate end-to-end implementation of
the major systems specified in the [BrawlWeb PRD](../uploads/bs_prd.md).

## What's implemented

### 🎮 Core gameplay
- **Authoritative game server** running at **20Hz tick rate** (PRD § 8.3.1)
- **Client-side prediction + server reconciliation** for local player (PRD § 8.3.2)
- **Remote player interpolation** between snapshots
- **Tile-based collision**: walls block, bushes slow + conceal, breakable walls take damage
- **Line-of-sight** for bots, vision-blocking with bushes
- **Server-side hit detection, damage application, and validation** (no client trust)

### 🧙 All 12 launch Brawlers (PRD § 6.4)
Each with stats, main attack, super, gadget, and two star powers (data-defined):

| # | Brawler | Rarity | Role |
|---|---------|--------|------|
| 1 | Shard   | Common     | Rock Golem tank — shotgun + Boulder Roll |
| 2 | Vex     | Common     | Energy gunslinger — twin bullets + Turbo |
| 3 | Thorn   | Rare       | Sniper-lite — piercing arrows + Briar Patch |
| 4 | Blaze   | Rare       | AoE elemental — flame burst + Inferno ring |
| 5 | Zap     | Rare       | Chain lightning + Tesla turret |
| 6 | Ghost   | Super Rare | Phase-dash assassin + invisibility |
| 7 | Cannon  | Super Rare | Long-range artillery + Broadside barrage |
| 8 | Pix     | Epic       | Healer with auto-targeting beam |
| 9 | Drift   | Epic       | Hover-skater speedster |
| 10 | Siege  | Mythic     | Mech engineer with deployable turrets |
| 11 | Nova   | Mythic     | Gravity orb + Singularity pull |
| 12 | Omen   | Legendary  | Homing shadow bolts + Eclipse zone |

All 12 attack/super/gadget combinations have working server implementations in
`server/abilities.js` (dash-charge, AoE field, deploy structure, heal beam,
invisibility, gravity pull, chain lightning, homing, etc.)

### 🎯 All 4 launch game modes (PRD § 5.2)
- **Gem Grab** (3v3) — collect 10 gems, hold 15s countdown to win
- **Bounty** (3v3) — eliminate enemies, accumulate stars
- **Heist** (3v3) — destroy enemy safe (40k HP)
- **Showdown** (1v9 solo) — last alive wins, with shrinking poison cloud + power cubes

Each mode has 2 maps (showdown has 1 big map).

### 👤 Account system & persistence
- **Username + scrypt-hashed password** authentication (PRD § 15.1)
- **Guest login** for one-click trial play
- **Bearer-token sessions** in HTTP API; tokens persisted to disk
- **JSON file persistence** at `data/db.json` (swap for PostgreSQL per PRD § 8.3.4)

### 📈 Full progression loop (PRD § 6.6, § 7.6, § 12)
- **Power Levels** 1–10 per Brawler, costing gold + power points
- **Star Powers** auto-unlock at levels 9 and 10; **Gadget** at level 7
- **Trophy Road** with 11 milestones (boxes, Brawlers, gold, gems)
- **Brawl Boxes / Big Boxes / Mega Boxes** with roll tables
- **Daily quests** (3) + **Weekly quests** (3) tracking matches/wins/damage/kills
- **Battle Pass** with 60 tiers, free + premium tracks
- **Match history** (last 20 matches)
- **Leaderboard** sorted by total trophies

### 🏪 Shop
- **Daily offers** (token bundles, gold, boxes, battle pass)
- **Gem packs** (6 SKUs, $1.99–$99.99) — fake purchases, no real Stripe integration
- All purchases ethical: cosmetics + earnable resources only (PRD § 12.5)

### 🎨 UI
- **Lobby with home, collection, trophy road, battle pass, shop, leaderboard** screens
- **Login / register / guest** flow with persistent sessions
- **Brawler selection screen** with full stats and ability descriptions
- **In-game HUD** with mode-specific score (gems, stars, safe HP, alive count), ammo pips, super button (pulses when ready), gadget button, ping
- **Post-match results screen** with K/D, damage dealt, trophy changes
- **Toast notifications** for all actions

### 🤖 Bots
- Bots fill empty slots after 8s of queueing (or instantly with "Quick Play")
- Simple AI: seek nearest enemy, strafe in range, shoot when LoS

## Running it

```bash
cd brawlweb/server
npm install
npm start
# → http://localhost:3000
```

Then:
1. Open http://localhost:3000
2. Click **"▶ Play as Guest"** (or register an account)
3. From the main lobby, pick a **game mode**
4. Pick your **Brawler** (you start with Shard)
5. Click **"🤖 Quick Play"** to start a match against bots immediately

Open the URL in **multiple browser tabs** (or different browsers) to play multiplayer
against real opponents.

## Architecture map → PRD

| File | PRD section |
|---|---|
| `server/server.js` | § 8 — HTTP + WebSocket + match driver |
| `server/match.js` | § 8.3 — Authoritative match simulation |
| `server/abilities.js` | § 6 — All Brawler ability handlers |
| `server/matchmaker.js` | § 7.5 — Per-mode queue + bot fill |
| `server/db.js` | § 8.3.4 — Persistence (replaces PostgreSQL) |
| `shared/brawlers.js` | § 6.4 — Brawler data & power level scaling |
| `shared/modes/index.js` | § 5.2 — Mode rules & win conditions |
| `shared/maps/index.js` | § 7.3 — Map JSON definitions (PRD Appendix B principles) |
| `shared/map.js` | § 7.1, § 7.4 — Tile collision, bushes, LoS |
| `shared/protocol.js` | § 10.1 — WebSocket message protocol |
| `client/app.js` | § 11 — Screen router |
| `client/screens/match.js` | § 8.2, § 11.3 — Phaser scene + HUD + prediction |
| `client/styles.css` | § 11 — UI/UX visual system |

## What's intentionally stubbed (vs. full PRD)

These would be additional weeks of work in a real production push:

- ❌ Real **Stripe / payment** integration (shop credits gems for free)
- ❌ **OAuth2** (Google / Discord) — simple username/password only
- ❌ **MFA / TOTP** (PRD § 15.1)
- ❌ **PostgreSQL / Redis / ClickHouse** — single JSON file
- ❌ **MessagePack** serialization — plain JSON
- ❌ **Anti-cheat ML, replay system, spectator mode** (P2 features)
- ❌ **Real animated sprite art / voice lines** — colored geometric shapes
- ❌ **Localization** (en-US only; strings inline)
- ❌ **PWA / service worker / offline caching**
- ❌ **Mobile touch controls** (desktop keyboard + mouse only)
- ❌ **Clans, friends list, in-game chat** (P1/P2)
- ❌ **Horizontal server scaling / load balancing** (single Node.js process)
- ❌ **Accessibility features** (colorblind mode, screen reader, etc.)
- ❌ **Map editor tool** (PRD § 7.3.2)
- ❌ **Ranked mode** (PRD § 7.6.3 — post-launch)

The architecture (shared simulation code on client + server, mode/brawler data
separated from logic, single-source-of-truth `db.js`) makes adding any of these
incremental work rather than rewrites.

## Resetting the database

```bash
rm data/db.json
```

The server creates a fresh DB on next boot.

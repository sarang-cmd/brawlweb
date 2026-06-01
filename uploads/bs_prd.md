# Product Requirements Document (PRD)
## BrawlStars Browser Clone — "BrawlWeb"

**Version:** 1.0.0
**Document Status:** Draft
**Last Updated:** 2025
**Product Owner:** [To Be Assigned]
**Engineering Lead:** [To Be Assigned]
**Document Classification:** Internal — Core Team Only

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Goals](#product-vision--goals)
3. [Market Analysis](#market-analysis)
4. [Target Audience](#target-audience)
5. [Core Features & Game Modes](#core-features--game-modes)
6. [Character System (Brawlers)](#character-system-brawlers)
7. [Game Mechanics & Systems](#game-mechanics--systems)
8. [Technical Architecture](#technical-architecture)
9. [Rendering & Graphics Pipeline](#rendering--graphics-pipeline)
10. [Networking & Multiplayer](#networking--multiplayer)
11. [UI/UX Design Requirements](#uiux-design-requirements)
12. [Progression & Monetization System](#progression--monetization-system)
13. [Audio Design](#audio-design)
14. [Performance Requirements](#performance-requirements)
15. [Security Requirements](#security-requirements)
16. [Analytics & Telemetry](#analytics--telemetry)
17. [Accessibility Requirements](#accessibility-requirements)
18. [Localization](#localization)
19. [Testing Strategy](#testing-strategy)
20. [Milestones & Roadmap](#milestones--roadmap)
21. [Risk Assessment](#risk-assessment)
22. [Appendices](#appendices)

---

## 1. Executive Summary

**BrawlWeb** is a browser-based, real-time multiplayer top-down arena brawler inspired by Supercell's *Brawl Stars*. It runs entirely in the browser using WebGL 2.0 via a modern game engine (Phaser 3 or PixiJS with a custom game loop), WebSockets for real-time communication, and a Node.js/Go backend with authoritative server-side game logic.

The game features fast-paced 3v3 team battles, free-for-all modes, and various objective-based modes — all playable without downloading or installing any software. Players collect and upgrade unique characters called **Brawlers**, each with distinct attack patterns, super abilities, and passive traits. A rich progression system, seasonal content, cosmetics, and competitive ranked play drive long-term retention.

**Key Differentiators:**
- Zero-install: fully browser-native
- Cross-device playability (desktop, tablet, mobile browser)
- Accessible to a global audience through progressive web app (PWA) distribution
- Lightweight enough to run on mid-range hardware at 60 FPS
- Social-first design with clans, friends, and spectator mode

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

> *"Make the joy of quick, skill-based arena combat available to anyone with a browser — no barriers, no downloads, just play."*

### 2.2 Strategic Goals

| Goal | Description | Success Metric |
|------|-------------|----------------|
| Accessibility | Run on 90%+ of modern browsers with no plugins | Browser compatibility score ≥ 92% |
| Retention | Keep players engaged with deep progression | D1 ≥ 40%, D7 ≥ 20%, D30 ≥ 10% |
| Monetization | Sustainable revenue through ethical F2P | ARPU ≥ $2.50/month |
| Performance | Smooth experience across devices | 60 FPS on mid-range devices; 30+ FPS on low-end |
| Community | Build a competitive and social ecosystem | Clan feature adoption ≥ 50% of active players |

### 2.3 Product Goals — Launch (v1.0)

- Ship with **12 unique Brawlers**, each with a distinct playstyle
- Ship with **4 game modes** and **8 maps** per mode
- Ship with a functional progression, account, and basic monetization system
- Achieve stable server capacity for **10,000 concurrent users**
- Deliver a PWA for offline asset caching and mobile home-screen installation

### 2.4 Product Goals — Post-Launch (v1.x)

- Expand to **30 Brawlers** within 6 months
- Add **Ranked Mode** and seasonal esports hooks
- Add **Replay System** and **Spectator Mode**
- Add **Clan Wars** feature
- Expand server capacity to **100,000+ concurrent users**

---

## 3. Market Analysis

### 3.1 Competitive Landscape

| Product | Platform | Notes |
|---------|----------|-------|
| Brawl Stars | iOS/Android | Direct inspiration; native mobile only |
| Brawhalla | PC/Console/Mobile | Platform fighter, different genre |
| Miniclip 8 Ball Pool | Browser/Mobile | Proof of browser F2P viability |
| Krunker.io | Browser | High-performing browser FPS; validation of browser competitive gaming |
| Zombs Royale | Browser | Top-down battle royale browser game; closest genre match |
| Vertix.io | Browser | Top-down multiplayer shooter |

### 3.2 Market Opportunity

The browser gaming market generates **$6.8 billion annually** (2024, Newzoo). The top-down shooter/arena genre is underserved in the browser space — most modern entries are either battle royales or first-person. A polished, Brawl-Stars-quality top-down brawler in the browser represents a clear gap in the market.

Mobile gaming audiences (particularly those who play Brawl Stars) increasingly use low-end Android devices or Chromebooks where native apps may stutter — the browser can be a superior distribution channel for these demographics.

### 3.3 Risks from Competitors

- Supercell could launch a web version of Brawl Stars
- Other indie studios could move into this space rapidly
- Mitigation: move fast on launch, build community loyalty early, differentiate on features (replays, spectator, PC-friendly controls)

---

## 4. Target Audience

### 4.1 Primary Audience

**Age:** 13–28
**Geography:** Global; initial focus on North America, Europe, Brazil, Southeast Asia
**Platform access:** Desktop browsers (Chrome, Firefox, Edge) and mobile browsers (Safari iOS, Chrome Android)
**Psychographic profile:**
- Enjoys fast-paced, session-based multiplayer games (2–10 minute matches)
- Familiar with the battle pass/season progression model
- Plays during commutes, lunch breaks, or casual evening sessions
- Competitive but casual — wants ranked systems but not a hardcore grind
- Values character/skin cosmetics and self-expression

### 4.2 Secondary Audience

**Streamers & Content Creators** (Age 18–35):
- High-visibility community builders
- Need replay, spectator, and highlight clip systems
- Drive organic acquisition via Twitch, YouTube, TikTok

**Esports-Adjacent Players** (Age 16–30):
- Want ranked ladders, tournaments, and stat tracking
- Will engage with seasonal resets and competitive rewards

### 4.3 Persona Examples

**Persona 1 — "Casual Casey"**
- Age 16, high school student
- Plays on a school Chromebook during free periods
- Can't install apps; uses browser for everything
- Plays 2–3 matches per day
- Will buy a battle pass if it feels worth it

**Persona 2 — "Competitive Carlos"**
- Age 22, college student
- High-end desktop setup, streams on Twitch occasionally
- Plays 2–3 hours per day
- Wants ranked mode, stats tracking, and spectator mode
- May spend on exclusive cosmetics tied to rank

**Persona 3 — "Parent Pat"**
- Age 35, parent of a 10-year-old
- Looking for safe, fun multiplayer games for their child
- Values parental controls, age-appropriate content, and no predatory monetization
- Would subscribe to a family plan

---

## 5. Core Features & Game Modes

### 5.1 Feature Priority Matrix

| Feature | Priority | Phase |
|---------|----------|-------|
| 3v3 Team Battle (Gem Grab) | P0 | Launch |
| Free-for-All (Solo Showdown) | P0 | Launch |
| Bounty Mode | P0 | Launch |
| Heist Mode | P0 | Launch |
| Brawler collection (12 Brawlers) | P0 | Launch |
| Account system (login, profile) | P0 | Launch |
| Matchmaking | P0 | Launch |
| Trophy Road progression | P0 | Launch |
| Basic shop & premium currency | P0 | Launch |
| Battle Pass (Season 1) | P1 | Launch |
| Clan System | P1 | Post-launch |
| Ranked Mode | P1 | Post-launch |
| Spectator Mode | P2 | Post-launch |
| Replay System | P2 | Post-launch |
| Custom Rooms | P2 | Post-launch |
| Map Maker | P3 | Future |
| Clan Wars | P3 | Future |

### 5.2 Game Mode Specifications

---

#### 5.2.1 Gem Grab (3v3 — Objective Mode)

**Overview:** Two teams of three compete to collect 10 gems and hold them for a countdown to win.

**Rules:**
- A gem mine spawns in the center of the map every few seconds
- Gems drop when a Brawler is eliminated
- First team to collect and hold 10+ gems triggers a 15-second countdown timer
- If a gem carrier is eliminated, their gems drop at that location
- Match time limit: 2 minutes 30 seconds
- If time expires, the team with the most gems wins

**Map Size:** 29×25 tiles
**Team Size:** 3v3
**Respawn:** Yes, 3-second respawn timer
**Victory Condition:** Hold 10+ gems for 15 continuous seconds OR have more gems when time expires

**Special Rules:**
- Gem count is visible to all players at all times via HUD
- Gem carrier has a visible gem count indicator above their character

---

#### 5.2.2 Showdown (Solo & Duo — Battle Royale-Lite)

**Overview:** 10 solo players (or 5 teams of 2) fight to be the last one standing. A poisonous cloud closes in over time.

**Rules — Solo:**
- 10 players start in a large map
- Power cubes spawn in crates scattered across the map
- Collecting power cubes increases max health and attack damage
- The poison cloud begins shrinking after 60 seconds
- Players caught in the cloud take continuous damage
- Last player alive wins

**Rules — Duo:**
- 5 teams of 2
- Same mechanics, but eliminated partner can be revived if their duo collects a power cube near their ghost

**Map Size:** 49×49 tiles
**Team Size:** 1 (Solo) or 2 (Duo)
**Respawn:** No
**Victory Condition:** Last Brawler or team alive

**Scoring:** Trophy gain/loss is based on placement (1st = +8, 2nd–3rd = +4, 4th–6th = 0, 7th–10th = -4)

---

#### 5.2.3 Bounty (3v3 — Score Mode)

**Overview:** Two teams earn stars by eliminating opponents. The team with the most stars at the end wins.

**Rules:**
- Each player starts with 2 stars above their head
- Eliminating an enemy earns their current star count
- Each star earned increases your star value by 1 (max 7)
- Being eliminated resets your star value to 2
- Match duration: 2 minutes
- Team with the most stars at the end wins; tiebreaker goes to the team with the most stars at time of tie

**Map Size:** 35×25 tiles
**Team Size:** 3v3
**Respawn:** Yes, immediate respawn
**Victory Condition:** Most stars when the timer expires

---

#### 5.2.4 Heist (3v3 — Attack/Defend)

**Overview:** Each team has a safe (vault). Attack the enemy safe while defending your own. The team that destroys the enemy safe or deals more damage to it wins.

**Rules:**
- Both teams have a destructible safe (HP: 40,000)
- Players can damage the safe with any attack
- The safe has no active defense mechanic (it relies on player defense)
- Match time: 2 minutes 30 seconds
- If a safe is destroyed, the game ends immediately
- If time expires, the team that dealt more % damage to the enemy safe wins

**Map Size:** 35×25 tiles
**Team Size:** 3v3
**Respawn:** Yes, 3-second respawn timer
**Victory Condition:** Destroy enemy safe OR deal more % damage when timer expires

---

### 5.3 Planned Future Game Modes (Post-Launch)

| Mode | Description | Target Phase |
|------|-------------|-------------|
| Brawl Ball | Soccer-inspired; score goals with a ball | v1.2 |
| Siege | Collect bolts to build a siege robot that attacks the enemy base | v1.3 |
| Hot Zone | Capture and hold circular zones across the map | v1.2 |
| Knockout | 3v3 elimination; no respawns per round | v1.4 |
| Boss Fight | PvE — 3 players vs. one boss-controlled Brawler with enhanced stats | v1.5 |

---

## 6. Character System (Brawlers)

### 6.1 Brawler Design Principles

Every Brawler must adhere to the following design principles:

1. **Unique Identity:** Each Brawler must have a visually and mechanically distinct personality
2. **Readable Silhouette:** Identifiable at a glance from a top-down camera angle
3. **Attack Clarity:** Attack patterns must be visually readable to opponents
4. **Skill Expression:** Each Brawler should have a skill floor (easy to understand) and a skill ceiling (hard to master)
5. **Counter Play:** Every Brawler must be counterable by at least 2 other Brawlers
6. **Balanced Power Budget:** All Brawlers have equal total power budget — distributed differently across health, damage, range, speed, and utility

### 6.2 Brawler Stats Framework

Every Brawler is defined by the following base stats:

| Stat | Description | Range |
|------|-------------|-------|
| Health | Total hit points | 2,800 – 8,000 |
| Attack Damage | Per-projectile damage | 500 – 3,500 |
| Attack Speed | Shots per second or total ammo clip | 1 – 3 ammo charges |
| Attack Range | Max projectile travel distance (in tiles) | 3 – 11 tiles |
| Movement Speed | Tiles per second | Slow (2.0) / Normal (2.4) / Fast (2.8) / Very Fast (3.2) |
| Super Charge Rate | How quickly the super fills from dealing/receiving damage | Varies |
| Reload Speed | Time between ammo recharges | 1.0s – 2.5s |

### 6.3 Rarity Tiers

| Tier | Color | Unlock Method | Unlock Rate |
|------|-------|---------------|-------------|
| Starting | Gray | All new accounts start with 1 | — |
| Common | Blue | Brawl Boxes, Trophy Road | High |
| Rare | Green | Brawl Boxes, Trophy Road | Medium |
| Super Rare | Orange | Brawl Boxes | Low |
| Epic | Purple | Brawl Boxes, Shop | Very Low |
| Mythic | Red | Brawl Boxes | Rare |
| Legendary | Gold | Brawl Boxes | Very Rare (~0.1%) |

### 6.4 Launch Brawler Roster (12 Brawlers)

---

#### Brawler #1 — Shard (Common)
**Theme:** Rock Golem / Tank
**Playstyle:** Front-line tank with high health and close-range spread attack
**Visual:** Chunky stone humanoid with glowing green cracks

| Stat | Value |
|------|-------|
| Health | 7,200 |
| Movement Speed | Slow (2.0) |
| Attack Range | 4 tiles |
| Attack Type | Shotgun spread (5 pellets) |
| Damage per Pellet | 480 |
| Ammo | 3 charges |
| Reload Speed | 1.5s |

**Main Attack — "Rockblast":** Fires a spread of 5 rock fragments in a cone. High damage up close, minimal damage at range.

**Super — "Boulder Roll":** Shard curls into a boulder and rolls forward in a straight line for 5 tiles, dealing 1,200 damage to all enemies hit and knocking them back. Shard is invulnerable during the roll.

**Star Power 1 — "Iron Core":** Shard gains a damage shield that absorbs the first 1,500 damage per respawn.

**Star Power 2 — "Aftershock":** Boulder Roll leaves a 1-tile-radius rubble field for 3 seconds that slows enemies by 40%.

**Gadget — "Rock Wall":** Shard places a small rock wall (2 tiles long) at his feet that blocks projectiles and movement for 5 seconds. 3 uses per match.

---

#### Brawler #2 — Vex (Common)
**Theme:** Energy Gunslinger
**Playstyle:** Balanced mid-range fighter; good all-arounder for beginners
**Visual:** Slim humanoid in a neon jumpsuit with twin energy pistols

| Stat | Value |
|------|-------|
| Health | 3,800 |
| Movement Speed | Normal (2.4) |
| Attack Range | 7 tiles |
| Attack Type | Twin bullets (2 simultaneous) |
| Damage per Bullet | 720 |
| Ammo | 3 charges |
| Reload Speed | 1.5s |

**Main Attack — "Double Tap":** Fires two energy bullets simultaneously in a parallel formation. Each bullet deals 720 damage. Both can hit the same target for 1,440 total.

**Super — "Turbo Mode":** Vex activates turbo mode for 4 seconds: movement speed increases by 40%, reload speed doubles, and bullets deal 20% more damage.

**Star Power 1 — "Overload":** After using the Super, Vex's next attack fires 4 bullets instead of 2.

**Star Power 2 — "Phase Round":** One bullet per attack becomes a phase round that passes through walls (but not through enemies — it stops on first enemy hit).

**Gadget — "Pulse Shield":** Vex deploys a personal shield for 2 seconds that absorbs up to 2,000 damage. 2 uses per match.

---

#### Brawler #3 — Thorn (Rare)
**Theme:** Nature Archer
**Playstyle:** Long-range sniper-lite with area denial
**Visual:** Feminine figure made of vines and flowers with a bark longbow

| Stat | Value |
|------|-------|
| Health | 2,900 |
| Movement Speed | Normal (2.4) |
| Attack Range | 10 tiles |
| Attack Type | Single piercing arrow |
| Damage | 1,800 |
| Ammo | 1 charge |
| Reload Speed | 2.0s |

**Main Attack — "Vine Arrow":** Fires a single arrow that travels the full range. Pierces through all enemies in its path. Deals 1,800 damage to each.

**Super — "Briar Patch":** Thorn fires a seed pod that explodes into a 3×3 tile briar patch at the target location. Enemies in the briar are slowed by 50% and take 300 damage per second for 5 seconds.

**Star Power 1 — "Bloom":** Briar Patch also heals Thorn's allies for 200 HP/second while they stand in it.

**Star Power 2 — "Thornwall":** Vine Arrow leaves a temporary thorn wall at the max range point (1×2 tiles) for 3 seconds.

**Gadget — "Root Shot":** The next Vine Arrow roots the first enemy hit in place for 1.5 seconds (they cannot move). 2 uses per match.

---

#### Brawler #4 — Blaze (Rare)
**Theme:** Fire Elemental
**Playstyle:** Area-of-effect burst damage; strong vs. clusters of enemies
**Visual:** Humanoid made of living fire with ember particles constantly flying off

| Stat | Value |
|------|-------|
| Health | 3,400 |
| Movement Speed | Normal (2.4) |
| Attack Range | 5 tiles |
| Attack Type | Flame burst (AoE circle) |
| Damage | 900 per hit (hits up to 3 times in burst) |
| Ammo | 2 charges |
| Reload Speed | 2.0s |

**Main Attack — "Flame Burst":** Launches a ball of fire that explodes at target location (or at max range) in a 2-tile radius, dealing 900 damage to all in range. The explosion pulses 3 times over 0.5 seconds.

**Super — "Inferno":** Blaze erupts, creating a ring of fire around itself (3-tile radius) for 3 seconds. Enemies in the ring take 800 damage per second.

**Star Power 1 — "Ignite":** Enemies hit by Flame Burst are set on fire, taking 300 damage per second for 3 seconds.

**Star Power 2 — "Heat Shield":** While Inferno is active, Blaze gains 30% damage reduction.

**Gadget — "Fire Trail":** Blaze dashes 3 tiles in the aimed direction, leaving a fire trail that deals 400 damage/second to enemies who cross it for 2 seconds. 2 uses per match.

---

#### Brawler #5 — Zap (Rare)
**Theme:** Mad Scientist / Electricity
**Playstyle:** Mid-range damage dealer with chain lightning
**Visual:** Goggle-wearing scientist in a lab coat cracking with electricity

| Stat | Value |
|------|-------|
| Health | 3,200 |
| Movement Speed | Normal (2.4) |
| Attack Range | 6 tiles |
| Attack Type | Lightning bolt (chains) |
| Damage | 1,200 primary; 800 chain |
| Ammo | 3 charges |
| Reload Speed | 1.5s |

**Main Attack — "Arc Bolt":** Fires a lightning bolt that deals 1,200 damage to the first enemy hit, then chains to the nearest enemy within 3 tiles for 800 damage.

**Super — "Tesla Coil":** Zap places an immobile Tesla Coil turret at the targeted location. The coil fires Arc Bolts at the nearest enemy every 1.5 seconds for 6 seconds.

**Star Power 1 — "Conductor":** Arc Bolt now chains up to 3 enemies (primary target + 2 chain hits).

**Star Power 2 — "Overcharge":** Tesla Coil periodically fires an Overcharge burst dealing 2,000 damage to the nearest target (once per 3 seconds).

**Gadget — "Static Field":** Zap emits a static pulse — all enemies within 4 tiles are stunned for 0.8 seconds. 2 uses per match.

---

#### Brawler #6 — Ghost (Super Rare)
**Theme:** Phantom / Stealth Assassin
**Playstyle:** Hit-and-run assassin; highest burst damage but very fragile
**Visual:** A translucent wispy ghost figure with glowing eyes

| Stat | Value |
|------|-------|
| Health | 2,800 |
| Movement Speed | Fast (2.8) |
| Attack Range | 5 tiles |
| Attack Type | Spectral slash (melee-to-short-range) |
| Damage | 2,800 |
| Ammo | 1 charge |
| Reload Speed | 2.5s |

**Main Attack — "Spectral Slash":** Ghost phases forward 2 tiles while dealing 2,800 damage in a 1-tile-wide arc at the destination. Very high damage but requires positioning.

**Super — "Vanish":** Ghost turns invisible for 4 seconds. During invisibility, movement speed is boosted by 30%. Attacking or using a gadget breaks invisibility.

**Star Power 1 — "Ambush":** First attack after exiting invisibility deals 50% bonus damage.

**Star Power 2 — "Ethereal":** While invisible, Ghost passes through walls.

**Gadget — "Haunt":** Ghost places a spectral decoy of itself that mimics its movement for 3 seconds (enemies cannot tell which is real). 1 use per match.

---

#### Brawler #7 — Cannon (Super Rare)
**Theme:** Heavy Artillery / Pirate
**Playstyle:** Long-range siege; devastates structures and grouped enemies
**Visual:** Massive humanoid with a cannon replacing one arm; pirate-themed

| Stat | Value |
|------|-------|
| Health | 5,600 |
| Movement Speed | Slow (2.0) |
| Attack Range | 9 tiles |
| Attack Type | Cannonball (AoE on impact) |
| Damage | 1,600 (+ 800 in 1-tile splash) |
| Ammo | 2 charges |
| Reload Speed | 2.0s |

**Main Attack — "Cannonball":** Fires a large cannonball in a straight line. On impact (enemy, wall, or max range), explodes in a 1-tile radius dealing splash damage.

**Super — "Broadside":** Cannon fires 5 cannonballs simultaneously in a wide spread (45-degree cone), each with full explosion properties.

**Star Power 1 — "Armor Piercing":** Cannonball deals 50% extra damage to walls, structures, and the Heist safe.

**Star Power 2 — "Hot Shot":** Enemies hit by the direct cannonball are burned for 400 damage/second for 2 seconds.

**Gadget — "Ground Pound":** Cannon slams the ground, dealing 2,000 damage to all enemies within 2 tiles. 2 uses per match.

---

#### Brawler #8 — Pix (Epic)
**Theme:** Support Healer / Fairy
**Playstyle:** Primary healer/support; essential in team compositions
**Visual:** Tiny, glowing fairy with pixelated wings and a wand

| Stat | Value |
|------|-------|
| Health | 2,900 |
| Movement Speed | Fast (2.8) |
| Attack Range | 6 tiles |
| Attack Type | Healing beam (ally) or damage beam (enemy) |
| Ally Heal | 1,200 HP |
| Enemy Damage | 600 |
| Ammo | 3 charges |
| Reload Speed | 1.5s |

**Main Attack — "Pixie Beam":** Auto-targets the nearest ally to heal them for 1,200 HP. If no ally is in range or player holds the attack button, fires a damage beam at the nearest enemy for 600 damage.

**Super — "Blessing Circle":** Pix creates a 3-tile-radius blessing circle at a target location for 5 seconds. Allies standing in it are healed for 600 HP/second and gain a 15% speed boost.

**Star Power 1 — "Overheal":** Healing can exceed the target's max HP by up to 20% (temporary shield HP that decays at 200 HP/second).

**Star Power 2 — "Hex":** Damage beam now applies a hex debuff — hexed enemies take 20% more damage from all sources for 3 seconds.

**Gadget — "Revive Dust":** Pix instantly revives a recently eliminated ally at the point of death with 25% HP. Only usable within 5 seconds of the ally's death. 1 use per match.

---

#### Brawler #9 — Drift (Epic)
**Theme:** Street Racer / Speedster
**Playstyle:** Extreme mobility skirmisher; disrupts positioning
**Visual:** Humanoid on a hover-skateboard with a graffiti-art aesthetic

| Stat | Value |
|------|-------|
| Health | 3,000 |
| Movement Speed | Very Fast (3.2) |
| Attack Range | 5 tiles |
| Attack Type | Forward-dashing slash |
| Damage | 1,400 |
| Ammo | 2 charges |
| Reload Speed | 1.5s |

**Main Attack — "Grind Slash":** Drift dashes 2 tiles forward on the board, swinging a neon blade. Hits all enemies in the dash path for 1,400 damage.

**Super — "Nitro Boost":** Drift gains extreme speed (+80%) for 3 seconds and becomes immune to slows. Any enemy contacted during Nitro Boost is knocked back and takes 800 damage.

**Star Power 1 — "Trick Shot":** After using Nitro Boost, the next Grind Slash fires 3 rapid slashes instead of 1.

**Star Power 2 — "Drafting":** Drift permanently moves 10% faster when moving behind an ally.

**Gadget — "Smoke Bomb":** Drift drops a smoke cloud (2-tile radius) at his location. Enemies in the cloud are blinded (can't see farther than 2 tiles) for 2 seconds. 2 uses per match.

---

#### Brawler #10 — Siege (Mythic)
**Theme:** Mechanical War Machine / Engineer
**Playstyle:** Zone controller who builds turrets and barriers
**Visual:** Human engineer in a mech exosuit with robotic arms

| Stat | Value |
|------|-------|
| Health | 4,200 |
| Movement Speed | Slow (2.0) |
| Attack Range | 6 tiles |
| Attack Type | Rapid-fire mini-gun |
| Damage per Bullet | 400 |
| Bullets per Burst | 3 |
| Ammo | 3 charges |
| Reload Speed | 1.8s |

**Main Attack — "Minigun Burst":** Fires 3 rapid bullets in a tight stream. Each bullet deals 400 damage. Full burst total: 1,200 damage.

**Super — "Deploy Mech-Turret":** Siege deploys a stationary turret at the target location. The turret fires minigun bursts at the nearest enemy every 1.2 seconds for 8 seconds (HP: 3,000).

**Star Power 1 — "Overclock":** Mech-Turret fires twice as fast when Siege is within 4 tiles of it.

**Star Power 2 — "Barrier Protocol":** Siege can also deploy a barrier wall (2 tiles wide) instead of a turret using the Super (toggle before use).

**Gadget — "Emergency Repair":** Siege instantly repairs all of their active deployed structures to full HP. 1 use per match.

---

#### Brawler #11 — Nova (Mythic)
**Theme:** Space Mage / Gravity Controller
**Playstyle:** Crowd control specialist; pulls and pushes enemies
**Visual:** Astronaut-suited figure with cosmic energy swirling around them

| Stat | Value |
|------|-------|
| Health | 3,100 |
| Movement Speed | Normal (2.4) |
| Attack Range | 7 tiles |
| Attack Type | Gravity orb (pulls or pushes) |
| Damage | 900 |
| Ammo | 2 charges |
| Reload Speed | 2.0s |

**Main Attack — "Gravity Orb":** Fires an orb that on impact pulls all enemies within 2 tiles toward the impact point, dealing 900 damage and disrupting their movement.

**Super — "Singularity":** Nova creates a gravitational singularity at the targeted location. All enemies within 5 tiles are continuously pulled toward the center and take 500 damage per second for 3 seconds. At the end, a burst explosion deals 1,500 damage to all enemies at the center.

**Star Power 1 — "Repulse":** Nova can toggle Gravity Orb to fire in push mode (pushes enemies away instead of pulling). Damage is unchanged.

**Star Power 2 — "Warp":** Nova can teleport to the location of any Gravity Orb within 1 second of it landing (instead of pulling enemies, Nova teleports).

**Gadget — "Zero-G Field":** Nova activates a 3-tile zero-gravity zone at their feet for 2 seconds. Enemies in the zone float and cannot move. 1 use per match.

---

#### Brawler #12 — Omen (Legendary)
**Theme:** Shadow Demi-God / Dark Oracle
**Playstyle:** Unpredictable, high-skill-ceiling Brawler with reality-bending abilities
**Visual:** Swirling shadow mass with a single glowing eye; dark tendrils emanating from its form

| Stat | Value |
|------|-------|
| Health | 3,600 |
| Movement Speed | Normal (2.4) |
| Attack Range | 8 tiles |
| Attack Type | Shadow bolt (seeking) |
| Damage | 1,600 |
| Ammo | 2 charges |
| Reload Speed | 2.0s |

**Main Attack — "Shadow Bolt":** Fires a slow-moving shadow bolt that homes in on the nearest enemy within 3 tiles of its path. Deals 1,600 damage on hit.

**Super — "Eclipse":** Omen summons an eclipse zone — a 7-tile-radius area of shadow. In the zone, Omen and its allies gain 25% damage boost, and enemies have their vision radius reduced to 3 tiles. Lasts 6 seconds.

**Star Power 1 — "Cursed Touch":** Enemies hit by Shadow Bolt are cursed — they take 15% of any damage they deal as self-damage for 4 seconds.

**Star Power 2 — "Dark Passage":** Omen can fire Shadow Bolts through walls.

**Gadget — "Dread Pulse":** Omen releases a pulse of fear — all enemies within 4 tiles are forced to run away from Omen for 1.2 seconds. 1 use per match.

---

### 6.5 Star Powers & Gadgets Unlock System

| Unlock | Method | Cost |
|--------|--------|------|
| Star Power 1 | Unlock when Brawler reaches Power Level 9 | Found in Brawl Boxes or purchased |
| Star Power 2 | Unlock when Brawler reaches Power Level 10 | Found in Brawl Boxes or purchased |
| Gadget | Unlock when Brawler reaches Power Level 7 | Found in Brawl Boxes or purchased |

### 6.6 Brawler Power Levels

Each Brawler has 10 Power Levels. Upgrading costs **Power Points** (collected from Brawl Boxes and quests) and **Gold** (the premium-lite currency).

| Power Level | HP Bonus | Damage Bonus | Gold Cost | Power Points |
|------------|---------|-------------|-----------|--------------|
| 1 (Base) | — | — | — | — |
| 2 | +5% | +5% | 20 | 20 |
| 3 | +10% | +10% | 35 | 30 |
| 4 | +15% | +15% | 75 | 50 |
| 5 | +20% | +20% | 140 | 80 |
| 6 | +25% | +25% | 290 | 130 |
| 7 | +30% | +30% | 580 | 210 |
| 8 | +35% | +35% | 1,125 | 340 |
| 9 | +40% | +40% | 1,900 | 550 |
| 10 | +45% | +45% | 3,000 | 890 |

---

## 7. Game Mechanics & Systems

### 7.1 Core Movement System

**Input Methods:**

| Platform | Primary Input | Secondary Input |
|----------|--------------|-----------------|
| Desktop | WASD/Arrow keys (move) + Mouse (aim) | Keyboard shortcuts for Super/Gadget |
| Mobile Browser | Virtual joystick (move) + Virtual aim joystick | Tap buttons for attack/super |
| Gamepad | Left stick (move) + Right stick (aim) | Shoulder buttons for attack/super |

**Movement Rules:**
- All movement is tile-based under the hood, rendered as smooth interpolated motion
- Maximum movement speed caps at 3.2 tiles per second (fastest Brawlers)
- Diagonal movement is normalized (no diagonal speed boost)
- Brawlers cannot move through walls, obstacles, or other Brawlers
- Bushes slow movement by 20% but grant visual concealment (vision cone is hidden from opponents)
- Water tiles are impassable unless a Brawler has a specific ability

**Wall Collision:**
- Walls are hard blocking geometry
- Projectiles may or may not pierce walls based on Brawler ability
- Brawler silhouettes are visible behind thin walls (low shrubs) but not behind solid walls

---

### 7.2 Combat System

#### 7.2.1 Attack System

- Each Brawler has an ammo system (1–3 charges)
- Ammo regenerates automatically over time (reload speed stat)
- Players can fire while moving (no movement penalty for attacking)
- Auto-aim assist is available on mobile (lowest priority target closest to aim direction)
- PC mode has no auto-aim (pure skill-based aiming)
- Projectiles travel in straight lines unless modified by Brawler ability (homing, arc, etc.)
- Projectile speed varies per Brawler (range from fast to slow/arcing)

#### 7.2.2 Damage System

- Damage is applied on projectile-enemy collision (server-authoritative)
- Damage numbers float above hit targets (color-coded: white = normal, yellow = critical, red = high damage, green = heal)
- Status effects: Burn, Poison, Slow, Stun, Root, Knockback, Pull, Push, Blind, Fear, Shield, Heal
- Status effects are visually represented by icons under the Brawler's health bar
- Damage is always based on the attacker's Brawler stats (no level disparity issues — all Brawlers in a match use their equipped power level)

#### 7.2.3 Super System

- The Super meter fills by dealing damage (primary method) and by receiving damage (secondary, 30% efficiency)
- Super meter size varies per Brawler (some supers require more hits to charge)
- The Super can be activated manually when the meter is full
- Super can be "stored" — it doesn't auto-activate
- Visual indicator: Super button glows and pulses when full; a ring fills around the Brawler avatar in the HUD

#### 7.2.4 Elimination & Respawn

- A Brawler is eliminated when their HP reaches 0
- Death animation plays (~1 second)
- Eliminated Brawlers drop relevant collectibles (Gems in Gem Grab, Stars in Bounty)
- In modes with respawn: ghost view is shown from the eliminated Brawler's last position until respawn
- Respawn timer counts down in HUD
- Respawning Brawlers appear at the team spawn point with full HP and ammo

---

### 7.3 Map System

#### 7.3.1 Map Architecture

Maps are built on a grid-based tile system:
- **Tile Size:** 64×64 pixels (logical) / scaled for device resolution
- **Tile Types:**
  - **Empty/Ground:** Passable; no special effect
  - **Wall (Solid):** Impassable; blocks projectiles
  - **Wall (Breakable):** Can be destroyed by attacks (HP: 4,000); becomes ground tile when destroyed
  - **Bush:** Passable; hides Brawlers from enemies farther than 2 tiles; slows by 20%
  - **Water:** Impassable by default
  - **Rope/Jump Pad:** Launches Brawlers a set distance on contact
  - **Healing Pad:** Standing on it heals 400 HP/second (used in select maps)
  - **Spawn Point:** Where teams spawn at match start and on respawn
  - **Gem Mine:** Spawns gems periodically (Gem Grab only)
  - **Safe:** Destructible objective (Heist only)

#### 7.3.2 Map Editor (Internal Tool)

An internal map editor will be created for the design team:
- Drag-and-drop tile placement
- Symmetry tools (auto-mirror for balanced maps)
- Playtest mode (launch a bot match in-editor)
- Export as JSON map definition
- Built in the browser using the same engine (reuses map rendering code)

Maps are defined in JSON format:

```json
{
  "id": "map_gem_grab_001",
  "name": "Crystal Cavern",
  "mode": "gem_grab",
  "width": 29,
  "height": 25,
  "tiles": [ /* 2D array of tile type IDs */ ],
  "spawnPoints": {
    "team1": [{"x": 2, "y": 12}, {"x": 2, "y": 11}, {"x": 2, "y": 13}],
    "team2": [{"x": 26, "y": 12}, {"x": 26, "y": 11}, {"x": 26, "y": 13}]
  },
  "gemMine": {"x": 14, "y": 12},
  "powerBoxes": [],
  "theme": "cave"
}
```

#### 7.3.3 Map Rotation

- Each game mode has 8 maps at launch
- Maps rotate daily (not at player choice) to keep the meta fresh
- Ranked mode uses a curated subset of maps (vetted for competitive balance)
- Community-rated maps can enter rotation in a post-launch update

---

### 7.4 Vision System

- Each Brawler has a default vision radius of **8 tiles**
- The map outside vision radius is obscured by a **fog of war** overlay
- Bushes block vision for enemies; standing in a bush only reveals the Brawler to enemies who are within 2 tiles of the bush
- Supers/abilities can extend or reduce vision radius (e.g., Omen's Eclipse reduces enemy vision)
- Spectator mode shows full map for observers

---

### 7.5 Matchmaking System

#### 7.5.1 Matchmaking Algorithm

- **Method:** Modified Elo-based trophy matchmaking with bucket ranges
- Players are matched within a trophy range (±150 trophies at first search, widening by ±50 every 10 seconds)
- Team balance is attempted (sum of team trophies should be within 10% of opponent team)
- Absolute max wait time: 60 seconds (after which, match is made with best available players)
- Bots fill slots if real players cannot be found within 45 seconds (clearly labeled as bots)

#### 7.5.2 Match Queue States

```
SEARCHING → FOUND_MATCH → CONFIRMING → LOADING → IN_GAME → POST_MATCH
```

- SEARCHING: Client sends queue request; polling server for match
- FOUND_MATCH: Match room found; clients notified
- CONFIRMING: All clients acknowledge readiness (5-second window)
- LOADING: Assets load; server initializes game state
- IN_GAME: Active match
- POST_MATCH: Results screen; trophy changes; reward display

#### 7.5.3 Mode Selection

- Players select a game mode from the lobby
- Within each mode, they can select a specific map (casual only) or play any map (competitive/ranked)
- Quick Play option: auto-selects a popular mode for fastest matchmaking

---

### 7.6 Trophy & Ranking System

#### 7.6.1 Individual Brawler Trophies

- Each Brawler has its own trophy count
- Win: +8 to +28 trophies (based on match performance and opponent trophy differential)
- Loss: -4 to -20 trophies
- Brawlers below 0 trophies are floored at 0 (cannot go negative)

#### 7.6.2 Trophy Road

The Trophy Road is a global progression track based on the player's **total trophies** (sum across all Brawlers):

| Milestone | Reward |
|-----------|--------|
| 50 | Brawl Box |
| 150 | New Brawler (Common) |
| 300 | Gold (500) |
| 500 | New Brawler (Rare) |
| 750 | Brawl Box × 3 |
| 1,000 | Rare Brawl Box |
| 1,500 | Gold (1,500) |
| 2,000 | New Brawler (Super Rare) |
| 3,000 | Rare Brawl Box × 5 |
| 5,000 | Epic Brawler Token |
| 10,000 | Mythic Brawler Token |

#### 7.6.3 Ranked Mode (Post-Launch v1.1)

- Separate from casual trophy system
- Seasonal resets (every 2 months)
- Ranks: Bronze → Silver → Gold → Diamond → Master → Grandmaster
- Placement matches at season start (10 matches)
- Ranked Points (RP) system: +20 to +40 for wins, -10 to -25 for losses
- Exclusive cosmetic rewards for reaching Gold+ at season end

---

## 8. Technical Architecture

### 8.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│   ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│   │  Game Engine    │  │   UI Layer       │  │  Network Layer   │  │
│   │  (Phaser 3 /    │  │  (React/Svelte   │  │  (WebSocket      │  │
│   │   PixiJS)       │  │   for menus)     │  │   Client)        │  │
│   └────────┬────────┘  └──────────────────┘  └────────┬─────────┘  │
│            │                                           │            │
│            └───────────────────┬───────────────────────┘            │
│                                │                                    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ WebSocket / HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVICES                           │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│   │  API Server  │  │  Game Server │  │  Matchmaking Service     │  │
│   │  (Node.js /  │  │  (Node.js /  │  │  (Node.js / Go)          │  │
│   │   Fastify)   │  │   Go)        │  │                          │  │
│   └──────┬───────┘  └──────┬───────┘  └───────────┬──────────────┘  │
│          │                 │                       │                 │
│          └─────────────────┼───────────────────────┘                 │
│                            │                                        │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Data Layer                                │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│   │  │  PostgreSQL  │  │    Redis     │  │    ClickHouse      │  │  │
│   │  │  (Player DB) │  │  (Sessions, │  │    (Analytics)     │  │  │
│   │  │              │  │   Game State│  │                    │  │  │
│   │  └──────────────┘  └──────────────┘  └────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┴──────────────────────┐
          ▼                                             ▼
┌──────────────────┐                        ┌──────────────────────┐
│   CDN (Assets)   │                        │  Auth Service        │
│   CloudFront /   │                        │  (JWT + OAuth2       │
│   Fastly         │                        │   Google/Discord)    │
└──────────────────┘                        └──────────────────────┘
```

### 8.2 Client-Side Architecture

#### 8.2.1 Game Engine Selection

**Primary Recommendation: Phaser 3**
- Mature, actively maintained browser game framework
- WebGL renderer with Canvas fallback
- Built-in physics, input, camera, asset management
- Strong community; extensive documentation
- TypeScript support

**Alternative: Custom PixiJS + Game Loop**
- More control over rendering pipeline
- Better performance ceiling
- More engineering effort
- Recommended if Phaser 3 bottlenecks appear at scale

**Decision Criteria:** Begin with Phaser 3 for launch velocity; consider PixiJS migration if performance benchmarks fail during stress testing.

#### 8.2.2 Client Technology Stack

| Component | Technology |
|-----------|-----------|
| Game Engine | Phaser 3.60+ |
| Language | TypeScript 5.x |
| UI (menus/lobby) | Svelte 4 (lightweight, fast compile) |
| State Management | Zustand (for UI state) |
| Bundler | Vite 5 |
| Asset Compression | WebP (sprites), OGG/MP3 (audio), GLTF (if 3D) |
| WebSocket Client | Native WebSocket API |
| PWA | Workbox (service worker) |
| Analytics SDK | Custom + PostHog |

#### 8.2.3 Client Game Loop

```
requestAnimationFrame Loop (target 60 FPS):
│
├── Input Processing
│   ├── Read keyboard/mouse/touch state
│   ├── Apply input to local prediction model
│   └── Queue input for server transmission
│
├── Network Update
│   ├── Receive server state packets
│   ├── Apply server reconciliation
│   └── Interpolate between server states
│
├── Simulation Step
│   ├── Update Brawler positions (client-side prediction)
│   ├── Update projectiles
│   ├── Update status effects
│   ├── Update camera
│   └── Update UI state
│
├── Render
│   ├── Background tilemap
│   ├── Game objects (Brawlers, projectiles, effects)
│   ├── UI overlay (HUD)
│   └── Debug overlay (dev mode)
│
└── Audio
    ├── Spatial audio update
    └── Music fade/crossfade
```

#### 8.2.4 Asset Pipeline

**Sprite Sheets:**
- All game sprites packed into texture atlases using TexturePacker or similar
- Max atlas size: 2048×2048 px (ensures compatibility with WebGL on mobile)
- Format: PNG (lossless for sprites) + WebP version for modern browsers
- Brawler animations: 8–12 frames per animation state (idle, walk, attack, hit, death)

**Level-of-Detail (LOD):**
- Desktop: Full-resolution assets (1× and 2× for high-DPI)
- Mobile: Half-resolution asset packs auto-selected based on device pixel ratio and GPU tier

**Asset Loading Strategy:**
- Critical assets (UI, main Brawler, map tiles) loaded synchronously before match start
- Secondary assets (other Brawlers' skins, sound effects) loaded async during loading screen
- Cached in Service Worker cache for returning players (offline-first asset loading)

---

### 8.3 Server-Side Architecture

#### 8.3.1 Game Server Design

**Language:** Go (preferred for performance) or Node.js with worker threads
**Pattern:** Authoritative server with client-side prediction

**Game Room Model:**
- Each active match runs in an isolated game room (goroutine in Go or worker thread in Node.js)
- Game room receives input from all clients
- Game room simulates the authoritative game state at a fixed tick rate
- Game room broadcasts state updates to all clients

**Server Tick Rate:** 20 ticks/second (50ms intervals)
- Sufficient for smooth gameplay when combined with client-side prediction
- Reduces bandwidth vs. 60-tick while maintaining fairness

**State Broadcast:**
- Full state snapshot broadcast every 5 ticks (250ms) — used for reconciliation
- Delta updates every tick (50ms) — only changed entities broadcast

#### 8.3.2 Client-Side Prediction & Server Reconciliation

```
Client Input Timeline:
T=0    T=50   T=100  T=150  T=200  (ms)
 │      │      │      │      │
 ▼      ▼      ▼      ▼      ▼
[Input] [Input] [Input] [Input] [Input]
  │                              │
  │       Client Predicts        │
  │       Local State            │
  ▼                              ▼
[Predicted State] ──────────────►[Server ACK]
                                   │
                              [Reconcile if
                               mismatch > threshold]
```

- Client immediately applies player's own inputs locally (prediction)
- Server processes inputs with ~50–150ms latency
- When server state arrives, client compares predicted vs. authoritative state
- If mismatch > 5px for position or > 50ms for timing: snap-correct with lerp smoothing
- Remote players (opponents) are interpolated between last two received server states (adds ~100ms of input lag for remote players — acceptable)

#### 8.3.3 API Server

**Framework:** Fastify (Node.js) — fastest Node.js web framework
**Auth:** JWT (short-lived access tokens, 15 min) + Refresh tokens (30 days)
**Rate Limiting:** Per-IP and per-user rate limits on all endpoints

**Core API Endpoints:**

```
Authentication:
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout
GET    /auth/oauth/google
GET    /auth/oauth/discord

Player:
GET    /player/me
PATCH  /player/me/settings
GET    /player/:id/profile
GET    /player/:id/stats
GET    /player/leaderboard

Brawlers:
GET    /brawlers                    (catalog)
GET    /brawlers/:id
GET    /player/me/brawlers          (owned brawlers + stats)
POST   /player/me/brawlers/equip

Progression:
GET    /player/me/trophies
GET    /player/me/trophyroad
POST   /player/me/claimtrophyroad/:milestoneId

Shop:
GET    /shop/offers
POST   /shop/purchase

BattlePass:
GET    /battlepass/current
POST   /battlepass/claimtier/:tier

Matchmaking:
POST   /match/queue/join
DELETE /match/queue/leave
GET    /match/queue/status

Social:
POST   /social/clan/create
POST   /social/clan/join
DELETE /social/clan/leave
GET    /social/clan/:id
GET    /social/friends
POST   /social/friends/add
DELETE /social/friends/:id
```

#### 8.3.4 Database Schema (Simplified)

**PostgreSQL — Core Data:**

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(20),
  oauth_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT
);

-- Player Profiles
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  display_name VARCHAR(30) NOT NULL,
  avatar_id INT DEFAULT 1,
  name_color VARCHAR(7) DEFAULT '#FFFFFF',
  total_trophies INT DEFAULT 0,
  highest_trophies INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_losses INT DEFAULT 0,
  gems INT DEFAULT 0,         -- premium currency
  gold INT DEFAULT 0,         -- soft currency
  brawl_tokens INT DEFAULT 0, -- box-opening currency
  clan_id UUID REFERENCES clans(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brawler Ownership
CREATE TABLE player_brawlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id),
  brawler_id INT NOT NULL,
  power_level INT DEFAULT 1,
  power_points INT DEFAULT 0,
  trophies INT DEFAULT 0,
  highest_trophies INT DEFAULT 0,
  star_power_1_unlocked BOOLEAN DEFAULT FALSE,
  star_power_2_unlocked BOOLEAN DEFAULT FALSE,
  gadget_unlocked BOOLEAN DEFAULT FALSE,
  equipped_skin_id INT,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  UNIQUE(player_id, brawler_id)
);

-- Match History
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode VARCHAR(30) NOT NULL,
  map_id VARCHAR(50) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  winner_team INT,
  duration_seconds INT
);

CREATE TABLE match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  player_id UUID REFERENCES users(id),
  brawler_id INT NOT NULL,
  team INT NOT NULL,
  trophies_change INT DEFAULT 0,
  kills INT DEFAULT 0,
  deaths INT DEFAULT 0,
  damage_dealt INT DEFAULT 0,
  healing_done INT DEFAULT 0,
  is_mvp BOOLEAN DEFAULT FALSE
);

-- Clans
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(30) UNIQUE NOT NULL,
  tag VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),
  member_count INT DEFAULT 1,
  max_members INT DEFAULT 30,
  trophy_requirement INT DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle Pass
CREATE TABLE battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season INT NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  free_tiers JSONB NOT NULL,   -- array of reward objects
  premium_tiers JSONB NOT NULL
);

CREATE TABLE player_battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id),
  season INT NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  current_tier INT DEFAULT 0,
  current_xp INT DEFAULT 0,
  UNIQUE(player_id, season)
);
```

**Redis — Session & Game State:**
```
Keys:
session:{token}                      → PlayerSession JSON (TTL: 15min)
refresh:{token}                      → UserId (TTL: 30 days)
queue:{mode}                         → Sorted Set of PlayerQueue entries
match:{matchId}:state                → Serialized GameState JSON (TTL: 10min after match end)
match:{matchId}:players              → Set of PlayerIds
ratelimit:{ip}:{endpoint}            → Request count (TTL: 60s)
player:{playerId}:online             → Last heartbeat timestamp (TTL: 30s)
```

---

## 9. Rendering & Graphics Pipeline

### 9.1 Art Style

**Style:** 2D isometric-lite top-down perspective with a stylized, cartoony aesthetic
- Bold outlines on characters and important objects
- Vibrant color palette with high contrast for readability
- Smooth 8-direction movement animations
- Particle-heavy ability effects (sparks, flames, shadows)
- Map tiles use a clean, flat-art style with slight texture

**Color Palette Principles:**
- Team 1: Warm colors (orange/red tones) for team indicators
- Team 2: Cool colors (blue/teal tones)
- UI: Dark background with neon accents
- Friendly = outlined in blue; Enemy = outlined in red (colorblind-friendly alternative available)

### 9.2 Rendering Layers (Draw Order)

```
Layer 0: Background / Base Tile Layer
Layer 1: Floor Decorations (static, non-interactive)
Layer 2: Water Surfaces / Animated Tiles
Layer 3: Bushes (behind Brawlers)
Layer 4: Brawlers & Projectiles (depth-sorted by Y position)
Layer 5: Walls / Foreground Tiles (over Brawlers when appropriate)
Layer 6: Bush Overlay (Brawler hidden state visual)
Layer 7: Particle Effects (above all game objects)
Layer 8: HUD / UI Overlay (fixed to screen space)
Layer 9: Full-screen FX (damage flash, screen shake)
Layer 10: Debug Overlay (dev mode only)
```

### 9.3 Animation System

**Brawler Animation States:**
- `idle` — standing still (2–4 frame loop)
- `walk` — moving (8-directional, 6–8 frames)
- `attack` — attack animation (4–8 frames, triggers on input)
- `super` — super animation (8–12 frames)
- `hit` — flinch on taking damage (2–4 frames)
- `death` — death animation (8–12 frames, plays once)
- `spawn` — spawn animation (4–6 frames, plays on respawn)
- `celebrate` — victory pose (looping, plays on win screen)
- `gadget` — gadget activation animation (4–8 frames)

**Animation Blending:**
- Walk → Idle: 100ms blend
- Idle → Attack: Immediate snap
- Any → Hit: Interrupt current animation, play hit, return to interrupted animation
- Any → Death: Interrupt everything, play death once

### 9.4 Shader Requirements

| Shader | Purpose |
|--------|---------|
| Outline Shader | Per-Brawler colored outline (team color) |
| Bush Translucency | Semi-transparent Brawler when inside bush |
| Fog of War | Gradient dark overlay on unexplored areas |
| Screen Flash | Full-screen color flash on damage/death |
| Water Ripple | Animated water tile shader |
| Burn/Freeze FX | Overlay effect on status-affected Brawlers |
| Glow Pulse | Super meter full indicator glow |

All shaders must be implemented in GLSL for WebGL 2.0 with fallbacks for WebGL 1.0 (basic Canvas rendering).

### 9.5 Particle System

Custom particle system built on top of Phaser's particle manager:

**Effect Types:**
- Hit spark (directional sparks on bullet impact)
- Explosion (radial burst, 0.3–0.8 second lifetime)
- Healing orbs (rising green orbs)
- Super activation burst (screen-space radial effect)
- Death burst (character-colored particles)
- Environmental (leaf scatter, dust, sparkling gems)
- Status effect particles (flames, electric arcs, shadow wisps)

**Performance Budget:** Max 500 active particles per frame on mobile; max 2,000 on desktop.

---

## 10. Networking & Multiplayer

### 10.1 Protocol Design

**Transport:** WebSocket (WSS — encrypted)
**Serialization:** MessagePack (binary, ~30% smaller than JSON) with fallback to JSON

**Message Types:**

```typescript
// Client → Server
enum ClientMessageType {
  INPUT        = 0x01,  // Player input state
  PING         = 0x02,  // Latency measurement
  SUPER_USE    = 0x03,  // Activate super ability
  GADGET_USE   = 0x04,  // Activate gadget
  EMOTE        = 0x05,  // Play emote
  READY        = 0x06,  // Confirm ready for match start
}

// Server → Client
enum ServerMessageType {
  GAME_STATE      = 0x10,  // Full state snapshot
  DELTA_UPDATE    = 0x11,  // Incremental state changes
  PLAYER_JOINED   = 0x12,  // New player connected
  PLAYER_LEFT     = 0x13,  // Player disconnected
  HIT_CONFIRM     = 0x14,  // Server-confirmed hit event
  ABILITY_USED    = 0x15,  // Ability activation confirmed
  MATCH_STARTED   = 0x16,  // Match begin signal
  MATCH_ENDED     = 0x17,  // Match results
  PONG            = 0x18,  // Latency response
  ERROR           = 0x19,  // Error notification
  CHAT            = 0x1A,  // In-game quick chat message
}
```

### 10.2 Input Packet Structure

```typescript
interface InputPacket {
  seq: number;          // Sequence number (for reconciliation ordering)
  timestamp: number;    // Client timestamp
  moveX: number;        // -1.0 to 1.0 (normalized)
  moveY: number;        // -1.0 to 1.0 (normalized)
  aimX: number;         // Aim direction X (normalized)
  aimY: number;         // Aim direction Y (normalized)
  attackHeld: boolean;  // Attack button state
  superPressed: boolean; // Super button pressed this frame
}
```

Sent at **20Hz** (every 50ms), or immediately on Super/Gadget use.

### 10.3 State Update Packet Structure

```typescript
interface GameStateDelta {
  tick: number;
  players: Array<{
    id: string;
    x: number;
    y: number;
    hp: number;
    ammo: number;
    superCharge: number;
    state: BrawlerState;
    aimDir: number;  // angle in radians
    statusEffects: StatusEffect[];
  }>;
  projectiles: Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ownerId: string;
  }>;
  gameData: {
    // Mode-specific: gem counts, timer, scores, etc.
  };
  events: Array<GameEvent>;  // kills, gem pickups, etc.
}
```

### 10.4 Latency Handling

| Latency | Behavior |
|---------|----------|
| < 50ms | Seamless; near-invisible prediction errors |
| 50–100ms | Minor interpolation artifacts; acceptable |
| 100–200ms | Noticeable rubber-banding; warning shown |
| > 200ms | High latency warning overlay shown |
| > 500ms | Connection timeout initiated; attempt reconnect |

**Reconnection Logic:**
- On disconnect, client attempts to reconnect for up to 10 seconds
- If reconnected within 10 seconds, match resumes (player controlled by last input during disconnect)
- After 10 seconds: player's slot is replaced by a bot; player is returned to lobby

### 10.5 Anti-Cheat

- **Authoritative Server:** All game logic runs server-side. Client inputs are validated but never trusted for game outcomes.
- **Input Validation:** Movement speed caps validated per tick; teleportation detected and rejected
- **Rate Limiting:** Input packet rate limited to prevent packet flooding
- **Damage Validation:** Hit events validated server-side; client hit confirmations are advisory only
- **Behavior Anomaly Detection:** ML-based anomaly detection for unusual win rates, click patterns, or speed anomalies (post-launch)
- **Replay Recording:** Server-side match recordings enable post-hoc cheat analysis

---

## 11. UI/UX Design Requirements

### 11.1 Design Principles

1. **Clarity First:** Game state must be immediately readable at a glance
2. **Minimal Cognitive Load:** HUD should not distract from gameplay; information hierarchy is critical
3. **Responsive:** UI adapts between desktop, tablet, and mobile
4. **Accessible:** High contrast, colorblind-safe options, scalable UI
5. **Delightful:** Micro-interactions and animations reward player actions

### 11.2 Screen Inventory

| Screen | Description |
|--------|-------------|
| Splash / Loading | Logo, loading bar, tips |
| Login / Register | Email + password, OAuth buttons |
| Main Lobby | Featured mode, trophy count, news banner, nav bar |
| Brawler Select | Pre-match Brawler selection screen |
| In-Game HUD | Core gameplay overlay |
| Post-Match Results | Trophy change, MVP, rewards |
| Brawler Profile | Individual Brawler stats, upgrades, skins |
| Brawler Collection | Grid view of all Brawlers |
| Shop | Offers, bundles, packs |
| Battle Pass | Tier progression view |
| Trophy Road | Visual progress track |
| Profile | Player stats, match history |
| Clan | Clan info, members, chat |
| Settings | Audio, video, controls, account |
| Leaderboard | Global and regional rankings |

### 11.3 In-Game HUD Specifications

```
┌────────────────────────────────────────────────────────────────────┐
│  [Team Score / Mode Objective]          [Timer: 02:13]             │
│  [💎 Team 1: 7/10]                      [💎 Team 2: 4/10]          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    [GAME WORLD VIEW]                               │
│                                                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  [P1 Avatar][HP Bar]  [P2 Avatar][HP Bar]  [P3 Avatar][HP Bar]    │
│  (Team 1)                                                         │
│                                                                    │
│  [E1 Avatar][HP Bar]  [E2 Avatar][HP Bar]  [E3 Avatar][HP Bar]    │
│  (Team 2)                                                         │
│                                                                    │
│  [AMMO: ●●●]          [MOVE/AIM JOYSTICK (mobile)]                │
│                                                                    │
│  [ATTACK BTN]    [SUPER BTN (glows when full)]   [GADGET BTN]     │
│                  [===Super Charge Meter===]                        │
└────────────────────────────────────────────────────────────────────┘
```

**Desktop Controls:**
- WASD: Move
- Mouse: Aim (continuous)
- Left Click / Space: Attack
- Right Click / E: Super
- Q: Gadget
- Tab: Show score/detailed stats
- Escape: Pause menu

**Mobile Controls:**
- Left virtual joystick: Move (left thumb zone)
- Right virtual joystick: Aim (right thumb zone)
- Release right joystick: Attack
- Super button (visible when charged): Top-right
- Gadget button: Bottom-right area
- Auto-aim toggle button: Settings accessible during match

### 11.4 Main Lobby Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]    [🏆 4,280 Trophies]    [💎 450 Gems]    [👤 Profile]    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              NEWS / FEATURED CONTENT BANNER                  │  │
│  │              (rotating, animated)                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────┐   ┌────────────────────────────────┐  │
│  │  SELECTED MODE         │   │  BATTLE PASS PREVIEW           │  │
│  │  [Gem Grab ▼]         │   │  Season 1 — "Storm Rising"     │  │
│  │                        │   │  Tier 24/60 [====——] 2,400XP   │  │
│  │  [ PLAY BUTTON ]       │   │  [View Battle Pass]            │  │
│  └────────────────────────┘   └────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  BRAWLER QUICK-SELECT (recently used / favorites)             │ │
│  │  [Brawler 1] [Brawler 2] [Brawler 3] [Brawler 4] [+ More]    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [🎴 Collection] [🏪 Shop] [📋 Events] [👥 Clan] [⚙ Settings]      │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.5 Loading Screen

- Animated logo reveal (0.5 seconds)
- Progress bar with descriptive loading stages ("Loading Map…", "Connecting…", "Waiting for Players…")
- Tip/tutorial text rotates at bottom
- Animated preview of selected map's art
- Must complete in under 8 seconds on a 10 Mbps connection
- First-load: 5–15 seconds (downloads ~8MB of critical assets)
- Return load: 1–3 seconds (assets served from Service Worker cache)

---

## 12. Progression & Monetization System

### 12.1 Core Currencies

| Currency | Name | Description | Earned By | Spent On |
|----------|------|-------------|-----------|---------|
| 💎 Gems | Premium Hard Currency | Main IAP currency | Purchase with real money; small amounts from Battle Pass free tier | Skins, Battle Pass, Brawl Boxes, special offers |
| 🪙 Gold | Soft Currency | Brawler upgrade currency | Brawl Boxes, Trophy Road, quests, daily login | Upgrading Brawler Power Levels |
| ⚡ Tokens | Box Currency | Used to open Brawl Boxes | Matches (win/lose), quests, events | Opening Brawl Boxes (1 token = 1 box opportunity) |
| 🔮 Power Points | Upgrade Material | Per-Brawler upgrade material | Brawl Boxes, Trophy Road, quests | Upgrading specific Brawlers |
| ⭐ Star Points | Prestige Currency | End-of-season reward | Based on season trophy performance | Exclusive star point shop (skins, pins, sprays) |

### 12.2 Brawl Box System

**Box Types:**

| Box | Cost / Earn Method | Drop Rates |
|-----|-------------------|-----------|
| Brawl Box | 100 Tokens | Common Brawler: 1%, Rare+: 0.3%, Power Points: 70%, Gold: 28.7% |
| Big Box | 300 Tokens (or 30 Gems) | 3× Brawl Box rolls with boosted rates |
| Mega Box | 1,000 Tokens (or 80 Gems) | 10× Brawl Box rolls with boosted rates |
| Rare Box | Trophy Road / Events | Higher Brawler unlock rates |
| Epic Box | Special Events | Guaranteed Epic or higher Brawler |

**Pity System:**
- If no Brawler is unlocked in 100 Brawl Boxes, the next box guarantees a Brawler (Common or higher)
- Rarity pity scales: 200 boxes guarantee Rare+, 400 guarantee Super Rare+
- Pity counter persists across box types (all count toward the same counter)

### 12.3 Battle Pass

**Season Duration:** 8 weeks
**Cost:** 169 Gems (≈ $9.99 USD)
**Tiers:** 60

**XP Earning:**
- Match played (win or lose): +20 XP
- Win bonus: +10 XP
- Daily quest completion: +50–150 XP
- Weekly quest completion: +200–500 XP

**Free Tier Rewards (Every Player):**
- ~15 reward tiers including: Tokens, Power Points, Gold (small amounts), a free skin at Tier 30, and 1 new Brawler at Tier 50

**Premium Tier Rewards (Battle Pass Owners):**
- All 60 tiers unlocked for collection
- Exclusive Brawler skin at Tier 1 (immediate)
- ~1,000 Gems returned through the pass (partial offset of purchase price)
- Exclusive profile icons, sprays, pins
- Bonus tokens and gold throughout
- Exclusive Brawler at Tier 70 (bonus super-tier for completing all quests + pass)

**Battle Pass Ethics Commitments:**
- Free track provides real value (not just tokens and padding)
- No gameplay-impacting rewards locked behind paid track (skins and cosmetics only — stat-affecting items like Power Points are on both tracks, proportionally)
- Clear indication of what is/isn't in the free tier before purchase

### 12.4 Shop Design

**Sections:**

1. **Daily Offers** — Rotating daily; 3–5 items
   - Specific Brawler skins (limited time)
   - Resource bundles (Gems → Gold conversion)
   - Box bundles

2. **Featured Offers** — Weekly rotating; bigger bundles
   - Brawler + skin bundle
   - Seasonal themed packs

3. **Gem Packs** — Fixed IAP options:

| Pack | Gems | Price |
|------|------|-------|
| Handful | 30 | $1.99 |
| Pouch | 80 | $4.99 |
| Box | 170 | $9.99 |
| Bag | 360 | $19.99 |
| Suitcase | 950 | $49.99 |
| Safe | 2,000 | $99.99 |

4. **Gold Pass** — $4.99/month subscription:
   - +50% Gold from all sources
   - Daily free Big Box
   - Exclusive "Gold Pass" profile badge
   - No gameplay stat advantage

5. **Star Points Shop** — Purchased with Star Points (non-IAP):
   - Classic skins at set Star Point prices
   - Animated profile icons
   - Exclusive sprays and pins

### 12.5 Monetization Ethics Guidelines

The following practices are explicitly prohibited in BrawlWeb:

- ❌ No pay-to-win mechanics (cosmetics only behind paywall)
- ❌ No loot boxes that require payment to open (all purchased directly or earned via tokens)
- ❌ No artificial energy/stamina systems that prevent gameplay without payment
- ❌ No predatory targeting of children (COPPA compliance required; under-13 accounts restricted from purchases without parental approval)
- ❌ No countdown pressure timers on critical purchases (cosmetic offers only)
- ❌ No obscuring the real-money cost of purchases

### 12.6 Daily & Weekly Quest System

**Daily Quests (3 per day, refresh at midnight UTC):**
- Examples:
  - "Win 2 matches as any Brawler" → 500 Tokens + 50 XP
  - "Deal 5,000 damage in Gem Grab" → 250 Tokens + 50 XP
  - "Collect 15 Gems in a single match" → 300 Tokens + 75 XP
- One daily quest can be re-rolled for free each day

**Weekly Quests (3 per week, refresh Monday UTC):**
- Examples:
  - "Win 15 matches" → 2,000 Tokens + 200 XP
  - "Play 3 different game modes" → 1,000 Tokens + 200 XP
  - "Get 50 eliminations" → 3,000 Tokens + 300 XP

**Quests are designed to:**
- Encourage mode variety
- Not require wins (to reduce frustration for lower-skill players)
- Be completable in 20–40 minutes of play per day

---

## 13. Audio Design

### 13.1 Audio Architecture

**Library:** Howler.js (web audio)
**Fallback:** HTML5 Audio API for browsers with no Web Audio support

**Audio Budget Per Active Match:**
- Max simultaneous sounds: 32 channels
- Priority system: UI (highest) > Local player actions > Nearby enemy actions > Background
- Distance-based attenuation: sounds beyond 8 tiles from player perspective begin fading out

### 13.2 Spatial Audio

- All in-game sound effects use positional audio (pan left/right based on source position relative to camera)
- Sounds from off-screen enemies audible at reduced volume with correct pan — gives audio cues for positional awareness
- Music does not use spatial audio (non-positional stereo)

### 13.3 Sound Effect Inventory

**Global / UI:**
- Button click (3 variants)
- Navigation transition
- Purchase confirmation
- Error / reject
- Trophy count-up
- Match found notification
- Level-up jingle
- Box opening (common, rare, epic)

**Per Brawler (12 Brawlers × ~15 SFX = 180 SFX):**
- Spawn sound
- Footstep loop (surface variants: stone, grass, wood)
- Attack launch (per attack type)
- Attack hit (on enemy)
- Attack miss / wall impact
- Super activation
- Super effect
- Gadget use
- Taking damage (2 variants)
- Death sound
- Victory one-liner (voice line)
- Defeat reaction (voice line)

**Environment:**
- Gem spawn chime
- Gem pickup
- Gem drop on death
- Safe taking damage (Heist)
- Safe destroyed (Heist)
- Power cube spawn / pickup (Showdown)
- Bush rustling on enter
- Poison cloud ambient (Showdown)
- Match timer warning (10 seconds)
- Match start countdown

**Music:**
- Main theme (lobby loop, ~3 minutes)
- Match music (4 variants: action, tense, winning, overtime)
- Victory fanfare (short, ~4 seconds)
- Defeat music (short, ~3 seconds)
- Shop music (laid-back, ~2 minutes loop)

### 13.4 Audio Settings

| Setting | Options |
|---------|---------|
| Master Volume | 0–100% |
| Music Volume | 0–100% |
| SFX Volume | 0–100% |
| Voice Lines | On / Off |
| Spatial Audio | On / Off |

---

## 14. Performance Requirements

### 14.1 Target Platforms & Minimum Specs

**Desktop Minimum:**
- OS: Windows 10, macOS 10.15, Ubuntu 20.04
- Browser: Chrome 90+, Firefox 88+, Edge 90+, Safari 15+
- CPU: Intel Core i3-6100 / AMD Ryzen 3 1200
- RAM: 4GB
- GPU: Any with WebGL 2.0 support (Intel HD 4000 or better)
- Network: 5 Mbps, < 150ms ping to game server

**Desktop Target:**
- CPU: Intel Core i5-8th gen / AMD Ryzen 5 2600
- RAM: 8GB
- GPU: NVIDIA GTX 1060 / AMD RX 580
- Target: 60 FPS, < 50ms server RTT

**Mobile Minimum (Browser):**
- iOS: iPhone 8 (Safari 15+)
- Android: Chrome 90+ on mid-range 2020 Android devices
- RAM: 2GB
- Network: LTE or WiFi, < 200ms ping
- Target: 30+ FPS

**Chromebook (Special Target):**
- ChromeOS 88+, Chrome 90+
- 4GB RAM
- Target: 30–60 FPS depending on hardware tier

### 14.2 Performance Targets by Category

| Metric | Desktop Target | Mobile Target |
|--------|---------------|--------------|
| FPS (in-match) | 60 FPS | 30 FPS |
| FPS (lobby) | 60 FPS | 30 FPS |
| Initial load time | < 5 sec (cached) / < 12 sec (cold) | < 8 sec (cached) / < 18 sec (cold) |
| Match start time | < 3 sec after all clients ready | Same |
| Input latency | < 16ms (60 FPS frame) | < 33ms |
| Network payload (per tick) | < 2KB | < 2KB |
| Memory footprint | < 512MB | < 256MB |
| CPU usage (in-match) | < 40% single core | < 60% single core |
| Asset bundle size | < 10MB critical / < 50MB total | Same (lazy-loaded) |

### 14.3 Performance Monitoring

- Real-time FPS counter (dev mode + player option)
- Client-side performance profiler (tracks frame time, GC pauses, network latency)
- Automatic quality reduction if sustained FPS < 20 for 3+ seconds:
  - Step 1: Reduce particle count by 50%
  - Step 2: Disable non-essential shaders (water ripple, etc.)
  - Step 3: Reduce render resolution to 75%
  - Step 4: Switch to Canvas renderer (disables WebGL)
  - Player is notified of quality reduction and can manually override

### 14.4 Bundle Optimization

- Code splitting: Lobby bundle separate from Game bundle
- Tree-shaking with Vite ensures no dead code in bundles
- Phaser 3 custom build (only include used modules)
- All sprites in texture atlases (minimize WebGL texture switches)
- Audio files: OGG (primary) + MP3 (Safari fallback), loaded lazily by priority
- Gzip + Brotli compression on CDN for all static assets
- HTTP/2 push for critical assets on first load

---

## 15. Security Requirements

### 15.1 Authentication Security

- Passwords: bcrypt hashed (cost factor 12) — never stored in plaintext
- JWT tokens: RS256 signed; 15-minute expiry
- Refresh tokens: Stored in httpOnly, Secure, SameSite=Strict cookies
- OAuth: PKCE flow for Google and Discord OAuth2
- MFA: TOTP-based 2FA (Google Authenticator compatible) — optional but encouraged
- Brute force protection: Account locked after 5 failed login attempts within 10 minutes (with exponential backoff)

### 15.2 Transport Security

- HTTPS/WSS enforced everywhere; HTTP redirected to HTTPS
- HSTS headers enabled (max-age: 31536000; includeSubDomains)
- TLS 1.2 minimum; TLS 1.3 preferred
- Content Security Policy (CSP) headers configured to prevent XSS
- CORS: Restricted to own domains only

### 15.3 Input Validation

- All API inputs validated server-side with schema validation (Zod or Joi)
- SQL injection prevention: Parameterized queries only (no string concatenation SQL)
- XSS prevention: Output encoding on all user-generated content
- Rate limiting on all endpoints (IP + account level)
- File upload restriction: Only specific image types for avatar uploads (MIME type + magic byte validation), max 2MB

### 15.4 Game Security

- All game logic runs on authoritative server (no client trust for outcomes)
- Server validates:
  - Player position (max delta per tick based on speed stat)
  - Attack frequency (cannot fire faster than reload speed)
  - Damage amounts (calculated server-side, not client-reported)
  - Super activation eligibility
- Packet sequence numbers prevent replay attacks
- WebSocket connection requires valid JWT on connect

### 15.5 Privacy & Compliance

- GDPR compliant (EU players):
  - Clear consent for data collection
  - Right to data export
  - Right to account deletion (permanently removes all PII within 30 days)
  - Cookie consent banner
- COPPA compliant (US under-13):
  - Age gate on registration
  - Under-13 accounts: no purchases, no chat, no social features without parental consent
- CCPA compliant (California)
- Privacy policy clearly written in plain language
- Minimal data collection principle: only collect what is needed

---

## 16. Analytics & Telemetry

### 16.1 Analytics Stack

| Component | Tool |
|-----------|------|
| Product Analytics | PostHog (self-hosted) |
| Game Analytics | Custom ClickHouse pipeline |
| Error Tracking | Sentry |
| Performance Monitoring | Grafana + Prometheus |
| A/B Testing | PostHog Experiments |
| Revenue Analytics | Custom dashboard |

### 16.2 Key Events to Track

**Acquisition:**
- New user registration (source attribution)
- First match played
- First Brawler unlocked

**Engagement:**
- Session start/end (duration)
- Matches played per session
- Mode selection distribution
- Brawler selection distribution
- Queue time distribution

**Progression:**
- Trophy gains/losses
- Brawler power level upgrades
- Trophy Road milestones claimed
- Battle Pass tier progression
- Quest completion rates

**Retention:**
- Daily active users (DAU)
- Weekly active users (WAU)
- D1, D7, D30 retention cohorts
- Churn event triggers (what happened before a player's last session)

**Monetization:**
- Purchase events (item, amount, currency)
- Gem acquisition vs. spend rates
- Battle Pass conversion rate
- Shop click-through rates
- ARPU, ARPPU, LTV

**Game Performance:**
- Frame rate distribution per device
- Network latency distribution
- Client error rates
- Match completion rate (vs. disconnect/abandon rate)

### 16.3 KPI Dashboard

Core KPIs tracked in real-time:

| KPI | Target (3 months post-launch) |
|-----|-------------------------------|
| DAU | 50,000 |
| MAU | 400,000 |
| D1 Retention | ≥ 40% |
| D7 Retention | ≥ 20% |
| D30 Retention | ≥ 10% |
| ARPU (monthly) | ≥ $2.50 |
| Average session duration | ≥ 18 minutes |
| Matches per session | ≥ 3 |
| Battle Pass conversion | ≥ 12% |
| Crash-free session rate | ≥ 99% |

---

## 17. Accessibility Requirements

### 17.1 Visual Accessibility

- **Colorblind Mode:** Replace team colors with distinct patterns (stripes vs. dots) in addition to color differences
- **Colorblind Presets:** Deuteranopia, Protanopia, Tritanopia modes with adjusted palettes
- **High Contrast Mode:** Increases outline thickness and UI element contrast
- **Scalable UI:** UI scale slider (80% – 150%) for players with low vision
- **Subtitles:** All voice lines have on-screen text subtitles (optional)
- **Screen Reader:** Basic screen reader support for all lobby/menu navigation (ARIA labels, focus management)

### 17.2 Motor Accessibility

- **Aim Assist Intensity:** Adjustable from 0% (off) to 100% (strong auto-aim)
- **Auto-Fire Option:** Hold attack button to auto-fire at max rate
- **Toggle vs. Hold:** Super and Gadget buttons can be set to toggle (instead of hold)
- **Custom Key Binding:** All keyboard shortcuts fully rebindable
- **One-Hand Mode:** Redesigned mobile layout for single-handed play
- **Click/Tap Sensitivity:** Adjustable for touch screens

### 17.3 Cognitive Accessibility

- **Tutorial System:** Comprehensive tutorial for all game modes and mechanics
- **Bot Practice Mode:** Play against bots to learn without competitive pressure
- **Simplified HUD Option:** Hides secondary information, shows only health and ammo
- **Match Recaps:** Post-match summary explains what happened (gems collected, eliminations, trophy change)
- **Clear Onboarding:** New players are guided through the first 3 matches with tooltips

### 17.4 WCAG Compliance

- All non-game-screen UI elements target **WCAG 2.1 Level AA** compliance
- Minimum contrast ratio 4.5:1 for text elements
- All interactive elements have visible focus indicators
- No functionality dependent solely on color perception

---

## 18. Localization

### 18.1 Launch Languages

| Language | Locale | Region Priority |
|----------|--------|----------------|
| English | en-US | P0 |
| Portuguese (Brazilian) | pt-BR | P0 |
| Spanish (Latin America) | es-MX | P0 |
| French | fr-FR | P1 |
| German | de-DE | P1 |
| Polish | pl-PL | P1 |
| Russian | ru-RU | P1 |
| Turkish | tr-TR | P2 |
| Thai | th-TH | P2 |
| Indonesian | id-ID | P2 |
| Simplified Chinese | zh-CN | P2 |
| Japanese | ja-JP | P3 |
| Korean | ko-KR | P3 |

### 18.2 Localization Requirements

- **String-externalized:** All UI text stored in JSON locale files; no hardcoded strings
- **Right-to-Left (RTL):** UI must support RTL layout for future Arabic/Hebrew additions
- **Pluralization:** Use ICU message format for pluralization rules (different per language)
- **Date/Time:** Localized formats; all times stored as UTC, displayed in local timezone
- **Numbers:** Locale-specific number formatting (decimal/thousands separators)
- **Currency:** All prices displayed in local currency where supported (with Stripe/payment provider support)
- **Font Support:** Font stack must support CJK characters, Cyrillic, Thai, Arabic

### 18.3 Voice Localization

- Voice lines localized in English (launch)
- Portuguese, Spanish added in first localization wave (2 months post-launch)
- Community translation program for additional languages (credited contributors)

---

## 19. Testing Strategy

### 19.1 Testing Levels

#### Unit Tests
- Coverage target: **80%+** for all game logic, utility functions, and state management
- Tools: Vitest (client), Go testing (server)
- Auto-run on every commit via CI/CD pipeline
- Focus areas: Damage calculation, ability effects, collision detection, matchmaking algorithm, auth logic

#### Integration Tests
- API endpoint testing: all REST endpoints tested with realistic payloads
- WebSocket protocol testing: message serialization/deserialization, reconnection logic
- Database query testing: all complex queries tested against a test database
- Tools: Supertest (API), custom WebSocket test harness

#### End-to-End Tests
- Full user flows automated:
  - Register → Onboard → Play Match → View Results → Upgrade Brawler
  - Purchase Gems → Buy Battle Pass → Claim Tier
  - Create Clan → Invite Friend → Clan Match
- Tools: Playwright (browser automation)
- Run nightly on staging environment

#### Performance Tests
- Load testing: simulate 10,000 concurrent WebSocket connections
- Stress testing: push to failure point; identify breakage threshold
- Frame rate profiling: automated FPS benchmarks on reference devices
- Tools: k6 (load), Chrome DevTools headless (FPS), custom game bot clients

#### Game Balance Testing
- Automated simulation: bots using random strategies play 10,000 matches
- Win rate analysis per Brawler per mode (target: within ±10% of 50% win rate for each Brawler)
- Statistical significance testing for balance patches

### 19.2 QA Process

**Bug Severity Levels:**

| Severity | Description | SLA (Fix Time) |
|----------|-------------|----------------|
| P0 — Critical | Game-breaking, server down, data loss | 2 hours |
| P1 — High | Major feature broken, widespread gameplay impact | 24 hours |
| P2 — Medium | Feature partially broken, workaround exists | 72 hours |
| P3 — Low | Minor visual/audio glitch, cosmetic issue | Next sprint |
| P4 — Trivial | Typo, minor UI misalignment | Backlog |

**Release QA Checklist:**
- [ ] All P0 and P1 bugs resolved
- [ ] Unit test coverage ≥ 80%
- [ ] All E2E test suites passing
- [ ] Performance benchmarks met on minimum spec device
- [ ] Localization strings complete for all launch languages
- [ ] Payment flows tested in sandbox (Stripe test mode)
- [ ] Security scan (OWASP ZAP) completed
- [ ] Accessibility audit (axe-core) completed
- [ ] GDPR consent flows verified
- [ ] Server load test completed (sustained 10,000 CCU for 30 minutes)

### 19.3 Beta Testing Plan

**Phase 1 — Internal Alpha (Month 4):**
- 50 internal testers (employees + QA)
- All game modes functional but content-incomplete
- Focus: core gameplay loop, bugs, performance

**Phase 2 — Closed Beta (Month 5):**
- 5,000 selected external testers (Discord community, content creators)
- NDA required
- Focus: balance, onboarding, social features, matchmaking
- Weekly patch cadence

**Phase 3 — Open Beta (Month 6):**
- Public access; no invite required
- Progress may be wiped at launch (communicated clearly)
- Focus: server load, payment system, global latency
- Bi-weekly patch cadence

---

## 20. Milestones & Roadmap

### 20.1 Development Phases

#### Phase 0 — Foundation (Weeks 1–4)
**Goal:** Tech foundation and proof-of-concept
- [ ] Project scaffolding (monorepo, Vite, TypeScript, Phaser 3)
- [ ] Basic WebSocket server (Go or Node.js)
- [ ] One Brawler (Vex) playable with basic movement and attack
- [ ] One map with basic tile collision
- [ ] 2-player local synchronization working over WebSocket
- [ ] Basic lobby screen
- [ ] CI/CD pipeline set up (GitHub Actions)

**Deliverable:** One Brawler moving around one map, two browser tabs synced over WebSocket

---

#### Phase 1 — Core Gameplay (Weeks 5–10)
**Goal:** Complete gameplay loop for one mode
- [ ] All core movement and combat mechanics
- [ ] Gem Grab mode fully implemented
- [ ] 2 maps for Gem Grab
- [ ] Basic matchmaking (2-team, 3v3 lobby)
- [ ] 3 Brawlers fully implemented
- [ ] HUD complete for Gem Grab
- [ ] Respawn system
- [ ] Post-match results screen
- [ ] Basic collision and fog of war
- [ ] Audio: core SFX for 3 Brawlers + music

**Deliverable:** Playable Gem Grab match from start to finish with 3 Brawlers

---

#### Phase 2 — Content Expansion (Weeks 11–16)
**Goal:** All launch modes and Brawlers
- [ ] Showdown, Bounty, and Heist modes implemented
- [ ] All 12 launch Brawlers implemented with animations, SFX, and balance pass
- [ ] 8 maps per mode (32 maps total)
- [ ] Map rotation system
- [ ] Vision/bush system fully implemented
- [ ] Particle effects for all Brawlers
- [ ] Super abilities for all Brawlers

**Deliverable:** All launch content playable; internal alpha ready

---

#### Phase 3 — Progression & Accounts (Weeks 17–22)
**Goal:** Retention and account systems
- [ ] Full account registration/login (email + OAuth)
- [ ] Player profile system
- [ ] Trophy system per Brawler
- [ ] Trophy Road (all milestones)
- [ ] Brawler upgrade system (Power Levels, Power Points, Gold)
- [ ] Star Powers and Gadgets unlock system
- [ ] Brawl Box system (with pity counter)
- [ ] Daily/Weekly quests
- [ ] Battle Pass (Season 1 structure)
- [ ] Basic shop (Gem purchases)
- [ ] Basic clan system

**Deliverable:** Complete progression loop; closed beta ready

---

#### Phase 4 — Polish & Monetization (Weeks 23–26)
**Goal:** Monetization, UX polish, and performance
- [ ] Full shop with all offer types
- [ ] Payment integration (Stripe)
- [ ] Battle Pass premium tier with all rewards
- [ ] Skin system (3+ skins per Brawler)
- [ ] Cosmetics (profile icons, sprays, pins)
- [ ] PWA setup (service worker, manifest)
- [ ] Full localization (all launch languages)
- [ ] Accessibility features (colorblind mode, aim assist, key rebinding)
- [ ] Comprehensive onboarding tutorial
- [ ] Bot AI (for fill slots and practice mode)

**Deliverable:** Feature-complete build; open beta ready

---

#### Phase 5 — Launch Readiness (Weeks 27–28)
**Goal:** Server infrastructure, security, and launch
- [ ] Load testing: 10,000 CCU sustained
- [ ] Security audit and penetration testing
- [ ] All P0/P1 bugs resolved from open beta
- [ ] Analytics instrumentation complete
- [ ] Payment compliance (PCI DSS via Stripe)
- [ ] Legal pages (Terms of Service, Privacy Policy)
- [ ] Marketing landing page live
- [ ] Press kit and creator kit ready

**Deliverable:** 🚀 Public Launch (v1.0)

---

### 20.2 Post-Launch Roadmap

| Version | Target Date | Major Features |
|---------|------------|----------------|
| v1.1 | Month 3 | Ranked Mode, Season 2 Battle Pass, 4 new Brawlers |
| v1.2 | Month 5 | Brawl Ball mode, Hot Zone mode, Spectator Mode |
| v1.3 | Month 7 | Siege mode, Replay System, 6 new Brawlers, Clan Wars |
| v1.4 | Month 9 | Knockout mode, Custom Rooms, Tournament System |
| v1.5 | Month 12 | Boss Fight PvE mode, 8 new Brawlers, Map Maker (community beta) |

---

## 21. Risk Assessment

### 21.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| WebSocket server can't handle 10K CCU at launch | Medium | High | Load test early (Phase 2); architect for horizontal scaling; use Redis pub/sub for game state distribution |
| Phaser 3 performance insufficient on mobile | Medium | High | Benchmark early (Phase 1); have PixiJS migration plan ready; implement LOD system |
| Client-side prediction causes excessive rubber-banding | Medium | Medium | Tune server tick rate; implement smooth reconciliation; extensive latency simulation testing |
| WebGL not supported on target browser | Low | Medium | Canvas 2D fallback renderer; test on minimum spec devices early |
| Memory leaks in long browser sessions | Medium | Medium | Automated memory profiling in CI; strict object pooling for particles and projectiles |
| WebAudio context suspended (browser policy) | Medium | Low | User interaction to resume audio context; graceful silent fallback |

### 21.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Supercell sends DMCA / trademark claim | Medium | Critical | Legal review of all Brawler designs, names, and UI for similarity; design sufficiently distinct characters; no use of "Brawl Stars" name in marketing |
| Poor D7 retention (< 15%) | Medium | High | A/B test onboarding flows; focus core loop on engagement from Phase 1; early community building |
| Payment processor rejection (Stripe issues with gaming) | Low | High | Secondary processor backup (Paddle); clear ToS; ESRB/PEGI rating |
| Server costs exceed revenue in early months | High | Medium | Start with serverless/spot instances; scale with revenue; consider player-count caps during early access |
| Content creator adoption failure | Medium | Medium | Creator program from day 1; custom stream overlays; clip-sharing features; spectator API |

### 21.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Cheat injection (memory editors, speed hacks) | High | High | Authoritative server makes client cheating ineffective; anomaly detection |
| DDoS against WebSocket server | Medium | High | DDoS protection at network level (Cloudflare); rate limiting; connection throttling |
| SQL injection | Low | Critical | Parameterized queries everywhere; SAST scanning in CI |
| Account takeover | Medium | High | Rate limiting on auth; 2FA option; breach detection; anomaly alerting |
| Financial fraud (stolen credit cards) | Medium | High | Stripe Radar fraud detection; velocity checks; manual review for large purchases |

### 21.4 Mitigation Priority Matrix

**Immediate Action Required:**
- Legal review of character designs (pre-alpha)
- Load testing infrastructure (Phase 2)
- Authoritative server architecture (Phase 1 — foundational)
- GDPR/COPPA compliance (Phase 3)

**Monitor Closely:**
- D7 retention from closed beta data
- Server costs vs. player count growth curve
- Mobile performance across device tiers

**Contingency Plans:**
- If Phaser 3 fails: PixiJS migration guide pre-written
- If Stripe rejects: Paddle integration tested in staging
- If CCU exceeds capacity: Player queue with wait times; transparent communication

---

## 22. Appendices

### Appendix A: Technology Decision Log

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| Game Engine | Phaser 3, PixiJS, Three.js, Unity WebGL | Phaser 3 | Best balance of features, documentation, and launch velocity for 2D top-down genre |
| Backend Language | Node.js, Go, Rust | Go (game server) + Node.js (API) | Go's goroutines ideal for concurrent game rooms; Node.js ecosystem for API |
| Database | PostgreSQL, MySQL, MongoDB | PostgreSQL | ACID compliance, JSONB for flexible data, strong ecosystem |
| Cache/Session | Redis, Memcached, DynamoDB | Redis | Pub/sub for game state, sorted sets for matchmaking, persistent sessions |
| UI Framework | React, Svelte, Vue | Svelte | Smallest bundle size, fast render, no virtual DOM overhead |
| Real-time Protocol | WebSocket, WebRTC, HTTP/SSE | WebSocket | Bidirectional, low latency, universal browser support, simpler than WebRTC for this use case |
| Analytics | Mixpanel, Amplitude, PostHog | PostHog (self-hosted) | GDPR-friendly, self-hosted = data ownership, open source |
| Payments | Stripe, PayPal, Paddle | Stripe (primary) | Best developer experience, fraud tools, global coverage |

---

### Appendix B: Map Design Guidelines

**Balance Principles:**
1. Maps must be horizontally symmetric (or rotationally symmetric) — no team has a geographic advantage
2. Each team must have at least 2 approach routes to the center objective
3. Bushes should not allow camping of spawn points
4. No map should have a choke point that a single Brawler can hold indefinitely
5. Breakable walls should provide strategic variety without being exploitable
6. Healing pads (if present) must be equidistant from both teams

**Map Review Checklist:**
- [ ] Symmetric layout verified
- [ ] Multiple approach paths to objective
- [ ] No spawn-camp-enabling bushes
- [ ] Choke points have counter-routes
- [ ] Tested with all 12 Brawlers for balance
- [ ] Bot AI can navigate all sections
- [ ] Visual clarity: no tile confusion (walkable vs. solid)

---

### Appendix C: Brawler Design Template

Use this template when designing new Brawlers post-launch:

```
Name:
Theme:
Visual Description:
Rarity:
Playstyle Summary (1 sentence):

STATS:
- Health:
- Movement Speed: (Slow/Normal/Fast/Very Fast)
- Attack Range: (X tiles)
- Attack Type:
- Damage:
- Ammo Charges:
- Reload Speed:

MAIN ATTACK:
Name:
Description:
Projectile type: (bullet/area/beam/melee)
Pierces walls: Y/N
AoE radius (if applicable):

SUPER:
Name:
Charge requirement: (X attacks worth of damage dealt)
Description:
Duration:
Cooldown (if any):

STAR POWER 1:
Name:
Unlock requirement: Power Level 9
Description:

STAR POWER 2:
Name:
Unlock requirement: Power Level 10
Description:

GADGET:
Name:
Unlock requirement: Power Level 7
Uses per match:
Description:

COUNTERS:
- Strong against: [Brawler types/styles]
- Weak against: [Brawler types/styles]
- Best in mode: [Mode name]

NARRATIVE BACKGROUND (flavor text):
```

---

### Appendix D: API Rate Limiting Policy

| Endpoint Category | Rate Limit |
|------------------|-----------|
| Auth endpoints (login, register) | 5 requests/minute per IP |
| Player profile reads | 60 requests/minute per user |
| Shop purchase | 10 requests/minute per user |
| Match queue | 30 requests/minute per user |
| Leaderboard | 30 requests/minute per IP |
| WebSocket connections | 1 active connection per user |

---

### Appendix E: Server Infrastructure Specifications (Launch)

**Cloud Provider:** AWS (primary region: us-east-1; secondary: eu-west-1, ap-southeast-1)

| Service | Instance Type | Count | Purpose |
|---------|--------------|-------|---------|
| API Server | ECS Fargate (2 vCPU, 4GB) | 3 (auto-scaling to 20) | REST API |
| Game Server | EC2 c6g.xlarge (4 vCPU, 8GB) | 5 (auto-scaling to 50) | Game rooms |
| Matchmaking | ECS Fargate (1 vCPU, 2GB) | 2 | Match creation |
| PostgreSQL | RDS db.r6g.large (multi-AZ) | 1 primary + 1 read replica | Player data |
| Redis | ElastiCache r6g.large (cluster) | 3 nodes | Sessions, game state |
| ClickHouse | EC2 r6g.2xlarge | 1 | Analytics |
| CDN | CloudFront | — | Asset delivery |
| Load Balancer | ALB (WebSocket-capable) | Per region | Traffic distribution |

**Estimated Monthly Cost (Launch):** $3,500–$5,500/month (scales with CCU)

---

### Appendix F: Glossary

| Term | Definition |
|------|-----------|
| Brawler | A playable character with unique stats and abilities |
| Super | Each Brawler's charged special ability |
| Gadget | A consumable special action (limited uses per match) |
| Star Power | A passive upgrade unlocked at high Power Levels |
| Power Level | Brawler upgrade tier (1–10) |
| Power Points | Per-Brawler upgrade material |
| Gold | Soft currency used for upgrades |
| Gems | Premium hard currency |
| Brawl Box | A randomized reward container |
| Trophy Road | The global progression track based on total trophies |
| Trophies | Performance-based ranking metric per Brawler |
| Bush | A tile type that hides Brawlers from enemies |
| Fog of War | Visual obscuring of areas outside a Brawler's vision radius |
| CCU | Concurrent Connected Users |
| DAU | Daily Active Users |
| MAU | Monthly Active Users |
| ARPU | Average Revenue Per User |
| ARPPU | Average Revenue Per Paying User |
| D1/D7/D30 | Day 1/7/30 retention rates |
| PWA | Progressive Web App |
| RTT | Round-Trip Time (network latency metric) |
| Tick Rate | How many times per second the game server updates state |
| Client-Side Prediction | Technique where client simulates actions before server confirms |
| Server Reconciliation | Correcting client state to match authoritative server state |
| Delta Update | Network packet containing only changed state, not full state |
| Authoritative Server | Server that has final say on all game outcomes (prevents cheating) |

---

*End of Document*

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01 | [Author] | Initial draft |
| 0.2 | 2025-01 | [Author] | Added monetization ethics section, expanded Brawler designs |
| 1.0 | 2025-01 | [Author] | Full PRD complete; ready for team review |

**Next Review Date:** 30 days post-alpha launch

**Approvals Required Before Development Begins:**
- [ ] Engineering Lead sign-off on technical architecture
- [ ] Legal review of character IP and monetization model
- [ ] Product Owner final approval
- [ ] Executive sponsor approval for budget
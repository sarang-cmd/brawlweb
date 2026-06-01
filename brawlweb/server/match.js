// Match controller — one instance per active game room.
// Owns the world simulation (PRD § 8.3.1).

import { TICK_RATE, TICK_MS } from '../shared/protocol.js';
import { BRAWLERS, applyPowerLevel } from '../shared/brawlers.js';
import { MODES, trophyChange } from '../shared/modes/index.js';
import { ALL_MAPS } from '../shared/maps/index.js';
import {
  TILE, tileAt, setTile, resolveMove, inBush, blocksBullet, hasLineOfSight,
} from '../shared/map.js';
import { fireAttack, fireSuper, fireGadget, damagePlayer, damageDeployed } from './abilities.js';

let _matchSeq = 1;
const FIRE_COOLDOWN_BASE_MS = 250;

export class Match {
  constructor(modeId, mapId, participants /* [{playerId, brawlerId, powerLevel, isBot, displayName, team}] */) {
    this.id = 'm' + (_matchSeq++);
    this.mode = MODES[modeId];
    // Deep-copy map (so mutations like breakable walls don't leak across matches)
    const baseMap = ALL_MAPS[mapId];
    this.map = {
      ...baseMap,
      tiles: baseMap.tiles.map(r => [...r]),
      meta: JSON.parse(JSON.stringify(baseMap.meta || {})),
    };
    this.players = new Map();      // sessionId -> playerState
    this.bots = [];                // bot ids
    this.projectiles = new Map();  // id -> projectile
    this.effects = [];             // AoE fields, trails, etc.
    this.deployed = [];            // turrets, walls
    this.tempWalls = [];           // breakable walls placed by gadgets
    this.events = [];              // hit/death/pickup events for this tick
    this.scheduled = [];           // [{at, fn}] for delayed actions (multi-burst attacks)
    this.gems = [];                // {x,y} dropped gems / mine output
    this.startedAt = Date.now();
    this.tick = 0;
    this.lastTick = Date.now();
    this.ended = false;
    this.result = null;            // populated when match ends
    this.modeState = this._initModeState();
    this.spectatorIds = new Set();

    // Build player states
    for (const p of participants) {
      const baseB = BRAWLERS[p.brawlerId];
      const b = applyPowerLevel(baseB, p.powerLevel || 1);
      const spawn = this._pickSpawn(p.team);
      this.players.set(p.playerId, {
        id: p.playerId,
        team: p.team,
        isBot: !!p.isBot,
        brawlerId: p.brawlerId,
        brawler: b,                 // upgraded stats snapshot
        displayName: p.displayName || p.brawlerId,
        x: spawn.x, y: spawn.y,
        aim: 0,
        hp: b.health, hpMax: b.health,
        ammo: b.ammoMax,
        ammoRegenAt: 0,
        superCharge: 0,
        superMax: b.superRequiredDamage,
        alive: true,
        respawnAt: 0, diedAt: 0,
        lastFireAt: 0,
        lastInput: null,
        lastInputSeq: 0,
        buffs: {},
        kills: 0, deaths: 0, damageDealt: 0,
        // Mode-specific accumulators:
        gemsHeld: 0,
        stars: this.mode.id === 'bounty' ? (this.mode.startingStars || 0) : 0,
        cubes: 0,
        invulnerableUntil: Date.now() + 1500,    // brief spawn protection
      });
    }
  }

  _pickSpawn(team) {
    if (this.mode.id === 'showdown') {
      // For showdown, distribute solo spawns
      const pool = this.map.spawnPoints.solo;
      const idx = this.players.size % pool.length;
      return pool[idx];
    }
    const list = this.map.spawnPoints['team' + team] || [{x:5,y:5}];
    const idx = [...this.players.values()].filter(p => p.team === team).length % list.length;
    return list[idx];
  }

  _initModeState() {
    const s = { winnerTeam: null, winnerPlayerId: null };
    if (this.mode.id === 'gem_grab') {
      s.teamGems = { 1: 0, 2: 0 };
      s.countdownTeam = null;
      s.countdownEndsAt = null;
      s.nextGemAt = Date.now() + this.mode.gemMineRespawnMs;
    } else if (this.mode.id === 'heist') {
      s.safes = {
        1: { x: this.map.meta.safes.team1.x + 0.5, y: this.map.meta.safes.team1.y + 0.5, hp: this.mode.safeHp, hpMax: this.mode.safeHp },
        2: { x: this.map.meta.safes.team2.x + 0.5, y: this.map.meta.safes.team2.y + 0.5, hp: this.mode.safeHp, hpMax: this.mode.safeHp },
      };
    } else if (this.mode.id === 'showdown') {
      s.poisonStart = Date.now() + this.mode.poisonStartMs;
      s.poisonRadius = Math.max(this.map.width, this.map.height) / 2;
      s.cx = this.map.width / 2;
      s.cy = this.map.height / 2;
      s.cubes = [...this.map.meta.powerBoxes.map(p => ({...p, picked: false}))];
    }
    return s;
  }

  applyInput(playerId, input) {
    const p = this.players.get(playerId);
    if (!p) return;
    p.lastInput = {
      moveX: clamp(+input.moveX || 0, -1, 1),
      moveY: clamp(+input.moveY || 0, -1, 1),
      aim: typeof input.aim === 'number' ? input.aim : p.aim,
      attack: !!input.attack,
      super: !!input.super,
      gadget: !!input.gadget,
    };
    p.lastInputSeq = input.seq | 0;
  }

  step(now) {
    if (this.ended) return;
    const dt = Math.min(0.1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    this.events.length = 0;

    // Run any scheduled actions due now
    if (this.scheduled.length) {
      const due = this.scheduled.filter(s => s.at <= now);
      for (const s of due) s.fn();
      this.scheduled = this.scheduled.filter(s => s.at > now);
    }

    this._stepPlayers(now, dt);
    this._stepProjectiles(now, dt);
    this._stepEffects(now, dt);
    this._stepDeployed(now, dt);
    this._stepTempWalls(now);
    this._stepMode(now, dt);
    this._checkEndConditions(now);

    this.tick++;
  }

  _stepPlayers(now, dt) {
    for (const p of this.players.values()) {
      // Tick down buffs
      for (const k of Object.keys(p.buffs)) {
        if (p.buffs[k].expiresAt <= now) delete p.buffs[k];
      }
      if (p.invulnerableUntil && now > p.invulnerableUntil) p.invulnerableUntil = 0;
      if (p.dashUntil && now > p.dashUntil) {
        p.dashUntil = 0;
        p.dashTo = null; p.dashHits = null;
      }

      // Decoy follows
      if (p.decoy && p.decoy.expiresAt <= now) p.decoy = null;

      if (!p.alive) {
        if (this.mode.respawnMs && now >= p.respawnAt) {
          // Drop gems/stars on death already happened; respawn fresh
          const spawn = this._pickSpawn(p.team);
          p.x = spawn.x; p.y = spawn.y;
          p.hp = p.hpMax;
          p.ammo = p.brawler.ammoMax;
          p.alive = true;
          p.buffs = {};
          p.invulnerableUntil = now + 1500;
          p.gemsHeld = 0;
          p.superCharge = Math.min(p.superMax, p.superCharge * 0.5);    // keep half super
          if (this.mode.id === 'bounty') p.stars = this.mode.startingStars;
        }
        continue;
      }

      // Ammo regen
      if (p.ammo < p.brawler.ammoMax && now >= p.ammoRegenAt) {
        p.ammo++;
        const rm = p.buffs.reloadBoost ? p.brawler.reloadMs * p.buffs.reloadBoost.mul : p.brawler.reloadMs;
        p.ammoRegenAt = now + rm;
      }

      // Dash movement override
      if (p.dashUntil && now < p.dashUntil) {
        const total = p.dashUntil - p.dashStartedAt;
        const elapsed = now - p.dashStartedAt;
        const t = Math.min(1, elapsed / total);
        p.x = p.dashFrom.x + (p.dashTo.x - p.dashFrom.x) * t;
        p.y = p.dashFrom.y + (p.dashTo.y - p.dashFrom.y) * t;
        // Damage along dash path
        if (p.dashDamage && p.dashHits) {
          for (const target of this.players.values()) {
            if (target.team === p.team || !target.alive || p.dashHits.has(target.id)) continue;
            const d = Math.hypot(target.x - p.x, target.y - p.y);
            if (d <= (p.dashWidth || 0.7) + (target.brawler.radius || 0.4)) {
              damagePlayer(this, target, p.dashDamage, p, now);
              p.dashHits.add(target.id);
              p.kills += target.alive ? 0 : 1;
            }
          }
        }
        continue;  // skip normal movement during dash
      }

      const inp = p.lastInput;

      // Bot AI fills lastInput if no input
      if (p.isBot && !inp) {
        p.lastInput = this._botThink(p, now);
      }

      if (!p.lastInput) continue;
      const li = p.lastInput;

      // Stun / Fear handling
      let canAct = true;
      if (p.buffs.stun && p.buffs.stun.expiresAt > now) canAct = false;
      if (p.buffs.fear && p.buffs.fear.expiresAt > now) {
        // Override movement to flee from fear source
        const dx = p.x - p.buffs.fear.fromX;
        const dy = p.y - p.buffs.fear.fromY;
        const mag = Math.hypot(dx, dy) || 1;
        li.moveX = dx / mag; li.moveY = dy / mag;
        li.attack = false; li.super = false; li.gadget = false;
      }

      // Movement
      let mx = li.moveX || 0, my = li.moveY || 0;
      const mag = Math.hypot(mx, my);
      if (mag > 1) { mx /= mag; my /= mag; }
      let speed = p.brawler.moveSpeed;
      if (p.buffs.speedBoost) speed *= p.buffs.speedBoost.mul;
      if (inBush(this.map, p.x, p.y)) speed *= 0.8;

      if (canAct) {
        const np = resolveMove(this.map, p.x, p.y, mx * speed * dt, my * speed * dt, p.brawler.radius);
        p.x = np.x; p.y = np.y;
        if (typeof li.aim === 'number') p.aim = li.aim;
      }

      // Update decoy to mimic
      if (p.decoy) {
        p.decoy.x = p.x; p.decoy.y = p.y; p.decoy.aim = p.aim;
      }

      // Contact damage (e.g., Drift Nitro Boost)
      if (p.buffs.contactDamage && canAct) {
        for (const target of this.players.values()) {
          if (target.team === p.team || !target.alive) continue;
          if (p.buffs.contactDamage.hits.has(target.id)) continue;
          const d = Math.hypot(target.x - p.x, target.y - p.y);
          if (d < 0.8) {
            damagePlayer(this, target, p.buffs.contactDamage.damage, p, now);
            p.buffs.contactDamage.hits.add(target.id);
          }
        }
      }

      // Pick up gems (Gem Grab)
      if (this.mode.id === 'gem_grab') {
        for (let i = this.gems.length - 1; i >= 0; i--) {
          const g = this.gems[i];
          if (Math.hypot(g.x - p.x, g.y - p.y) < 0.7) {
            p.gemsHeld++;
            this.gems.splice(i, 1);
            this.events.push({ type: 'gem_pickup', playerId: p.id });
          }
        }
      }
      // Pick up power cubes (Showdown)
      if (this.mode.id === 'showdown') {
        for (const c of this.modeState.cubes) {
          if (c.picked) continue;
          if (Math.hypot(c.x - p.x, c.y - p.y) < 0.7) {
            c.picked = true;
            p.cubes++;
            // Permanent HP and damage buff (rebuild stats)
            p.hpMax = Math.round(p.hpMax + this.mode.powerCubeHpBonus);
            p.hp = Math.min(p.hpMax, p.hp + this.mode.powerCubeHpBonus);
            // We don't rebuild brawler stats; we apply damage mult via buff
            p.buffs.cubeBoost = { expiresAt: Date.now() + 3600_000, mul: 1 + this.mode.powerCubeDamageMult * p.cubes };
            this.events.push({ type: 'cube_pickup', playerId: p.id });
          }
        }
      }
      // Damage enemy safe by walking up + attacking (Heist) — handled via projectile collision

      const fireCooldown = p.brawler.fireCooldownMs || FIRE_COOLDOWN_BASE_MS;
      if (li.attack && canAct && p.ammo > 0 && now - p.lastFireAt >= fireCooldown) {
        fireAttack(this, p, p.brawler, now);
        p.ammo--;
        if (p.ammoRegenAt < now) {
          const rm = p.buffs.reloadBoost ? p.brawler.reloadMs * p.buffs.reloadBoost.mul : p.brawler.reloadMs;
          p.ammoRegenAt = now + rm;
        }
        p.lastFireAt = now;
      }
      if (li.super && canAct && p.superCharge >= p.superMax) {
        fireSuper(this, p, p.brawler, now);
        p.superCharge = 0;
      }
      if (li.gadget && canAct && (p.gadgetUses ?? p.brawler.gadget.uses) > 0) {
        p.gadgetUses = (p.gadgetUses ?? p.brawler.gadget.uses) - 1;
        fireGadget(this, p, p.brawler, now);
      }
    }
  }

  _stepProjectiles(now, dt) {
    for (const [id, pr] of this.projectiles) {
      // Homing
      if (pr.homing) {
        let nearest = null, ndist = Infinity;
        for (const t of this.players.values()) {
          if (t.team === pr.team || !t.alive) continue;
          const d = Math.hypot(t.x - pr.x, t.y - pr.y);
          if (d < pr.homing.seekRadius && d < ndist) { nearest = t; ndist = d; }
        }
        if (nearest) {
          const desiredAng = Math.atan2(nearest.y - pr.y, nearest.x - pr.x);
          const curAng = Math.atan2(pr.vy, pr.vx);
          let diff = desiredAng - curAng;
          while (diff > Math.PI) diff -= 2*Math.PI;
          while (diff < -Math.PI) diff += 2*Math.PI;
          const newAng = curAng + Math.sign(diff) * Math.min(Math.abs(diff), pr.homing.turnRate * dt);
          const sp = Math.hypot(pr.vx, pr.vy);
          pr.vx = Math.cos(newAng) * sp; pr.vy = Math.sin(newAng) * sp;
        }
      }

      const ox = pr.x, oy = pr.y;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      const moved = Math.hypot(pr.x - ox, pr.y - oy);
      pr.traveled += moved;

      // Sample wall collision
      let hitWall = false;
      const steps = Math.max(1, Math.ceil(moved / 0.25));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const px = ox + (pr.x - ox) * t;
        const py = oy + (pr.y - oy) * t;
        if (blocksBullet(this.map, px, py)) {
          // Walls take damage too (breakable)
          const tx = Math.floor(px), ty = Math.floor(py);
          if (tileAt(this.map, tx, ty) === TILE.BREAK) {
            // Treat breakable as 4000 HP — we use a map-keyed tracker
            this._damageBreakable(tx, ty, pr.damage, now);
          }
          pr.x = px; pr.y = py;
          hitWall = true;
          break;
        }
      }

      // Player collision
      let hitTarget = null;
      if (!hitWall) {
        for (const target of this.players.values()) {
          if (target.team === pr.team || !target.alive) continue;
          if (pr.piercing && pr._piercedIds && pr._piercedIds.has(target.id)) continue;
          if (target.buffs.invisibility) continue;   // invisible players can't be hit by projectiles? Lenient: still hittable but harder to aim
          const dd = Math.hypot(target.x - pr.x, target.y - pr.y);
          if (dd <= target.brawler.radius + pr.size) {
            hitTarget = target;
            break;
          }
        }
      }

      // Heist safe collision
      let hitSafe = null;
      if (this.mode.id === 'heist') {
        for (const teamN of [1, 2]) {
          if (teamN === pr.team) continue;   // can't damage own safe
          const s = this.modeState.safes[teamN];
          if (s.hp <= 0) continue;
          if (Math.hypot(s.x - pr.x, s.y - pr.y) < 0.8) {
            hitSafe = { team: teamN, safe: s };
            break;
          }
        }
      }

      // Out of range or wall hit → resolve
      if (hitWall || pr.traveled >= pr.range || hitTarget || hitSafe) {
        // Explode-on-impact
        if (pr.explodeRadius > 0) {
          this._explode(pr, pr.x, pr.y, now);
        }
        if (hitTarget && pr.explodeRadius === 0) {
          const dealt = damagePlayer(this, hitTarget, pr.damage, this.players.get(pr.ownerId), now);
          const attacker = this.players.get(pr.ownerId);
          if (attacker) attacker.damageDealt += dealt;
          // Chain to nearest
          if (pr.chainDamage && pr.chainsDone < pr.maxChains) {
            this._chainBolt(pr, hitTarget, now);
          }
        }
        if (hitSafe) {
          hitSafe.safe.hp = Math.max(0, hitSafe.safe.hp - pr.damage);
          this.events.push({ type: 'safe_hit', team: hitSafe.team, damage: pr.damage });
        }
        // Gravity orb effect
        if (pr.gravity) {
          for (const t of this.players.values()) {
            if (t.team === pr.team || !t.alive) continue;
            const dd = Math.hypot(t.x - pr.x, t.y - pr.y);
            if (dd <= pr.gravity.radius) {
              const ang = Math.atan2(pr.y - t.y, pr.x - t.x) * (pr.gravity.pull ? 1 : -1);
              const force = 1.2;
              const np = resolveMove(this.map, t.x, t.y, Math.cos(ang)*force, Math.sin(ang)*force, t.brawler.radius);
              t.x = np.x; t.y = np.y;
            }
          }
        }
        if (pr.piercing && hitTarget) {
          // Piercing: register the hit but keep going
          if (!pr._piercedIds) pr._piercedIds = new Set();
          pr._piercedIds.add(hitTarget.id);
          const dealt = damagePlayer(this, hitTarget, pr.damage, this.players.get(pr.ownerId), now);
          const attacker = this.players.get(pr.ownerId);
          if (attacker) attacker.damageDealt += dealt;
          if (!hitWall && pr.traveled < pr.range) continue;
        }
        this.projectiles.delete(id);
      }
    }
  }

  _chainBolt(pr, lastTarget, now) {
    let nearest = null, nd = Infinity;
    for (const t of this.players.values()) {
      if (t.team === pr.team || !t.alive) continue;
      if (t.id === lastTarget.id) continue;
      if (pr.chainedIds.includes(t.id)) continue;
      const d = Math.hypot(t.x - lastTarget.x, t.y - lastTarget.y);
      if (d < pr.chainRange && d < nd) { nearest = t; nd = d; }
    }
    if (nearest) {
      const dealt = damagePlayer(this, nearest, pr.chainDamage, this.players.get(pr.ownerId), now);
      pr.chainedIds.push(nearest.id);
      pr.chainsDone++;
      this.events.push({ type: 'chain', from: lastTarget.id, to: nearest.id });
      if (pr.chainsDone < pr.maxChains) this._chainBolt(pr, nearest, now);
    }
  }

  _explode(pr, x, y, now) {
    const attacker = this.players.get(pr.ownerId);
    for (const t of this.players.values()) {
      if (t.team === pr.team || !t.alive) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d <= pr.explodeRadius) {
        const dealt = damagePlayer(this, t, pr.splash || pr.damage, attacker, now);
        if (attacker) attacker.damageDealt += dealt;
      }
    }
    // Damage breakable walls in radius
    for (let ty = Math.floor(y - pr.explodeRadius); ty <= Math.ceil(y + pr.explodeRadius); ty++) {
      for (let tx = Math.floor(x - pr.explodeRadius); tx <= Math.ceil(x + pr.explodeRadius); tx++) {
        if (tileAt(this.map, tx, ty) === TILE.BREAK) {
          const d = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
          if (d <= pr.explodeRadius) this._damageBreakable(tx, ty, pr.splash || pr.damage, now);
        }
      }
    }
    this.events.push({ type: 'explosion', x, y, radius: pr.explodeRadius });
  }

  _damageBreakable(tx, ty, damage, now) {
    const key = tx + ',' + ty;
    if (!this._brkHp) this._brkHp = {};
    if (this._brkHp[key] == null) this._brkHp[key] = 4000;
    this._brkHp[key] -= damage;
    if (this._brkHp[key] <= 0) {
      setTile(this.map, tx, ty, TILE.FLOOR);
      this.events.push({ type: 'wall_destroyed', x: tx, y: ty });
      delete this._brkHp[key];
    }
  }

  _stepEffects(now, dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const ef = this.effects[i];
      if (ef.expiresAt <= now) {
        // Final pulse for singularity
        if (ef.kind === 'singularity' && ef.finalDamage) {
          const attacker = this.players.get(ef.owner);
          for (const t of this.players.values()) {
            if (t.team === ef.team || !t.alive) continue;
            const d = Math.hypot(t.x - ef.x, t.y - ef.y);
            if (d <= ef.radius * 0.4) damagePlayer(this, t, ef.finalDamage, attacker, now);
          }
          this.events.push({ type: 'explosion', x: ef.x, y: ef.y, radius: ef.radius * 0.4 });
        }
        this.effects.splice(i, 1);
        continue;
      }

      // If field follows owner (e.g. Blaze Inferno), update its position
      if (ef.followsOwner) {
        const owner = this.players.get(ef.owner);
        if (owner) { ef.x = owner.x; ef.y = owner.y; }
      }

      // Periodic tick (DoT, HoT, pull)
      if (ef.nextTick != null && now >= ef.nextTick) {
        ef.nextTick = now + 200;
        const attacker = this.players.get(ef.owner);
        if (ef.kind === 'aoe_field' || ef.kind === 'aoe_ring' || ef.kind === 'singularity') {
          for (const t of this.players.values()) {
            if (!t.alive) continue;
            const d = Math.hypot(t.x - ef.x, t.y - ef.y);
            if (d > ef.radius) continue;
            if (t.team !== ef.team && ef.dps) {
              damagePlayer(this, t, ef.dps * 0.2, attacker, now);
            }
            if (t.team === ef.team && ef.allyHps) {
              t.hp = Math.min(t.hpMax, t.hp + ef.allyHps * 0.2);
            }
            if (ef.kind === 'singularity' && t.team !== ef.team) {
              const ang = Math.atan2(ef.y - t.y, ef.x - t.x);
              const np = resolveMove(this.map, t.x, t.y, Math.cos(ang)*0.2, Math.sin(ang)*0.2, t.brawler.radius);
              t.x = np.x; t.y = np.y;
            }
            if (ef.kind === 'aoe_field' && ef.slowFactor && t.team !== ef.team) {
              t.buffs.slow = { expiresAt: now + 250, mul: ef.slowFactor };
              // Re-apply speed effect: easier to reduce moveSpeed via a buff each tick
              if (!t.buffs.speedBoost) t.buffs.speedBoost = { expiresAt: now + 250, mul: ef.slowFactor };
            }
          }
        }
        if (ef.kind === 'heal_field') {
          for (const ally of this.players.values()) {
            if (ally.team !== ef.team || !ally.alive) continue;
            const d = Math.hypot(ally.x - ef.x, ally.y - ef.y);
            if (d <= ef.radius) {
              ally.hp = Math.min(ally.hpMax, ally.hp + ef.hps * 0.2);
              if (ef.speedMul) ally.buffs.speedBoost = { expiresAt: now + 250, mul: ef.speedMul };
            }
          }
        }
        if (ef.kind === 'dot_trail') {
          for (const t of this.players.values()) {
            if (t.team === ef.team || !t.alive) continue;
            // distance to line segment
            const d = distToSegment(t.x, t.y, ef.x, ef.y, ef.toX, ef.toY);
            if (d <= 0.6) damagePlayer(this, t, ef.dps * 0.2, attacker, now);
          }
        }
        if (ef.kind === 'zero_g') {
          for (const t of this.players.values()) {
            if (t.team === ef.team || !t.alive) continue;
            const d = Math.hypot(t.x - ef.x, t.y - ef.y);
            if (d <= ef.radius) t.buffs.stun = { expiresAt: now + 250 };
          }
        }
      }
    }
  }

  _stepDeployed(now, dt) {
    for (let i = this.deployed.length - 1; i >= 0; i--) {
      const d = this.deployed[i];
      if (d.dead || d.expiresAt <= now) {
        this.deployed.splice(i, 1);
        continue;
      }
      if (d.kind === 'tesla' || d.kind === 'turret') {
        if (now >= d.nextFire) {
          // Find nearest enemy in range
          let nearest = null, nd = Infinity;
          for (const t of this.players.values()) {
            if (t.team === d.team || !t.alive) continue;
            const dist = Math.hypot(t.x - d.x, t.y - d.y);
            if (dist <= d.projectileRange && dist < nd && hasLineOfSight(this.map, d.x, d.y, t.x, t.y)) {
              nearest = t; nd = dist;
            }
          }
          if (nearest) {
            const ang = Math.atan2(nearest.y - d.y, nearest.x - d.x);
            const speed = 16;
            const fakeOwner = { id: d.owner, team: d.team };
            this.projectiles.set('dp'+(_matchSeq++), {
              id: 'dp'+Math.random().toString(36).slice(2,8),
              ownerId: d.owner, team: d.team,
              x: d.x, y: d.y, vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
              damage: d.projectileDamage, range: d.projectileRange, traveled: 0,
              size: 0.12, color: d.color,
              piercing: false, explodeRadius: 0,
              chainDamage: 0, chainRange: 0, maxChains: 0, chainsDone: 0, chainedIds: [],
              pulses: 1,
            });
            d.nextFire = now + d.firePeriodMs;
          } else {
            d.nextFire = now + 300;
          }
        }
      }
    }

    // Damage to deployed from projectiles (simplified — treat as small target)
    for (const d of this.deployed) {
      if (d.dead) continue;
      for (const [pid, pr] of this.projectiles) {
        if (pr.team === d.team) continue;
        if (Math.hypot(d.x - pr.x, d.y - pr.y) < 0.6) {
          damageDeployed(this, d, pr.damage, now);
          if (pr.explodeRadius > 0) this._explode(pr, pr.x, pr.y, now);
          this.projectiles.delete(pid);
        }
      }
    }
  }

  _stepTempWalls(now) {
    for (let i = this.tempWalls.length - 1; i >= 0; i--) {
      const w = this.tempWalls[i];
      if (w.expiresAt <= now) {
        if (tileAt(this.map, w.x, w.y) === TILE.BREAK) setTile(this.map, w.x, w.y, TILE.FLOOR);
        this.tempWalls.splice(i, 1);
      }
    }
  }

  _stepMode(now, dt) {
    if (this.mode.id === 'gem_grab') {
      // Spawn gems from mine
      if (now >= this.modeState.nextGemAt) {
        const g = this.map.meta.gemMine;
        this.gems.push({ x: g.x + 0.5 + (Math.random() - 0.5) * 0.6, y: g.y + 0.5 + (Math.random() - 0.5) * 0.6 });
        this.modeState.nextGemAt = now + this.mode.gemMineRespawnMs;
      }
      // Drop gems on death
      for (const ev of this.events) {
        if (ev.type === 'death') {
          const p = this.players.get(ev.targetId);
          if (p && p.gemsHeld > 0) {
            for (let i = 0; i < p.gemsHeld; i++) {
              this.gems.push({ x: p.x + (Math.random()-0.5)*0.8, y: p.y + (Math.random()-0.5)*0.8 });
            }
            p.gemsHeld = 0;
          }
        }
      }
      // Tally team gems
      const teamGems = { 1: 0, 2: 0 };
      for (const p of this.players.values()) teamGems[p.team] += p.gemsHeld;
      this.modeState.teamGems = teamGems;
      // Win countdown
      const lead = teamGems[1] >= this.mode.gemsToWin ? 1 : (teamGems[2] >= this.mode.gemsToWin ? 2 : null);
      if (lead && this.modeState.countdownTeam !== lead) {
        this.modeState.countdownTeam = lead;
        this.modeState.countdownEndsAt = now + this.mode.winCountdownMs;
      } else if (!lead) {
        this.modeState.countdownTeam = null;
        this.modeState.countdownEndsAt = null;
      }
      if (this.modeState.countdownEndsAt && now >= this.modeState.countdownEndsAt) {
        this.modeState.winnerTeam = this.modeState.countdownTeam;
        this._endMatch('win_countdown');
      }
    }

    if (this.mode.id === 'bounty') {
      // Transfer stars on kills
      for (const ev of this.events) {
        if (ev.type === 'death' && ev.killerId) {
          const victim = this.players.get(ev.targetId);
          const killer = this.players.get(ev.killerId);
          if (victim && killer) {
            const stolen = victim.stars;
            killer.stars = Math.min(this.mode.maxStars, killer.stars + 1);
            victim.stars = this.mode.startingStars;
          }
        }
      }
    }

    if (this.mode.id === 'heist') {
      if (this.modeState.safes[1].hp <= 0) {
        this.modeState.winnerTeam = 2; this._endMatch('safe_destroyed');
      } else if (this.modeState.safes[2].hp <= 0) {
        this.modeState.winnerTeam = 1; this._endMatch('safe_destroyed');
      }
    }

    if (this.mode.id === 'showdown') {
      // Poison cloud
      const ms = this.modeState;
      const elapsed = now - ms.poisonStart;
      if (elapsed > 0) {
        const maxRad = Math.max(this.map.width, this.map.height) / 2;
        const minRad = 2;
        ms.poisonRadius = Math.max(minRad, maxRad - (elapsed / this.mode.poisonShrinkMs) * (maxRad - minRad));
        for (const p of this.players.values()) {
          if (!p.alive) continue;
          const d = Math.hypot(p.x - ms.cx, p.y - ms.cy);
          if (d > ms.poisonRadius) {
            damagePlayer(this, p, this.mode.poisonDps * dt, null, now);
          }
        }
      }
      // Last alive wins
      const alive = [...this.players.values()].filter(p => p.alive);
      if (alive.length <= 1 && this.players.size > 1) {
        this.modeState.winnerPlayerId = alive[0] ? alive[0].id : null;
        this._endMatch('last_standing');
      }
    }
  }

  _checkEndConditions(now) {
    if (this.ended) return;
    if (now - this.startedAt >= this.mode.matchDurationMs) {
      // Time expired — declare winner by score
      if (this.mode.id === 'gem_grab') {
        const tg = this.modeState.teamGems;
        this.modeState.winnerTeam = tg[1] > tg[2] ? 1 : (tg[2] > tg[1] ? 2 : 0);
      } else if (this.mode.id === 'bounty') {
        const stars = { 1: 0, 2: 0 };
        for (const p of this.players.values()) stars[p.team] += p.stars;
        this.modeState.winnerTeam = stars[1] > stars[2] ? 1 : (stars[2] > stars[1] ? 2 : 0);
      } else if (this.mode.id === 'heist') {
        const dmg1 = this.modeState.safes[2].hpMax - this.modeState.safes[2].hp;
        const dmg2 = this.modeState.safes[1].hpMax - this.modeState.safes[1].hp;
        this.modeState.winnerTeam = dmg1 > dmg2 ? 1 : (dmg2 > dmg1 ? 2 : 0);
      } else if (this.mode.id === 'showdown') {
        const alive = [...this.players.values()].filter(p => p.alive);
        this.modeState.winnerPlayerId = alive.length ? alive[0].id : null;
      }
      this._endMatch('time');
    }
  }

  _endMatch(reason) {
    if (this.ended) return;
    this.ended = true;
    // Compute trophy deltas
    const placements = [];
    if (this.mode.id === 'showdown') {
      // Sort by time-of-death (alive = best)
      const sorted = [...this.players.values()].sort((a, b) => {
        if (a.alive !== b.alive) return a.alive ? -1 : 1;
        return (b.diedAt || 0) - (a.diedAt || 0);
      });
      sorted.forEach((p, i) => placements.push({ playerId: p.id, placement: i + 1 }));
    } else {
      for (const p of this.players.values()) {
        const win = (p.team === this.modeState.winnerTeam);
        placements.push({ playerId: p.id, placement: win ? 1 : 2 });
      }
    }
    const total = placements.length;
    this.result = {
      reason,
      winnerTeam: this.modeState.winnerTeam,
      winnerPlayerId: this.modeState.winnerPlayerId,
      participants: placements.map(pl => {
        const p = this.players.get(pl.playerId);
        return {
          playerId: p.id, brawlerId: p.brawlerId, team: p.team,
          isBot: p.isBot, displayName: p.displayName,
          placement: pl.placement,
          trophyChange: trophyChange(this.mode.id, pl.placement, total),
          kills: p.kills, deaths: p.deaths, damageDealt: p.damageDealt,
        };
      }),
    };
    this.events.push({ type: 'match_ended', result: this.result });
  }

  // ── Bot AI ─────────────────────────────────────────────────────────────
  _botThink(p, now) {
    // Very simple: find nearest enemy, move toward it if far, shoot if in range.
    let nearest = null, nd = Infinity;
    for (const t of this.players.values()) {
      if (t.id === p.id || !t.alive) continue;
      if (this.mode.id !== 'showdown' && t.team === p.team) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < nd) { nearest = t; nd = d; }
    }
    if (!nearest) return { moveX: 0, moveY: 0, aim: p.aim, attack: false, super: false, gadget: false };
    const dx = nearest.x - p.x, dy = nearest.y - p.y;
    const dist = Math.hypot(dx, dy);
    const aim = Math.atan2(dy, dx);
    const range = p.brawler.attackRange * 0.85;
    let mx = 0, my = 0;
    if (dist > range) { mx = dx / dist; my = dy / dist; }
    else if (dist < range * 0.5) { mx = -dx / dist; my = -dy / dist; }
    else {
      // Strafe perpendicular
      mx = -dy / dist; my = dx / dist;
      if (Math.floor(now / 1500) % 2) { mx = -mx; my = -my; }
    }
    const canSee = hasLineOfSight(this.map, p.x, p.y, nearest.x, nearest.y);
    return {
      moveX: mx, moveY: my, aim,
      attack: canSee && dist <= p.brawler.attackRange,
      super: canSee && p.superCharge >= p.superMax,
      gadget: false,
    };
  }

  // ── Network serialization ──────────────────────────────────────────────
  serializeState(forPlayerId) {
    const me = this.players.get(forPlayerId);
    return {
      type: 'state',
      tick: this.tick,
      serverTime: Date.now(),
      mode: this.mode.id,
      players: [...this.players.values()].map(p => {
        // Hide invisible enemies from non-allies (rough fog of war / vision)
        const hideAsInvisible = p.id !== forPlayerId
                              && me && p.team !== me.team
                              && p.buffs.invisibility;
        return {
          id: p.id,
          team: p.team,
          brawlerId: p.brawlerId,
          name: p.displayName,
          x: +p.x.toFixed(3), y: +p.y.toFixed(3), aim: +p.aim.toFixed(3),
          hp: p.hp, hpMax: p.hpMax,
          ammo: p.ammo, ammoMax: p.brawler.ammoMax,
          super: p.superCharge, superMax: p.superMax,
          alive: p.alive,
          respawnIn: p.alive ? 0 : Math.max(0, p.respawnAt - Date.now()),
          invisible: !!p.buffs.invisibility,
          inBush: inBush(this.map, p.x, p.y),
          hidden: !!hideAsInvisible,
          gemsHeld: p.gemsHeld || 0,
          stars: p.stars || 0,
          cubes: p.cubes || 0,
          lastInputSeq: p.lastInputSeq,
          gadgetUses: (p.gadgetUses ?? p.brawler.gadget.uses),
          buffs: Object.keys(p.buffs),
        };
      }).filter(p => !p.hidden),
      projectiles: [...this.projectiles.values()].map(pr => ({
        id: pr.id, x: +pr.x.toFixed(3), y: +pr.y.toFixed(3),
        vx: +pr.vx.toFixed(3), vy: +pr.vy.toFixed(3),
        size: pr.size, color: pr.color, ownerId: pr.ownerId,
      })),
      effects: this.effects.map(e => ({ ...e })),
      deployed: this.deployed.map(d => ({
        id: d.id, kind: d.kind, x: d.x, y: d.y, team: d.team,
        hp: d.hp, hpMax: d.hpMax, color: d.color,
      })),
      gems: this.gems.map(g => ({ x: +g.x.toFixed(2), y: +g.y.toFixed(2) })),
      events: this.events.map(e => ({ ...e })),
      modeState: this._publicModeState(),
      timeLeft: Math.max(0, this.mode.matchDurationMs - (Date.now() - this.startedAt)),
      tempWalls: this.tempWalls.map(w => ({ x: w.x, y: w.y })),
      mapTiles: this._mapDelta(),
      ended: this.ended,
      result: this.result,
    };
  }

  _publicModeState() {
    if (this.mode.id === 'gem_grab') {
      return {
        teamGems: this.modeState.teamGems,
        countdownTeam: this.modeState.countdownTeam,
        countdownLeft: this.modeState.countdownEndsAt ? Math.max(0, this.modeState.countdownEndsAt - Date.now()) : 0,
      };
    }
    if (this.mode.id === 'heist') {
      return {
        safes: {
          1: { x: this.modeState.safes[1].x, y: this.modeState.safes[1].y, hp: this.modeState.safes[1].hp, hpMax: this.modeState.safes[1].hpMax },
          2: { x: this.modeState.safes[2].x, y: this.modeState.safes[2].y, hp: this.modeState.safes[2].hp, hpMax: this.modeState.safes[2].hpMax },
        },
      };
    }
    if (this.mode.id === 'showdown') {
      return {
        poisonRadius: this.modeState.poisonRadius,
        cx: this.modeState.cx, cy: this.modeState.cy,
        cubes: this.modeState.cubes.filter(c => !c.picked),
        alive: [...this.players.values()].filter(p => p.alive).length,
      };
    }
    if (this.mode.id === 'bounty') {
      const stars = { 1: 0, 2: 0 };
      for (const p of this.players.values()) stars[p.team] += p.stars;
      return { teamStars: stars };
    }
    return {};
  }

  _mapDelta() {
    // Send full map tiles only at first state, then deltas. For simplicity, full each time
    // but compressed: just send the rows that contain any non-floor change.
    // For now ship full grid — it's tiny.
    return this.map.tiles;
  }
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx*dx + dy*dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t*dx), py - (y1 + t*dy));
}

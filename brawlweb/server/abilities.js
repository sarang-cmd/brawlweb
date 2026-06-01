// Ability handlers — dispatched by `kind` from brawler definition.
// Called from server/match.js inside the game loop.
//
// Each handler receives ({ match, player, brawler, now }) plus its own args.
// They mutate match.projectiles / match.effects / player state directly.

import { hasLineOfSight, blocksBullet, TILE, tileAt, setTile } from '../shared/map.js';

let _nextProjId = 1;
let _nextEffectId = 1;
const projId = () => 'p' + (_nextProjId++);
const effectId = () => 'e' + (_nextEffectId++);

// ─────────────────────────────────────────────────────────────────────────
// ATTACK HANDLERS
// ─────────────────────────────────────────────────────────────────────────

export function fireAttack(match, player, brawler, now) {
  const a = brawler.attack;
  const aim = player.aim;
  const cos = Math.cos(aim), sin = Math.sin(aim);

  switch (a.kind) {
    case 'projectile':
      spawnProjectile(match, player, { x: player.x + cos*0.5, y: player.y + sin*0.5,
        vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
        damage: a.damage, range: a.range || brawler.attackRange,
        size: a.bulletSize, color: brawler.color });
      break;

    case 'multi_projectile':
      // For Vex (2 parallel) and Shard (cone of 5)
      if (a.parallelSpacing) {
        // parallel bullets
        const perpX = -sin, perpY = cos;
        const half = a.parallelSpacing / 2;
        for (let i = 0; i < a.bullets; i++) {
          const off = a.bullets === 1 ? 0 : (-half + (i / (a.bullets - 1)) * a.parallelSpacing);
          spawnProjectile(match, player, {
            x: player.x + perpX*off + cos*0.5, y: player.y + perpY*off + sin*0.5,
            vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
            damage: a.damagePerBullet, range: brawler.attackRange,
            size: a.bulletSize, color: brawler.color,
          });
        }
      } else {
        // cone spread (shotgun)
        for (let i = 0; i < a.bullets; i++) {
          const t = (i / (a.bullets - 1) - 0.5) * 2;  // -1..1
          const angle = aim + t * a.spread;
          spawnProjectile(match, player, {
            x: player.x + Math.cos(angle)*0.5, y: player.y + Math.sin(angle)*0.5,
            vx: Math.cos(angle)*a.bulletSpeed, vy: Math.sin(angle)*a.bulletSpeed,
            damage: a.damagePerBullet, range: brawler.attackRange * (0.7 + Math.random()*0.3),
            size: a.bulletSize, color: brawler.color,
          });
        }
      }
      break;

    case 'piercing':
      spawnProjectile(match, player, {
        x: player.x + cos*0.5, y: player.y + sin*0.5,
        vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
        damage: a.damage, range: brawler.attackRange,
        size: a.bulletSize, color: brawler.color,
        piercing: true,
      });
      break;

    case 'aoe_burst':
      spawnProjectile(match, player, {
        x: player.x + cos*0.5, y: player.y + sin*0.5,
        vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
        damage: a.damage, range: brawler.attackRange,
        size: 0.22, color: brawler.color,
        explodeRadius: a.radius, splash: a.splash || a.damage,
        pulses: a.pulses || 1, pulseGapMs: a.pulseGapMs || 150,
      });
      break;

    case 'chain':
      spawnProjectile(match, player, {
        x: player.x + cos*0.5, y: player.y + sin*0.5,
        vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
        damage: a.damage, range: brawler.attackRange,
        size: a.bulletSize, color: brawler.color,
        chainDamage: a.chainDamage, chainRange: a.chainRange, maxChains: a.maxChains,
      });
      break;

    case 'dash_slash':
      // instant: damage all enemies along the dash line, move the player
      executeDashSlash(match, player, brawler, a, aim);
      break;

    case 'heal_beam':
      executeHealBeam(match, player, brawler, a, aim, now);
      break;

    case 'minigun_burst':
      // Schedule 3 bullets over a short window
      for (let i = 0; i < a.bullets; i++) {
        const t = now + i * a.burstGapMs;
        match.scheduled.push({ at: t, fn: () => {
          const jit = (Math.random() - 0.5) * a.spread;
          const ang = player.aim + jit;
          spawnProjectile(match, player, {
            x: player.x + Math.cos(ang)*0.5, y: player.y + Math.sin(ang)*0.5,
            vx: Math.cos(ang)*a.bulletSpeed, vy: Math.sin(ang)*a.bulletSpeed,
            damage: a.damagePerBullet, range: brawler.attackRange,
            size: a.bulletSize, color: brawler.color,
          });
        }});
      }
      break;

    case 'gravity_orb':
      spawnProjectile(match, player, {
        x: player.x + cos*0.5, y: player.y + sin*0.5,
        vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
        damage: a.damage, range: brawler.attackRange,
        size: a.bulletSize, color: brawler.color,
        gravity: { radius: a.radius, pull: a.pull !== false },
      });
      break;

    case 'homing':
      spawnProjectile(match, player, {
        x: player.x + cos*0.5, y: player.y + sin*0.5,
        vx: cos*a.bulletSpeed, vy: sin*a.bulletSpeed,
        damage: a.damage, range: brawler.attackRange,
        size: a.bulletSize, color: brawler.color,
        homing: { seekRadius: a.seekRadius, turnRate: 5.0 },
      });
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// SUPER HANDLERS
// ─────────────────────────────────────────────────────────────────────────

export function fireSuper(match, player, brawler, now) {
  const s = brawler.super;
  const aim = player.aim;
  const cos = Math.cos(aim), sin = Math.sin(aim);

  switch (s.kind) {
    case 'dash_charge': {
      // Shard's Boulder Roll — invulnerable forward dash
      const dest = findDashDestination(match, player, brawler, s.distance, aim);
      player.dashUntil = now + (s.distance / s.speed) * 1000;
      player.dashTo = { x: dest.x, y: dest.y };
      player.dashFrom = { x: player.x, y: player.y };
      player.dashStartedAt = now;
      player.invulnerableUntil = s.invulnerable ? (player.dashUntil + 100) : 0;
      player.dashDamage = s.damage;
      player.dashWidth = s.width;
      player.dashKnockback = s.knockback;
      player.dashHits = new Set();
      match.effects.push({
        id: effectId(), kind: 'dash_trail', owner: player.id,
        x: player.x, y: player.y,
        toX: dest.x, toY: dest.y,
        color: brawler.accent, expiresAt: now + 600,
      });
      break;
    }

    case 'speed_boost': {
      // Vex's Turbo Mode
      player.buffs.speedBoost = { expiresAt: now + s.durationMs, mul: s.speedMul };
      player.buffs.reloadBoost = { expiresAt: now + s.durationMs, mul: s.reloadMul };
      player.buffs.damageBoost = { expiresAt: now + s.durationMs, mul: s.damageMul };
      match.effects.push({
        id: effectId(), kind: 'aura', owner: player.id,
        color: brawler.accent, radius: 0.7, expiresAt: now + s.durationMs,
      });
      break;
    }

    case 'aoe_field': {
      // Thorn's Briar Patch
      const dest = aimedDestination(player, aim, s.range);
      match.effects.push({
        id: effectId(), kind: 'aoe_field', owner: player.id, team: player.team,
        x: dest.x, y: dest.y, radius: s.radius,
        dps: s.dps, slowFactor: s.slowFactor, allyHps: s.allyHps,
        expiresAt: now + s.durationMs, nextTick: now,
      });
      break;
    }

    case 'aoe_ring': {
      // Blaze's Inferno
      const x = s.selfCenter ? player.x : player.x + cos*3;
      const y = s.selfCenter ? player.y : player.y + sin*3;
      match.effects.push({
        id: effectId(), kind: 'aoe_ring', owner: player.id, team: player.team,
        x, y, radius: s.radius, dps: s.dps,
        followsOwner: s.selfCenter,
        expiresAt: now + s.durationMs, nextTick: now,
      });
      break;
    }

    case 'invisibility': {
      // Ghost's Vanish
      player.buffs.invisibility = { expiresAt: now + s.durationMs };
      player.buffs.speedBoost = { expiresAt: now + s.durationMs, mul: s.speedMul };
      break;
    }

    case 'barrage': {
      // Cannon's Broadside
      for (let i = 0; i < s.bullets; i++) {
        const t = (i / (s.bullets - 1) - 0.5) * 2;
        const angle = aim + t * (s.coneDeg * Math.PI / 180) / 2;
        spawnProjectile(match, player, {
          x: player.x + Math.cos(angle)*0.5, y: player.y + Math.sin(angle)*0.5,
          vx: Math.cos(angle)*s.bulletSpeed, vy: Math.sin(angle)*s.bulletSpeed,
          damage: s.damage, range: s.range,
          size: 0.24, color: brawler.color,
          explodeRadius: s.splashRadius || 1.0, splash: s.splash || s.damage,
          pulses: 1,
        });
      }
      break;
    }

    case 'heal_field': {
      // Pix's Blessing Circle
      const dest = aimedDestination(player, aim, s.range);
      match.effects.push({
        id: effectId(), kind: 'heal_field', owner: player.id, team: player.team,
        x: dest.x, y: dest.y, radius: s.radius,
        hps: s.hps, speedMul: s.speedMul,
        expiresAt: now + s.durationMs, nextTick: now,
      });
      break;
    }

    case 'dash_speed': {
      // Drift's Nitro Boost
      player.buffs.speedBoost = { expiresAt: now + s.durationMs, mul: s.speedMul };
      player.buffs.contactDamage = { expiresAt: now + s.durationMs, damage: s.contactDamage, knockback: s.knockback, hits: new Set() };
      player.buffs.slowImmune = { expiresAt: now + s.durationMs };
      break;
    }

    case 'deploy': {
      // Zap's Tesla / Siege's Mech-Turret
      const dest = aimedDestination(player, aim, 4);
      match.deployed.push({
        id: 'd' + (_nextEffectId++),
        kind: s.structure,    // 'tesla' or 'turret'
        owner: player.id, team: player.team,
        x: dest.x, y: dest.y,
        hp: s.hp, hpMax: s.hp,
        nextFire: now + 500,
        firePeriodMs: s.firePeriodMs,
        projectileDamage: s.projectileDamage,
        projectileRange: s.projectileRange,
        bursts: s.bursts || 1,
        color: brawler.color,
        expiresAt: now + s.durationMs,
      });
      break;
    }

    case 'singularity': {
      // Nova's gravity singularity
      const dest = aimedDestination(player, aim, s.range);
      match.effects.push({
        id: effectId(), kind: 'singularity', owner: player.id, team: player.team,
        x: dest.x, y: dest.y, radius: s.radius, dps: s.dps,
        finalDamage: s.finalDamage,
        expiresAt: now + s.durationMs, nextTick: now,
      });
      break;
    }

    case 'vision_zone': {
      // Omen's Eclipse
      const dest = aimedDestination(player, aim, s.range);
      match.effects.push({
        id: effectId(), kind: 'eclipse', owner: player.id, team: player.team,
        x: dest.x, y: dest.y, radius: s.radius,
        allyDamageMul: s.allyDamageMul, enemyVisionTiles: s.enemyVisionTiles,
        expiresAt: now + s.durationMs,
      });
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GADGET HANDLERS
// ─────────────────────────────────────────────────────────────────────────

export function fireGadget(match, player, brawler, now) {
  const g = brawler.gadget;
  const aim = player.aim;
  const cos = Math.cos(aim), sin = Math.sin(aim);

  switch (g.kind) {
    case 'place_wall': {
      // Place 2 wall tiles in front of player perpendicular to facing
      const perpX = -sin, perpY = cos;
      for (let i = 0; i < g.length; i++) {
        const off = (i / (g.length - 1) - 0.5) * g.length;
        const wx = Math.floor(player.x + cos*1 + perpX*off);
        const wy = Math.floor(player.y + sin*1 + perpY*off);
        if (tileAt(match.map, wx, wy) === TILE.FLOOR) {
          setTile(match.map, wx, wy, TILE.BREAK);
          match.tempWalls.push({ x: wx, y: wy, expiresAt: now + g.durationMs });
        }
      }
      break;
    }

    case 'shield':
      player.buffs.shield = { expiresAt: now + g.durationMs, absorb: g.absorbHp };
      break;

    case 'root_next':
      player.buffs.rootNext = { expiresAt: now + 8000, rootMs: g.rootMs };
      break;

    case 'dash_trail': {
      // Blaze's fire trail dash
      const dest = findDashDestination(match, player, brawler, g.distance, aim);
      player.dashTo = { x: dest.x, y: dest.y };
      player.dashFrom = { x: player.x, y: player.y };
      player.dashStartedAt = now;
      player.dashUntil = now + (g.distance / 14) * 1000;
      match.effects.push({
        id: effectId(), kind: 'dot_trail', owner: player.id, team: player.team,
        x: player.x, y: player.y, toX: dest.x, toY: dest.y,
        dps: g.dps, color: brawler.color,
        expiresAt: now + g.durationMs, nextTick: now,
      });
      break;
    }

    case 'stun_pulse': {
      // Zap's pulse — stuns all enemies in radius
      for (const target of match.players.values()) {
        if (target.team === player.team || !target.alive) continue;
        const d = Math.hypot(target.x - player.x, target.y - player.y);
        if (d <= g.radius) {
          target.buffs.stun = { expiresAt: now + g.stunMs };
        }
      }
      match.effects.push({ id: effectId(), kind: 'shockwave', x: player.x, y: player.y, radius: g.radius, color: 0xfacc15, expiresAt: now + 400 });
      break;
    }

    case 'haunt_decoy': {
      // Ghost's decoy that mimics movement
      player.decoy = {
        id: 'decoy_' + player.id,
        x: player.x, y: player.y, aim: player.aim,
        expiresAt: now + g.durationMs,
      };
      break;
    }

    case 'ground_pound': {
      // Cannon's AoE around self
      for (const target of match.players.values()) {
        if (target.team === player.team || !target.alive) continue;
        const d = Math.hypot(target.x - player.x, target.y - player.y);
        if (d <= g.radius) {
          damagePlayer(match, target, g.damage, player, now);
        }
      }
      match.effects.push({ id: effectId(), kind: 'shockwave', x: player.x, y: player.y, radius: g.radius, color: 0xfb923c, expiresAt: now + 500 });
      break;
    }

    case 'revive': {
      // Pix's Revive Dust — find recently-dead ally
      for (const other of match.players.values()) {
        if (other.team !== player.team || other.alive) continue;
        if (other.diedAt && now - other.diedAt < g.windowMs) {
          other.alive = true;
          other.hp = Math.floor(other.hpMax * g.hpFraction);
          other.respawnAt = 0;
          break;
        }
      }
      break;
    }

    case 'smoke': {
      match.effects.push({
        id: effectId(), kind: 'smoke', owner: player.id,
        x: player.x, y: player.y, radius: g.radius,
        expiresAt: now + g.durationMs,
      });
      break;
    }

    case 'repair': {
      // Siege's Emergency Repair — heal all deployed structures
      for (const d of match.deployed) {
        if (d.owner === player.id) d.hp = d.hpMax;
      }
      break;
    }

    case 'zero_g': {
      // Nova's Zero-G zone — enemies float (rooted)
      match.effects.push({
        id: effectId(), kind: 'zero_g', owner: player.id, team: player.team,
        x: player.x, y: player.y, radius: g.radius,
        expiresAt: now + g.durationMs, nextTick: now,
      });
      break;
    }

    case 'fear_pulse': {
      // Omen's Dread Pulse — enemies forced to flee
      for (const target of match.players.values()) {
        if (target.team === player.team || !target.alive) continue;
        const d = Math.hypot(target.x - player.x, target.y - player.y);
        if (d <= g.radius) {
          target.buffs.fear = {
            expiresAt: now + g.durationMs,
            fromX: player.x, fromY: player.y,
          };
        }
      }
      match.effects.push({ id: effectId(), kind: 'shockwave', x: player.x, y: player.y, radius: g.radius, color: 0xa855f7, expiresAt: now + 400 });
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────

function spawnProjectile(match, owner, opts) {
  match.projectiles.set(opts.id || projId(), {
    id: opts.id || projId(),
    ownerId: owner.id, team: owner.team,
    x: opts.x, y: opts.y, vx: opts.vx, vy: opts.vy,
    damage: opts.damage, range: opts.range, traveled: 0,
    size: opts.size || 0.15, color: opts.color || 0xffffff,
    piercing: opts.piercing || false,
    explodeRadius: opts.explodeRadius || 0, splash: opts.splash || 0,
    chainDamage: opts.chainDamage || 0, chainRange: opts.chainRange || 0,
    maxChains: opts.maxChains || 0, chainsDone: 0, chainedIds: [],
    gravity: opts.gravity, homing: opts.homing,
    pulses: opts.pulses || 1, pulseGapMs: opts.pulseGapMs || 0,
  });
}

function aimedDestination(player, aim, range) {
  return { x: player.x + Math.cos(aim) * range, y: player.y + Math.sin(aim) * range };
}

function findDashDestination(match, player, brawler, maxDist, aim) {
  // Step along the dash line, stop at wall
  const cos = Math.cos(aim), sin = Math.sin(aim);
  const steps = Math.ceil(maxDist / 0.2);
  let lastX = player.x, lastY = player.y;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * maxDist;
    const nx = player.x + cos * t;
    const ny = player.y + sin * t;
    if (blocksBullet(match.map, nx, ny)) break;
    lastX = nx; lastY = ny;
  }
  return { x: lastX, y: lastY };
}

function executeDashSlash(match, player, brawler, a, aim) {
  const dest = findDashDestination(match, player, brawler, a.distance, aim);
  const cos = Math.cos(aim), sin = Math.sin(aim);
  // Damage all enemies along the line
  const dx = dest.x - player.x, dy = dest.y - player.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist / 0.2);
  const hitIds = new Set();
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : (i / steps);
    const px = player.x + dx * t, py = player.y + dy * t;
    for (const target of match.players.values()) {
      if (target.id === player.id || target.team === player.team || !target.alive) continue;
      if (hitIds.has(target.id)) continue;
      const d = Math.hypot(target.x - px, target.y - py);
      if (d <= a.width + (target.radius || 0.4)) {
        damagePlayer(match, target, a.damage, player, Date.now());
        hitIds.add(target.id);
      }
    }
  }
  player.x = dest.x; player.y = dest.y;
  match.effects.push({
    id: effectId(), kind: 'slash_trail', owner: player.id,
    x: player.x, y: player.y, fromX: player.x - cos*a.distance, fromY: player.y - sin*a.distance,
    color: brawler.accent, expiresAt: Date.now() + 200,
  });
}

function executeHealBeam(match, player, brawler, a, aim, now) {
  // Pix: auto-target nearest ally to heal; if none in range, fire damage beam
  let nearestAlly = null, nearestDist = Infinity;
  for (const ally of match.players.values()) {
    if (ally.id === player.id || ally.team !== player.team || !ally.alive) continue;
    const d = Math.hypot(ally.x - player.x, ally.y - player.y);
    if (d <= brawler.attackRange && d < nearestDist && ally.hp < ally.hpMax) {
      nearestAlly = ally; nearestDist = d;
    }
  }
  if (nearestAlly) {
    nearestAlly.hp = Math.min(nearestAlly.hpMax, nearestAlly.hp + a.heal);
    match.effects.push({
      id: effectId(), kind: 'beam', from: { x: player.x, y: player.y },
      to: { x: nearestAlly.x, y: nearestAlly.y }, color: 0x4ade80, expiresAt: now + 250,
    });
  } else {
    spawnProjectile(match, player, {
      x: player.x + Math.cos(aim)*0.5, y: player.y + Math.sin(aim)*0.5,
      vx: Math.cos(aim)*a.bulletSpeed, vy: Math.sin(aim)*a.bulletSpeed,
      damage: a.damage, range: brawler.attackRange,
      size: a.bulletSize, color: 0xf472b6,
    });
  }
}

// Apply damage with all the modifiers (shields, buffs, star powers etc.)
export function damagePlayer(match, target, damage, attacker, now) {
  if (!target.alive) return 0;
  if (target.invulnerableUntil && now < target.invulnerableUntil) return 0;

  // Shield gadget
  if (target.buffs.shield && target.buffs.shield.expiresAt > now) {
    const absorbed = Math.min(damage, target.buffs.shield.absorb);
    target.buffs.shield.absorb -= absorbed;
    damage -= absorbed;
    if (target.buffs.shield.absorb <= 0) delete target.buffs.shield;
  }

  // Attacker damage boost (e.g., Vex Turbo Mode)
  if (attacker && attacker.buffs && attacker.buffs.damageBoost && attacker.buffs.damageBoost.expiresAt > now) {
    damage *= attacker.buffs.damageBoost.mul;
  }
  // Eclipse zone (Omen) ally damage boost
  if (attacker && match.effects) {
    for (const ef of match.effects) {
      if (ef.kind === 'eclipse' && ef.team === attacker.team) {
        if (Math.hypot(attacker.x - ef.x, attacker.y - ef.y) <= ef.radius) {
          damage *= ef.allyDamageMul;
          break;
        }
      }
    }
  }

  damage = Math.round(damage);
  target.hp -= damage;

  // Super charge for both attacker and target
  if (attacker && attacker.id !== target.id) {
    attacker.superCharge = Math.min(attacker.superMax, attacker.superCharge + damage);
  }
  target.superCharge = Math.min(target.superMax, target.superCharge + damage * 0.3);

  // Hit event for client FX
  match.events.push({ type: 'hit', x: target.x, y: target.y, damage, targetId: target.id });

  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    target.diedAt = now;
    target.respawnAt = now + (match.mode.respawnMs || 9999999);
    match.events.push({ type: 'death', targetId: target.id, killerId: attacker ? attacker.id : null,
                        x: target.x, y: target.y });
    return damage;
  }
  return damage;
}

// Apply damage to a deployed structure or breakable wall
export function damageDeployed(match, deployed, damage, now) {
  deployed.hp -= damage;
  if (deployed.hp <= 0) {
    deployed.hp = 0;
    deployed.dead = true;
  }
}

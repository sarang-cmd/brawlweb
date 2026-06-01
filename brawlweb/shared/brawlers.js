// Full Brawler catalog (PRD § 6.4 — all 12 launch Brawlers).
//
// Each Brawler is a pure data object describing stats + ability *kinds*.
// The server's ability resolver (server/abilities.js) reads `attack.kind` /
// `super.kind` / `gadget.kind` and dispatches to a handler function.
//
// Power levels apply +5% HP/dmg per level (PRD § 6.6).

export const RARITY = {
  STARTING:   { name: 'Starting',   color: '#9ca3af' },
  COMMON:     { name: 'Common',     color: '#60a5fa' },
  RARE:       { name: 'Rare',       color: '#4ade80' },
  SUPER_RARE: { name: 'Super Rare', color: '#fb923c' },
  EPIC:       { name: 'Epic',       color: '#c084fc' },
  MYTHIC:     { name: 'Mythic',     color: '#f87171' },
  LEGENDARY:  { name: 'Legendary',  color: '#fcd34d' },
};

// Attack `kind` values understood by the server:
//   'projectile'      → single straight bullet
//   'multi_projectile'→ N parallel bullets (Vex, Shard shotgun)
//   'piercing'        → straight bullet that passes through enemies (Thorn)
//   'aoe_burst'       → projectile that explodes on impact (Blaze, Cannon)
//   'chain'           → bullet that chains to nearest enemy on hit (Zap)
//   'dash_slash'      → forward dash that damages all in path (Ghost, Drift)
//   'heal_beam'       → auto-heals nearest ally OR damages enemy (Pix)
//   'minigun_burst'   → 3 rapid bullets in a tight stream (Siege)
//   'gravity_orb'     → projectile that pulls/pushes on impact (Nova)
//   'homing'          → slow-moving bullet that homes on nearest enemy (Omen)
//
// Super `kind` values: 'dash_charge','speed_boost','aoe_field','aoe_ring',
//   'invisibility','barrage','heal_field','dash_speed','deploy','singularity','vision_zone'
//
// Gadget `kind` values: 'place_wall','shield','root_next','dash_trail','stun_pulse',
//   'haunt_decoy','ground_pound','revive','smoke','repair','zero_g','fear_pulse'

export const BRAWLERS = {

  // ───────────────────────── 1. SHARD (Common — Tank) ─────────────────────
  shard: {
    id: 'shard', name: 'Shard', rarity: 'COMMON',
    theme: 'Rock Golem',
    color: 0x4b9b3b, accent: 0x7fd45f,
    health: 7200, moveSpeed: 2.0, attackRange: 4, radius: 0.45,
    ammoMax: 3, reloadMs: 1500, fireCooldownMs: 500,
    superRequiredDamage: 6000,
    attack: {
      kind: 'multi_projectile',
      bullets: 5, spread: 0.6, // radians of cone half-angle
      damagePerBullet: 480, bulletSpeed: 10, bulletSize: 0.18,
    },
    super: {
      kind: 'dash_charge',
      distance: 5, speed: 14, damage: 1200,
      width: 0.7, knockback: 1.5, invulnerable: true,
    },
    gadget: { kind: 'place_wall', uses: 3, length: 2, durationMs: 5000 },
    starPower1: { id: 'iron_core',  name: 'Iron Core',  desc: 'Shield absorbs first 1500 dmg per life' },
    starPower2: { id: 'aftershock', name: 'Aftershock', desc: 'Boulder Roll leaves slow field for 3s' },
  },

  // ───────────────────────── 2. VEX (Common — Balanced) ────────────────────
  vex: {
    id: 'vex', name: 'Vex', rarity: 'COMMON',
    theme: 'Energy Gunslinger',
    color: 0x4ad6ff, accent: 0xa6f0ff,
    health: 3800, moveSpeed: 2.4, attackRange: 7, radius: 0.4,
    ammoMax: 3, reloadMs: 1500, fireCooldownMs: 350,
    superRequiredDamage: 4500,
    attack: {
      kind: 'multi_projectile',
      bullets: 2, parallelSpacing: 0.6,
      damagePerBullet: 720, bulletSpeed: 12, bulletSize: 0.14,
    },
    super: {
      kind: 'speed_boost',
      durationMs: 4000, speedMul: 1.4, reloadMul: 0.5, damageMul: 1.2,
    },
    gadget: { kind: 'shield', uses: 2, durationMs: 2000, absorbHp: 2000 },
    starPower1: { id: 'overload',   name: 'Overload',    desc: 'After Super, next attack fires 4 bullets' },
    starPower2: { id: 'phase_round',name: 'Phase Round', desc: 'One bullet pierces walls' },
  },

  // ───────────────────────── 3. THORN (Rare — Sniper) ──────────────────────
  thorn: {
    id: 'thorn', name: 'Thorn', rarity: 'RARE',
    theme: 'Nature Archer',
    color: 0xa3e635, accent: 0xfde047,
    health: 2900, moveSpeed: 2.4, attackRange: 10, radius: 0.35,
    ammoMax: 1, reloadMs: 2000, fireCooldownMs: 600,
    superRequiredDamage: 5400,
    attack: {
      kind: 'piercing',
      damage: 1800, bulletSpeed: 16, bulletSize: 0.16,
    },
    super: {
      kind: 'aoe_field',
      radius: 1.5, durationMs: 5000, dps: 300, slowFactor: 0.5,
      range: 9, // can be placed up to 9 tiles away
    },
    gadget: { kind: 'root_next', uses: 2, rootMs: 1500 },
    starPower1: { id: 'bloom',     name: 'Bloom',     desc: 'Briar Patch also heals allies for 200/s' },
    starPower2: { id: 'thornwall', name: 'Thornwall', desc: 'Vine Arrow leaves wall at max range' },
  },

  // ───────────────────────── 4. BLAZE (Rare — AoE) ─────────────────────────
  blaze: {
    id: 'blaze', name: 'Blaze', rarity: 'RARE',
    theme: 'Fire Elemental',
    color: 0xff5722, accent: 0xffeb3b,
    health: 3400, moveSpeed: 2.4, attackRange: 5, radius: 0.4,
    ammoMax: 2, reloadMs: 2000, fireCooldownMs: 500,
    superRequiredDamage: 5000,
    attack: {
      kind: 'aoe_burst',
      damage: 900, radius: 1.0, bulletSpeed: 10, pulses: 3, pulseGapMs: 150,
    },
    super: {
      kind: 'aoe_ring',
      radius: 3, durationMs: 3000, dps: 800, selfCenter: true,
    },
    gadget: { kind: 'dash_trail', uses: 2, distance: 3, durationMs: 2000, dps: 400 },
    starPower1: { id: 'ignite',     name: 'Ignite',      desc: 'Hits burn enemies for 300/s for 3s' },
    starPower2: { id: 'heat_shield',name: 'Heat Shield', desc: '30% dmg reduction during Inferno' },
  },

  // ───────────────────────── 5. ZAP (Rare — Chain) ─────────────────────────
  zap: {
    id: 'zap', name: 'Zap', rarity: 'RARE',
    theme: 'Mad Scientist',
    color: 0xfacc15, accent: 0x60a5fa,
    health: 3200, moveSpeed: 2.4, attackRange: 6, radius: 0.38,
    ammoMax: 3, reloadMs: 1500, fireCooldownMs: 400,
    superRequiredDamage: 4800,
    attack: {
      kind: 'chain',
      damage: 1200, chainDamage: 800, chainRange: 3, maxChains: 1,
      bulletSpeed: 14, bulletSize: 0.14,
    },
    super: {
      kind: 'deploy',
      structure: 'tesla', hp: 2500, durationMs: 6000,
      firePeriodMs: 1500, projectileDamage: 800, projectileRange: 5,
    },
    gadget: { kind: 'stun_pulse', uses: 2, radius: 4, stunMs: 800 },
    starPower1: { id: 'conductor',  name: 'Conductor',  desc: 'Chains hit 3 enemies' },
    starPower2: { id: 'overcharge', name: 'Overcharge', desc: 'Tesla fires 2000 dmg burst every 3s' },
  },

  // ───────────────────────── 6. GHOST (Super Rare — Assassin) ──────────────
  ghost: {
    id: 'ghost', name: 'Ghost', rarity: 'SUPER_RARE',
    theme: 'Phantom Assassin',
    color: 0xc4b5fd, accent: 0xffffff,
    health: 2800, moveSpeed: 2.8, attackRange: 5, radius: 0.35,
    ammoMax: 1, reloadMs: 2500, fireCooldownMs: 500,
    superRequiredDamage: 5200,
    attack: {
      kind: 'dash_slash',
      distance: 2, speed: 18, damage: 2800, width: 0.7,
    },
    super: {
      kind: 'invisibility',
      durationMs: 4000, speedMul: 1.3,
    },
    gadget: { kind: 'haunt_decoy', uses: 1, durationMs: 3000 },
    starPower1: { id: 'ambush',   name: 'Ambush',   desc: 'First attack after invis deals +50% dmg' },
    starPower2: { id: 'ethereal', name: 'Ethereal', desc: 'Pass through walls while invisible' },
  },

  // ───────────────────────── 7. CANNON (Super Rare — Siege) ────────────────
  cannon: {
    id: 'cannon', name: 'Cannon', rarity: 'SUPER_RARE',
    theme: 'Heavy Artillery',
    color: 0x7c2d12, accent: 0xfbbf24,
    health: 5600, moveSpeed: 2.0, attackRange: 9, radius: 0.45,
    ammoMax: 2, reloadMs: 2000, fireCooldownMs: 700,
    superRequiredDamage: 5500,
    attack: {
      kind: 'aoe_burst',
      damage: 1600, splash: 800, radius: 1.0, bulletSpeed: 9, pulses: 1,
    },
    super: {
      kind: 'barrage',
      bullets: 5, coneDeg: 45, damage: 1600, splash: 800, splashRadius: 1.0,
      bulletSpeed: 9, range: 9,
    },
    gadget: { kind: 'ground_pound', uses: 2, radius: 2, damage: 2000 },
    starPower1: { id: 'armor_pierce', name: 'Armor Piercing', desc: '+50% dmg vs walls and safe' },
    starPower2: { id: 'hot_shot',     name: 'Hot Shot',       desc: 'Direct hits burn for 400/s for 2s' },
  },

  // ───────────────────────── 8. PIX (Epic — Healer) ────────────────────────
  pix: {
    id: 'pix', name: 'Pix', rarity: 'EPIC',
    theme: 'Fairy Support',
    color: 0xf9a8d4, accent: 0xfde68a,
    health: 2900, moveSpeed: 2.8, attackRange: 6, radius: 0.35,
    ammoMax: 3, reloadMs: 1500, fireCooldownMs: 400,
    superRequiredDamage: 4500,
    attack: {
      kind: 'heal_beam',
      heal: 1200, damage: 600, bulletSpeed: 18, bulletSize: 0.14,
    },
    super: {
      kind: 'heal_field',
      radius: 3, durationMs: 5000, hps: 600, speedMul: 1.15, range: 7,
    },
    gadget: { kind: 'revive', uses: 1, hpFraction: 0.25, windowMs: 5000 },
    starPower1: { id: 'overheal', name: 'Overheal', desc: 'Heal can overheal up to 20% as shield' },
    starPower2: { id: 'hex',      name: 'Hex',      desc: 'Damage beam debuffs +20% dmg taken for 3s' },
  },

  // ───────────────────────── 9. DRIFT (Epic — Speedster) ───────────────────
  drift: {
    id: 'drift', name: 'Drift', rarity: 'EPIC',
    theme: 'Hover Skater',
    color: 0xec4899, accent: 0x22d3ee,
    health: 3000, moveSpeed: 3.2, attackRange: 5, radius: 0.35,
    ammoMax: 2, reloadMs: 1500, fireCooldownMs: 400,
    superRequiredDamage: 4500,
    attack: {
      kind: 'dash_slash',
      distance: 2, speed: 18, damage: 1400, width: 0.7,
    },
    super: {
      kind: 'dash_speed',
      durationMs: 3000, speedMul: 1.8, contactDamage: 800, knockback: 2.0,
    },
    gadget: { kind: 'smoke', uses: 2, radius: 2, durationMs: 2000 },
    starPower1: { id: 'trick_shot', name: 'Trick Shot', desc: 'After Super, next attack hits 3 times' },
    starPower2: { id: 'drafting',   name: 'Drafting',   desc: '+10% speed when behind an ally' },
  },

  // ───────────────────────── 10. SIEGE (Mythic — Engineer) ─────────────────
  siege: {
    id: 'siege', name: 'Siege', rarity: 'MYTHIC',
    theme: 'Mech Engineer',
    color: 0x64748b, accent: 0xfbbf24,
    health: 4200, moveSpeed: 2.0, attackRange: 6, radius: 0.45,
    ammoMax: 3, reloadMs: 1800, fireCooldownMs: 600,
    superRequiredDamage: 5000,
    attack: {
      kind: 'minigun_burst',
      bullets: 3, damagePerBullet: 400, burstGapMs: 70,
      bulletSpeed: 16, bulletSize: 0.12, spread: 0.05,
    },
    super: {
      kind: 'deploy',
      structure: 'turret', hp: 3000, durationMs: 8000,
      firePeriodMs: 1200, projectileDamage: 400, bursts: 3, projectileRange: 6,
    },
    gadget: { kind: 'repair', uses: 1 },
    starPower1: { id: 'overclock',   name: 'Overclock',         desc: 'Turret fires 2x as fast when Siege within 4t' },
    starPower2: { id: 'barrier',     name: 'Barrier Protocol',  desc: 'Toggle Super to deploy 2-tile barrier wall' },
  },

  // ───────────────────────── 11. NOVA (Mythic — Crowd Control) ─────────────
  nova: {
    id: 'nova', name: 'Nova', rarity: 'MYTHIC',
    theme: 'Gravity Mage',
    color: 0x6366f1, accent: 0xc4b5fd,
    health: 3100, moveSpeed: 2.4, attackRange: 7, radius: 0.38,
    ammoMax: 2, reloadMs: 2000, fireCooldownMs: 500,
    superRequiredDamage: 4800,
    attack: {
      kind: 'gravity_orb',
      damage: 900, radius: 2, pull: true, bulletSpeed: 11, bulletSize: 0.18,
    },
    super: {
      kind: 'singularity',
      radius: 5, durationMs: 3000, dps: 500, finalDamage: 1500, range: 8,
    },
    gadget: { kind: 'zero_g', uses: 1, radius: 3, durationMs: 2000 },
    starPower1: { id: 'repulse', name: 'Repulse', desc: 'Toggle attack to push instead of pull' },
    starPower2: { id: 'warp',    name: 'Warp',    desc: 'Teleport to orb landing within 1s' },
  },

  // ───────────────────────── 12. OMEN (Legendary — Trickster) ──────────────
  omen: {
    id: 'omen', name: 'Omen', rarity: 'LEGENDARY',
    theme: 'Shadow Oracle',
    color: 0x4c1d95, accent: 0xf472b6,
    health: 3600, moveSpeed: 2.4, attackRange: 8, radius: 0.4,
    ammoMax: 2, reloadMs: 2000, fireCooldownMs: 500,
    superRequiredDamage: 5200,
    attack: {
      kind: 'homing',
      damage: 1600, bulletSpeed: 8, bulletSize: 0.18, seekRadius: 3,
    },
    super: {
      kind: 'vision_zone',
      radius: 7, durationMs: 6000, allyDamageMul: 1.25, enemyVisionTiles: 3, range: 6,
    },
    gadget: { kind: 'fear_pulse', uses: 1, radius: 4, durationMs: 1200 },
    starPower1: { id: 'cursed_touch', name: 'Cursed Touch', desc: 'Hit enemies take 15% self-dmg for 4s' },
    starPower2: { id: 'dark_passage', name: 'Dark Passage', desc: 'Shadow Bolts pass through walls' },
  },
};

// Order for UI display (rarity ascending)
export const BRAWLER_ORDER = [
  'shard','vex',                    // Common
  'thorn','blaze','zap',            // Rare
  'ghost','cannon',                 // Super Rare
  'pix','drift',                    // Epic
  'siege','nova',                   // Mythic
  'omen',                           // Legendary
];

// Power Level scaling (PRD § 6.6)
export const POWER_LEVEL_BONUS = [
  0,   // L1 base
  0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45,  // L2..L10
];
export const POWER_LEVEL_COSTS = [
  // [gold, powerPoints] needed to upgrade from level n to n+1
  null,
  [20, 20], [35, 30], [75, 50], [140, 80], [290, 130],
  [580, 210], [1125, 340], [1900, 550], [3000, 890],
];

export function applyPowerLevel(brawler, level) {
  const bonus = POWER_LEVEL_BONUS[Math.min(Math.max(level, 1), 10) - 1];
  const out = JSON.parse(JSON.stringify(brawler));
  out.health = Math.round(brawler.health * (1 + bonus));
  // Scale any numeric "damage*" field in attack and super
  const scale = (obj) => {
    for (const k of Object.keys(obj || {})) {
      if (/damage|^heal$|^dps$|^splash$|^contactDamage$|^finalDamage$|^projectileDamage$|^damagePerBullet$/.test(k)
          && typeof obj[k] === 'number') {
        obj[k] = Math.round(obj[k] * (1 + bonus));
      }
    }
  };
  scale(out.attack);
  scale(out.super);
  scale(out.gadget);
  return out;
}

export const DEFAULT_BRAWLER = 'vex';
export const STARTING_BRAWLER = 'shard';   // What every new account starts with

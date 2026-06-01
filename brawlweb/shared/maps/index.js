// Map catalog. Each map is symmetric and tagged with its mode.
// Tile codes: 0=floor, 1=wall, 2=bush, 3=breakable.
// Special markers go in the `meta` field; spawnPoints arrays drive team starts.

const _ = 0, W = 1, B = 2, X = 3;   // X = breakable

// Helper: vertical mirror of a 2D array (for symmetric maps).
function mirrorX(rows) {
  return rows.map(r => [...r, ...[...r].reverse()]);
}
// Helper: horizontal mirror (mirror top to bottom)
function mirrorY(rows) {
  return [...rows, ...[...rows].reverse()];
}

// ─────────────────────────────────────────────────────────────────────────
// GEM GRAB maps (29×25 per PRD)
// ─────────────────────────────────────────────────────────────────────────

// "Crystal Cavern" — central gem mine, two main paths
const gem_crystal_left = [
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  [W,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [W,_,_,B,B,_,_,_,_,W,W,_,_,_,_],
  [W,_,_,_,_,_,_,_,_,W,_,_,B,_,_],
  [W,_,_,_,W,_,_,_,_,_,_,_,B,_,_],
  [W,_,B,_,W,_,_,X,X,_,_,_,_,_,_],
  [W,_,B,_,_,_,_,X,_,_,_,W,_,_,_],
  [W,_,_,_,_,_,_,_,_,_,_,W,_,B,_],
  [W,_,_,_,_,_,W,_,_,_,_,_,_,B,_],
  [W,_,_,_,W,_,W,_,_,_,_,_,_,_,_],
  [W,_,B,_,W,_,_,_,_,B,B,_,_,_,_],
  [W,_,B,_,_,_,_,_,_,_,_,_,_,_,_],
  [W,_,_,_,_,_,_,_,W,W,_,_,_,_,_],
];
function makeGemMap(id, name, leftHalf) {
  // mirror both axes to produce 29×25 from 13×15
  const top = mirrorX(leftHalf);                              // 13×30 — too wide; we want 29
  // remove duplicated center column
  const fixed = top.map(r => [...r.slice(0, leftHalf[0].length), ...r.slice(leftHalf[0].length + 1)]);
  const full = mirrorY(fixed.slice(0, -1));                   // 25 rows from 13 (drop dup center)
  return {
    id, name, mode: 'gem_grab',
    width: full[0].length, height: full.length, tileSize: 64,
    tiles: full, theme: 'cave',
    spawnPoints: {
      team1: [{x:2.5,y:12.5},{x:2.5,y:11.5},{x:2.5,y:13.5}],
      team2: [{x:full[0].length-2.5,y:12.5},{x:full[0].length-2.5,y:11.5},{x:full[0].length-2.5,y:13.5}],
    },
    meta: { gemMine: { x: Math.floor(full[0].length/2), y: Math.floor(full.length/2) } },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Hand-build a few core arena maps instead of complex mirroring math.
// Each map below is the FULL grid so it's easy to reason about.
// ─────────────────────────────────────────────────────────────────────────

const GEM_GRAB_CRYSTAL = (() => {
  // 25×17 simpler arena
  const r = [];
  const W_ = 1, _ = 0, B_ = 2, X_ = 3;
  for (let y = 0; y < 17; y++) {
    const row = new Array(25).fill(0);
    if (y === 0 || y === 16) row.fill(W_);
    row[0] = W_; row[24] = W_;
    r.push(row);
  }
  // Symmetric obstacles
  const wall = (x, y) => { r[y][x] = W_; r[16 - y][x] = W_; r[y][24 - x] = W_; r[16 - y][24 - x] = W_; };
  const bush = (x, y) => { r[y][x] = B_; r[16 - y][x] = B_; r[y][24 - x] = B_; r[16 - y][24 - x] = B_; };
  const brk  = (x, y) => { r[y][x] = X_; r[16 - y][x] = X_; r[y][24 - x] = X_; r[16 - y][24 - x] = X_; };
  // Cover near spawn
  bush(3, 3); bush(3, 4); bush(4, 3);
  wall(6, 5); wall(6, 6);
  bush(8, 7); bush(8, 8);
  brk(11, 5); brk(11, 6);
  wall(10, 8);
  bush(5, 8);
  return {
    id: 'gg_crystal', name: 'Crystal Cavern', mode: 'gem_grab',
    width: 25, height: 17, tileSize: 64, tiles: r, theme: 'cave',
    spawnPoints: {
      team1: [{x:2.5,y:8.5},{x:2.5,y:6.5},{x:2.5,y:10.5}],
      team2: [{x:22.5,y:8.5},{x:22.5,y:6.5},{x:22.5,y:10.5}],
    },
    meta: { gemMine: { x: 12, y: 8 } },
  };
})();

const GEM_GRAB_HARDROCK = (() => {
  const W_ = 1, _ = 0, B_ = 2;
  const r = [];
  for (let y = 0; y < 17; y++) {
    const row = new Array(25).fill(0);
    row[0] = W_; row[24] = W_;
    if (y === 0 || y === 16) row.fill(W_);
    r.push(row);
  }
  const wall = (x, y) => { r[y][x] = W_; r[16 - y][x] = W_; r[y][24 - x] = W_; r[16 - y][24 - x] = W_; };
  const bush = (x, y) => { r[y][x] = B_; r[16 - y][x] = B_; r[y][24 - x] = B_; r[16 - y][24 - x] = B_; };
  // big central pillars
  wall(11, 6); wall(11, 7); wall(11, 9); wall(11, 10);
  wall(12, 7); wall(12, 9);
  bush(6, 4); bush(6, 12); bush(7, 4); bush(7, 12);
  wall(8, 6); wall(8, 10);
  bush(4, 8);
  return {
    id: 'gg_hardrock', name: 'Hard Rock Mine', mode: 'gem_grab',
    width: 25, height: 17, tileSize: 64, tiles: r, theme: 'mine',
    spawnPoints: {
      team1: [{x:2.5,y:8.5},{x:2.5,y:6.5},{x:2.5,y:10.5}],
      team2: [{x:22.5,y:8.5},{x:22.5,y:6.5},{x:22.5,y:10.5}],
    },
    meta: { gemMine: { x: 12, y: 8 } },
  };
})();

// ─────────────────────────────────────────────────────────────────────────
// BOUNTY (35×25 per PRD — we'll do a smaller 27×17 variant)
// ─────────────────────────────────────────────────────────────────────────

const BOUNTY_SHOOTING_STAR = (() => {
  const W_ = 1, _ = 0, B_ = 2;
  const r = [];
  for (let y = 0; y < 17; y++) {
    const row = new Array(27).fill(0);
    row[0] = W_; row[26] = W_;
    if (y === 0 || y === 16) row.fill(W_);
    r.push(row);
  }
  const wall = (x, y) => { r[y][x] = W_; r[16 - y][x] = W_; r[y][26 - x] = W_; r[16 - y][26 - x] = W_; };
  const bush = (x, y) => { r[y][x] = B_; r[16 - y][x] = B_; r[y][26 - x] = B_; r[16 - y][26 - x] = B_; };
  // central diamond of walls
  wall(13, 6); wall(13, 10);
  wall(11, 8); wall(15, 8);
  bush(7, 6); bush(7, 10);
  bush(13, 4); bush(13, 12);
  wall(5, 8); wall(21, 8);
  bush(9, 8); bush(17, 8);
  return {
    id: 'bo_shooting_star', name: 'Shooting Star', mode: 'bounty',
    width: 27, height: 17, tileSize: 64, tiles: r, theme: 'desert',
    spawnPoints: {
      team1: [{x:2.5,y:8.5},{x:2.5,y:6.5},{x:2.5,y:10.5}],
      team2: [{x:24.5,y:8.5},{x:24.5,y:6.5},{x:24.5,y:10.5}],
    },
    meta: {},
  };
})();

const BOUNTY_LAYERCAKE = (() => {
  const W_ = 1, _ = 0, B_ = 2;
  const r = [];
  for (let y = 0; y < 17; y++) {
    const row = new Array(27).fill(0);
    row[0] = W_; row[26] = W_;
    if (y === 0 || y === 16) row.fill(W_);
    r.push(row);
  }
  // Horizontal lanes of cover
  for (let x = 8; x <= 18; x++) {
    if (x !== 13) { r[5][x] = (x % 2 === 0 ? 1 : 2); r[11][x] = (x % 2 === 0 ? 1 : 2); }
  }
  for (let y = 7; y <= 9; y++) { r[y][6] = 2; r[y][20] = 2; }
  return {
    id: 'bo_layer_cake', name: 'Layer Cake', mode: 'bounty',
    width: 27, height: 17, tileSize: 64, tiles: r, theme: 'grass',
    spawnPoints: {
      team1: [{x:2.5,y:8.5},{x:2.5,y:6.5},{x:2.5,y:10.5}],
      team2: [{x:24.5,y:8.5},{x:24.5,y:6.5},{x:24.5,y:10.5}],
    },
    meta: {},
  };
})();

// ─────────────────────────────────────────────────────────────────────────
// HEIST — two safes (one per team)
// ─────────────────────────────────────────────────────────────────────────

const HEIST_KABOOM_CANYON = (() => {
  const W_ = 1, _ = 0, B_ = 2;
  const r = [];
  for (let y = 0; y < 17; y++) {
    const row = new Array(27).fill(0);
    row[0] = W_; row[26] = W_;
    if (y === 0 || y === 16) row.fill(W_);
    r.push(row);
  }
  const wall = (x, y) => { r[y][x] = W_; r[16 - y][x] = W_; r[y][26 - x] = W_; r[16 - y][26 - x] = W_; };
  const bush = (x, y) => { r[y][x] = B_; r[16 - y][x] = B_; r[y][26 - x] = B_; r[16 - y][26 - x] = B_; };
  // Cover protecting safes
  wall(4, 6); wall(4, 10);
  wall(5, 7); wall(5, 9);
  // Mid lane obstacles
  wall(13, 5); wall(13, 11);
  bush(10, 8); bush(13, 8);
  bush(8, 4); bush(8, 12);
  return {
    id: 'he_kaboom', name: 'Kaboom Canyon', mode: 'heist',
    width: 27, height: 17, tileSize: 64, tiles: r, theme: 'canyon',
    spawnPoints: {
      team1: [{x:3.5,y:8.5},{x:3.5,y:6.5},{x:3.5,y:10.5}],
      team2: [{x:23.5,y:8.5},{x:23.5,y:6.5},{x:23.5,y:10.5}],
    },
    meta: {
      safes: {
        team1: { x: 2, y: 8 },
        team2: { x: 24, y: 8 },
        hp: 40000,
      }
    },
  };
})();

const HEIST_SAFE_ZONE = (() => {
  const W_ = 1, _ = 0, B_ = 2;
  const r = [];
  for (let y = 0; y < 17; y++) {
    const row = new Array(27).fill(0);
    row[0] = W_; row[26] = W_;
    if (y === 0 || y === 16) row.fill(W_);
    r.push(row);
  }
  // Big open arena with central walls
  for (let y = 6; y <= 10; y++) r[y][13] = 1;
  r[8][13] = 0;
  r[3][8] = 1; r[13][8] = 1; r[3][18] = 1; r[13][18] = 1;
  for (let y = 5; y <= 11; y++) { r[y][5] = 2; r[y][21] = 2; }
  return {
    id: 'he_safe_zone', name: 'Safe Zone', mode: 'heist',
    width: 27, height: 17, tileSize: 64, tiles: r, theme: 'industrial',
    spawnPoints: {
      team1: [{x:3.5,y:8.5},{x:3.5,y:6.5},{x:3.5,y:10.5}],
      team2: [{x:23.5,y:8.5},{x:23.5,y:6.5},{x:23.5,y:10.5}],
    },
    meta: { safes: { team1: { x: 2, y: 8 }, team2: { x: 24, y: 8 }, hp: 40000 } },
  };
})();

// ─────────────────────────────────────────────────────────────────────────
// SHOWDOWN — big square arena with power cubes scattered around
// ─────────────────────────────────────────────────────────────────────────

const SHOWDOWN_FEAST_OR_FAMINE = (() => {
  const W_ = 1, _ = 0, B_ = 2;
  const SIZE = 33;
  const r = [];
  for (let y = 0; y < SIZE; y++) {
    const row = new Array(SIZE).fill(0);
    if (y === 0 || y === SIZE - 1) row.fill(W_);
    row[0] = W_; row[SIZE - 1] = W_;
    r.push(row);
  }
  // Rotationally symmetric obstacles
  const place = (x, y, t) => {
    r[y][x] = t;
    r[SIZE - 1 - y][SIZE - 1 - x] = t;
    r[SIZE - 1 - x][y] = t;
    r[x][SIZE - 1 - y] = t;
  };
  // Corners — bushes for stealth
  for (let i = 0; i < 4; i++) { place(3 + i, 3, B_); place(3, 3 + i, B_); }
  // Mid-ring walls
  place(8, 6, W_); place(8, 7, W_);
  place(10, 10, W_); place(11, 10, W_);
  place(6, 12, B_); place(7, 12, B_);
  place(13, 6, B_); place(13, 7, B_);
  place(5, 8, W_);
  // Center walls
  place(15, 13, W_); place(16, 14, W_);

  const powerBoxes = [];
  // Scatter ~12 power boxes (rotationally symmetric pattern)
  const positions = [
    [5,5], [10,5], [5,10], [12,12], [8,15], [15,8],
  ];
  for (const [x, y] of positions) {
    powerBoxes.push({ x: x + 0.5, y: y + 0.5 });
    powerBoxes.push({ x: SIZE - 1 - x + 0.5, y: SIZE - 1 - y + 0.5 });
  }

  // 10 spawn points around the edges
  const spawns = [];
  const edge = 2.5;
  const inner = SIZE - 3.5;
  const pts = [
    [edge, edge], [SIZE / 2, edge], [inner, edge],
    [edge, SIZE / 2], [inner, SIZE / 2],
    [edge, inner], [SIZE / 2, inner], [inner, inner],
    [edge + 4, edge + 4], [inner - 4, inner - 4],
  ];
  for (const [x, y] of pts) spawns.push({ x, y });

  return {
    id: 'sd_feast', name: 'Feast or Famine', mode: 'showdown',
    width: SIZE, height: SIZE, tileSize: 64, tiles: r, theme: 'desert',
    spawnPoints: { solo: spawns },
    meta: { powerBoxes, poisonStartMs: 60000, poisonShrinkMs: 90000 },
  };
})();

// ─────────────────────────────────────────────────────────────────────────

export const ALL_MAPS = {
  gg_crystal:        GEM_GRAB_CRYSTAL,
  gg_hardrock:       GEM_GRAB_HARDROCK,
  bo_shooting_star:  BOUNTY_SHOOTING_STAR,
  bo_layer_cake:     BOUNTY_LAYERCAKE,
  he_kaboom:         HEIST_KABOOM_CANYON,
  he_safe_zone:      HEIST_SAFE_ZONE,
  sd_feast:          SHOWDOWN_FEAST_OR_FAMINE,
};

export const MAPS_BY_MODE = {
  gem_grab:  ['gg_crystal', 'gg_hardrock'],
  bounty:    ['bo_shooting_star', 'bo_layer_cake'],
  heist:     ['he_kaboom', 'he_safe_zone'],
  showdown:  ['sd_feast'],
};

export function pickMap(mode) {
  const list = MAPS_BY_MODE[mode];
  return ALL_MAPS[list[Math.floor(Math.random() * list.length)]];
}

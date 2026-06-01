// Shared map utilities (PRD § 7.3).
// Tile codes — keep in sync with shared/maps/index.js.
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  BUSH: 2,
  BREAK: 3,     // breakable wall (HP 4000 — destroyed by attacks)
};

export function tileAt(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return TILE.WALL;
  return map.tiles[ty][tx];
}

export function setTile(map, tx, ty, value) {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return;
  map.tiles[ty][tx] = value;
}

// AABB-vs-tile-walls collision resolver. Returns adjusted {x, y}.
// `r` is the player radius in tiles. Handles axis-aligned sliding.
export function resolveMove(map, x, y, dx, dy, r) {
  let nx = x + dx;
  let ny = y + dy;

  if (dx !== 0) {
    const probeX = dx > 0 ? nx + r : nx - r;
    const yTop = Math.floor(y - r);
    const yBot = Math.floor(y + r);
    for (let ty = yTop; ty <= yBot; ty++) {
      const t = tileAt(map, Math.floor(probeX), ty);
      if (t === TILE.WALL || t === TILE.BREAK) {
        if (dx > 0) nx = Math.floor(probeX) - r - 0.001;
        else nx = Math.floor(probeX) + 1 + r + 0.001;
        break;
      }
    }
  }
  if (dy !== 0) {
    const probeY = dy > 0 ? ny + r : ny - r;
    const xLeft = Math.floor(nx - r);
    const xRight = Math.floor(nx + r);
    for (let tx = xLeft; tx <= xRight; tx++) {
      const t = tileAt(map, tx, Math.floor(probeY));
      if (t === TILE.WALL || t === TILE.BREAK) {
        if (dy > 0) ny = Math.floor(probeY) - r - 0.001;
        else ny = Math.floor(probeY) + 1 + r + 0.001;
        break;
      }
    }
  }
  return { x: nx, y: ny };
}

export function inBush(map, x, y) {
  return tileAt(map, Math.floor(x), Math.floor(y)) === TILE.BUSH;
}

export function blocksBullet(map, x, y) {
  const t = tileAt(map, Math.floor(x), Math.floor(y));
  return t === TILE.WALL || t === TILE.BREAK;
}

// Line-of-sight: walks a ray, returns true if no solid wall between the two points.
export function hasLineOfSight(map, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist / 0.25);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksBullet(map, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

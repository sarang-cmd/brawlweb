// Match screen — Phaser game + HUD + WebSocket networking + prediction.

import { TILE, resolveMove, inBush } from '/shared/map.js';
import { BRAWLERS } from '/shared/brawlers.js';

const TILE_PX = 40;

export function startMatch(app, { matchId }) {
  // Create game container overlay
  const overlay = document.createElement('div');
  overlay.id = 'game-container';
  overlay.innerHTML = `
    <div id="game-canvas-host"></div>
    <div id="game-hud">
      <div class="hud-bar-top" id="hud-top"></div>
      <div class="hud-bar-bottom">
        <div class="hud-info" id="hud-info">Connecting…</div>
        <div class="hud-ammo-row" id="hud-ammo"></div>
      </div>
      <div class="match-status hidden" id="match-status"></div>
      <div class="gadget-button" id="gadget-btn" title="Gadget (Q)">G<br><span id="gadget-uses">0</span></div>
      <div class="super-button" id="super-btn" title="Super (E)">SUPER</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const ctx = {
    app, matchId, overlay,
    ws: null,
    me: null,
    welcomed: false,
    serverPlayers: new Map(),
    serverProjectiles: new Map(),
    serverDeployed: [],
    serverEffects: [],
    serverGems: [],
    modeState: {},
    timeLeft: 0,
    mapData: null,
    brawlers: BRAWLERS,
    scene: null,
    game: null,
    inputSeq: 0,
    pendingInputs: [],
    localPos: null,
    localAim: 0,
    attackHeld: false,
    superQueued: false,
    gadgetQueued: false,
    dead: false,
    lastSnapAt: 0,
    ended: false,
    resultShown: false,
    pingMs: 0,
  };

  // Connect WebSocket
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ctx.ws = new WebSocket(`${proto}://${location.host}`);
  ctx.ws.onopen = () => {
    ctx.ws.send(JSON.stringify({ type: 'join', token: app.token }));
    setInterval(() => {
      if (ctx.ws.readyState === 1) ctx.ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
    }, 2000);
  };
  ctx.ws.onmessage = (ev) => handleMsg(ctx, JSON.parse(ev.data));
  ctx.ws.onclose = () => {
    if (!ctx.ended) showError(ctx, 'Disconnected from server');
  };
  ctx.ws.onerror = () => showError(ctx, 'Network error');
}

function showError(ctx, msg) {
  ctx.overlay.querySelector('#hud-info').innerHTML = `<strong style="color:var(--red)">${msg}</strong> <button class="btn btn-ghost" onclick="window.app.go('home');document.getElementById('game-container').remove();">Exit</button>`;
}

function handleMsg(ctx, msg) {
  if (msg.type === 'pong') { ctx.pingMs = Date.now() - msg.t; return; }
  if (msg.type === 'error') { showError(ctx, msg.error); return; }
  if (msg.type === 'welcome') {
    ctx.welcomed = true;
    ctx.me = msg.yourId;
    ctx.mapData = msg.match.map;
    ctx.participants = msg.match.participants;
    ctx.mode = msg.match.mode;
    bootGame(ctx);
    return;
  }
  if (msg.type === 'state') {
    applyState(ctx, msg);
    return;
  }
}

function bootGame(ctx) {
  const w = ctx.mapData.width * TILE_PX;
  const h = ctx.mapData.height * TILE_PX;

  // Find my spawn from participants → grab my position from first state
  const mySpawn = { x: ctx.mapData.width / 2, y: ctx.mapData.height / 2 };
  ctx.localPos = { ...mySpawn };

  const sceneConfig = {
    key: 'arena',
    create() { this._setupScene(ctx); },
    update(_t, dt) { this._tick(ctx, dt / 1000); },
  };

  // Build a scene class
  class ArenaScene extends Phaser.Scene {
    constructor() { super({ key: 'arena' }); }
    create() {
      ctx.scene = this;
      const g = this.add.graphics();
      drawMap(g, ctx.mapData);
      this.cameras.main.setBackgroundColor('#000');
      this.cameras.main.setBounds(0, 0, w, h);

      this.bgLayer = g;
      this.dynamicLayer = this.add.layer();   // gems, cubes, safes
      this.effectLayer = this.add.layer();    // fields, trails
      this.bulletLayer = this.add.layer();
      this.playerLayer = this.add.layer();
      this.fxLayer     = this.add.layer();

      // Local & remote sprite maps
      this.playerSprites = new Map();
      this.bulletSprites = new Map();
      this.deployedSprites = new Map();
      this.gemSprites = [];
      this.effectSprites = new Map();
      this.safeSprites = {};
      this.cubeSprites = [];

      // Input
      this.keys = this.input.keyboard.addKeys({
        up: 'W', down: 'S', left: 'A', right: 'D',
        upA: 'UP', downA: 'DOWN', leftA: 'LEFT', rightA: 'RIGHT',
        fire: 'SPACE', superk: 'E', gadget: 'Q',
      });
      this.input.on('pointerdown', (p) => {
        if (p.rightButtonDown()) ctx.superQueued = true;
        else ctx.attackHeld = true;
      });
      this.input.on('pointerup', () => { ctx.attackHeld = false; });
      this.input.mouse.disableContextMenu();
      this.input.keyboard.on('keydown-E', () => { ctx.superQueued = true; });
      this.input.keyboard.on('keydown-Q', () => { ctx.gadgetQueued = true; });

      // HUD wireup
      ctx.overlay.querySelector('#super-btn').onclick = () => { ctx.superQueued = true; };
      ctx.overlay.querySelector('#gadget-btn').onclick = () => { ctx.gadgetQueued = true; };
    }

    update(_t, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      if (!ctx.welcomed) return;

      // Build local input
      if (!ctx.dead && ctx.serverPlayers.get(ctx.me)?.alive) {
        let mx = 0, my = 0;
        if (this.keys.left.isDown || this.keys.leftA.isDown) mx -= 1;
        if (this.keys.right.isDown || this.keys.rightA.isDown) mx += 1;
        if (this.keys.up.isDown || this.keys.upA.isDown) my -= 1;
        if (this.keys.down.isDown || this.keys.downA.isDown) my += 1;

        const pointer = this.input.activePointer;
        const meX = ctx.localPos.x * TILE_PX;
        const meY = ctx.localPos.y * TILE_PX;
        ctx.localAim = Math.atan2(pointer.worldY - meY, pointer.worldX - meX);

        const attack = ctx.attackHeld || this.keys.fire.isDown;
        const superp = ctx.superQueued; ctx.superQueued = false;
        const gadget = ctx.gadgetQueued; ctx.gadgetQueued = false;

        ctx.inputSeq++;
        const inp = { seq: ctx.inputSeq, dt, moveX: mx, moveY: my, aim: ctx.localAim,
                      attack, super: superp, gadget };

        // Local prediction (movement only — abilities are server-authoritative)
        applyLocalInput(ctx, inp);
        ctx.pendingInputs.push(inp);
        if (ctx.pendingInputs.length > 120) ctx.pendingInputs.shift();

        // Send
        if (ctx.ws.readyState === 1) {
          ctx.ws.send(JSON.stringify({
            type: 'input', seq: inp.seq,
            moveX: mx, moveY: my, aim: ctx.localAim,
            attack, super: superp, gadget,
          }));
        }
      }

      // Render
      renderFrame(ctx, this, dt);
      renderHud(ctx);
    }
  }

  ctx.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-canvas-host',
    backgroundColor: '#000',
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [ArenaScene],
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
    fps: { target: 60 },
  });
}

function drawMap(g, map) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const t = map.tiles[y][x];
      let color;
      if (t === TILE.WALL)       color = 0x3a3d52;
      else if (t === TILE.BUSH)  color = 0x174d2a;
      else if (t === TILE.BREAK) color = 0x6b4e2b;
      else color = ((x + y) % 2 === 0) ? 0x1f4a2f : 0x224d33;
      g.fillStyle(color, 1);
      g.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX);
      g.lineStyle(1, 0x000000, 0.18);
      g.strokeRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX);
      if (t === TILE.WALL) {
        g.fillStyle(0x595e7d, 1);
        g.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, 4);
      }
      if (t === TILE.BUSH) {
        g.fillStyle(0x2bb86b, 1);
        for (let i = 0; i < 3; i++) {
          g.fillCircle(x * TILE_PX + 8 + i * 12, y * TILE_PX + 12 + (i%2)*10, 6);
        }
      }
      if (t === TILE.BREAK) {
        g.fillStyle(0x8b5e3c, 1); g.fillRect(x*TILE_PX+4, y*TILE_PX+4, TILE_PX-8, TILE_PX-8);
      }
    }
  }
}

function applyLocalInput(ctx, inp) {
  let mx = inp.moveX, my = inp.moveY;
  const mag = Math.hypot(mx, my);
  if (mag > 1) { mx /= mag; my /= mag; }
  const me = ctx.serverPlayers.get(ctx.me);
  if (!me) return;
  const b = ctx.brawlers[me.brawlerId];
  if (!b) return;
  let speed = b.moveSpeed;
  if (inBush(ctx.mapData, ctx.localPos.x, ctx.localPos.y)) speed *= 0.8;
  const dx = mx * speed * inp.dt;
  const dy = my * speed * inp.dt;
  const np = resolveMove(ctx.mapData, ctx.localPos.x, ctx.localPos.y, dx, dy, b.radius);
  ctx.localPos.x = np.x; ctx.localPos.y = np.y;
}

function applyState(ctx, state) {
  ctx.lastSnapAt = performance.now();
  ctx.mapData.tiles = state.mapTiles;   // update destructibles
  ctx.modeState = state.modeState || {};
  ctx.timeLeft = state.timeLeft;

  // Players
  const seen = new Set();
  for (const p of state.players) {
    seen.add(p.id);
    const prev = ctx.serverPlayers.get(p.id);
    ctx.serverPlayers.set(p.id, {
      ...p,
      prevX: prev ? prev.x : p.x,
      prevY: prev ? prev.y : p.y,
    });
  }
  for (const id of [...ctx.serverPlayers.keys()]) {
    if (!seen.has(id)) ctx.serverPlayers.delete(id);
  }

  // Reconciliation for local player
  const me = ctx.serverPlayers.get(ctx.me);
  if (me) {
    if (!me.alive && !ctx.dead) {
      ctx.dead = true;
    } else if (me.alive && ctx.dead) {
      ctx.dead = false;
      ctx.localPos = { x: me.x, y: me.y };
      ctx.pendingInputs.length = 0;
    }
    if (me.alive) {
      // Snap to server, replay pending unacked inputs
      const ack = me.lastInputSeq | 0;
      ctx.pendingInputs = ctx.pendingInputs.filter(i => i.seq > ack);
      ctx.localPos.x = me.x; ctx.localPos.y = me.y;
      for (const i of ctx.pendingInputs) applyLocalInput(ctx, i);
    }
  }

  // Projectiles
  const projSeen = new Set();
  for (const pr of state.projectiles) {
    projSeen.add(pr.id);
    const existing = ctx.serverProjectiles.get(pr.id);
    if (existing) {
      existing.prevX = existing.x; existing.prevY = existing.y;
      Object.assign(existing, pr);
    } else {
      ctx.serverProjectiles.set(pr.id, { ...pr, prevX: pr.x, prevY: pr.y });
    }
  }
  for (const id of [...ctx.serverProjectiles.keys()]) {
    if (!projSeen.has(id)) ctx.serverProjectiles.delete(id);
  }

  ctx.serverDeployed = state.deployed || [];
  ctx.serverEffects = state.effects || [];
  ctx.serverGems = state.gems || [];

  // Events: spawn FX
  for (const ev of (state.events || [])) {
    if (ev.type === 'explosion' && ctx.scene) {
      spawnExplosionFX(ctx, ev.x, ev.y, ev.radius);
    }
    if (ev.type === 'hit' && ctx.scene) {
      spawnHitFX(ctx, ev.x, ev.y, ev.damage);
    }
    if (ev.type === 'death' && ctx.scene) {
      spawnDeathFX(ctx, ev.x, ev.y);
    }
  }

  if (state.ended && state.result && !ctx.resultShown) {
    ctx.resultShown = true;
    ctx.ended = true;
    showResults(ctx, state.result);
  }
}

function renderFrame(ctx, scene, dt) {
  // Camera follow
  const me = ctx.serverPlayers.get(ctx.me);
  if (me) {
    scene.cameras.main.centerOn(ctx.localPos.x * TILE_PX, ctx.localPos.y * TILE_PX);
  }

  // ── Players
  const seen = new Set();
  for (const [id, p] of ctx.serverPlayers) {
    seen.add(id);
    let s = scene.playerSprites.get(id);
    if (!s) {
      s = makePlayerSprite(scene, p, ctx);
      scene.playerSprites.set(id, s);
    }
    const isMe = id === ctx.me;
    const px = isMe ? ctx.localPos.x : lerpVal(p.prevX, p.x, lerpAlpha(ctx));
    const py = isMe ? ctx.localPos.y : lerpVal(p.prevY, p.y, lerpAlpha(ctx));
    s.container.setPosition(px * TILE_PX, py * TILE_PX);
    s.aim.setRotation(isMe ? ctx.localAim : p.aim);
    // HP bar
    const f = Math.max(0, p.hp / p.hpMax);
    s.hpFill.width = 44 * f;
    s.hpFill.fillColor = f > 0.5 ? 0x4ade80 : f > 0.25 ? 0xfacc15 : 0xf87171;
    s.nameLbl.setText(p.name);
    s.container.setAlpha(p.alive ? (p.invisible && id !== ctx.me ? 0 : (p.invisible ? 0.4 : 1)) : 0.2);
    if (p.inBush) s.body.fillAlpha = 0.55; else s.body.fillAlpha = 1;
    // Gem count above head
    if (s.gemLbl) s.gemLbl.destroy();
    if (p.gemsHeld > 0) {
      s.gemLbl = scene.add.text(0, -s.r - 36, `💎 ${p.gemsHeld}`, {
        fontSize: '11px', color: '#a5f3fc', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
      s.container.add(s.gemLbl);
    }
    // Star count for bounty
    if (s.starLbl) s.starLbl.destroy();
    if (p.stars > 0) {
      s.starLbl = scene.add.text(0, -s.r - 36, '⭐'.repeat(Math.min(p.stars, 5)), {
        fontSize: '10px', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      s.container.add(s.starLbl);
    }
  }
  for (const [id, s] of scene.playerSprites) {
    if (!seen.has(id)) { s.container.destroy(); scene.playerSprites.delete(id); }
  }

  // ── Projectiles
  const psSeen = new Set();
  for (const [id, pr] of ctx.serverProjectiles) {
    psSeen.add(id);
    let s = scene.bulletSprites.get(id);
    if (!s) {
      s = scene.add.circle(pr.x * TILE_PX, pr.y * TILE_PX, pr.size * TILE_PX, pr.color);
      s.setStrokeStyle(2, 0xffffff, 0.8);
      scene.bulletLayer.add(s);
      scene.bulletSprites.set(id, s);
    }
    const a = lerpAlpha(ctx);
    const x = lerpVal(pr.prevX, pr.x, a) * TILE_PX;
    const y = lerpVal(pr.prevY, pr.y, a) * TILE_PX;
    s.setPosition(x, y);
  }
  for (const [id, s] of scene.bulletSprites) {
    if (!psSeen.has(id)) { s.destroy(); scene.bulletSprites.delete(id); }
  }

  // ── Deployed structures
  for (const s of scene.deployedSprites.values()) s.container?.destroy?.();
  scene.deployedSprites.clear();
  for (const d of ctx.serverDeployed) {
    const container = scene.add.container(d.x * TILE_PX, d.y * TILE_PX);
    let body;
    if (d.kind === 'turret' || d.kind === 'tesla') {
      body = scene.add.rectangle(0, 0, 28, 28, d.color);
      body.setStrokeStyle(3, 0xffffff);
      const top = scene.add.circle(0, 0, 6, 0xffffff);
      container.add(body); container.add(top);
    } else {
      body = scene.add.rectangle(0, 0, 24, 24, 0x808080);
      container.add(body);
    }
    const hpBg = scene.add.rectangle(0, -22, 40, 5, 0x000000, 0.7);
    const hpFill = scene.add.rectangle(-20, -22, 40 * (d.hp / d.hpMax), 5, 0x4ade80).setOrigin(0, 0.5);
    container.add(hpBg); container.add(hpFill);
    scene.fxLayer.add(container);
    scene.deployedSprites.set(d.id, { container });
  }

  // ── Effects (fields, trails)
  for (const s of scene.effectSprites.values()) s.destroy?.();
  scene.effectSprites.clear();
  for (const ef of ctx.serverEffects) {
    let sprite;
    if (ef.kind === 'aoe_field' || ef.kind === 'aoe_ring') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, 0xff4400, 0.18);
      sprite.setStrokeStyle(2, 0xff4400, 0.8);
    } else if (ef.kind === 'heal_field') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, 0x4ade80, 0.18);
      sprite.setStrokeStyle(2, 0x4ade80, 0.8);
    } else if (ef.kind === 'singularity') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, 0x6366f1, 0.22);
      sprite.setStrokeStyle(3, 0xa855f7, 0.9);
    } else if (ef.kind === 'eclipse') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, 0x000000, 0.4);
      sprite.setStrokeStyle(2, 0x4c1d95, 0.9);
    } else if (ef.kind === 'smoke') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, 0x999999, 0.7);
    } else if (ef.kind === 'shockwave') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, ef.color || 0xffffff, 0);
      sprite.setStrokeStyle(4, ef.color || 0xffffff, 0.8);
    } else if (ef.kind === 'dot_trail' || ef.kind === 'dash_trail' || ef.kind === 'slash_trail') {
      sprite = scene.add.graphics();
      sprite.lineStyle(6, ef.color || 0xff4400, 0.6);
      sprite.lineBetween((ef.x || ef.fromX) * TILE_PX, (ef.y || ef.fromY) * TILE_PX,
                         (ef.toX || ef.x + 1) * TILE_PX, (ef.toY || ef.y + 1) * TILE_PX);
    } else if (ef.kind === 'beam') {
      sprite = scene.add.graphics();
      sprite.lineStyle(3, ef.color || 0xffffff, 0.9);
      sprite.lineBetween(ef.from.x * TILE_PX, ef.from.y * TILE_PX, ef.to.x * TILE_PX, ef.to.y * TILE_PX);
    } else if (ef.kind === 'zero_g') {
      sprite = scene.add.circle(ef.x * TILE_PX, ef.y * TILE_PX, ef.radius * TILE_PX, 0x60a5fa, 0.18);
      sprite.setStrokeStyle(2, 0x60a5fa, 0.8);
    }
    if (sprite) {
      scene.effectLayer.add(sprite);
      scene.effectSprites.set(ef.id, sprite);
    }
  }

  // ── Gems, cubes, safes
  for (const s of scene.gemSprites) s.destroy();
  scene.gemSprites = [];
  for (const g of ctx.serverGems) {
    const s = scene.add.star(g.x * TILE_PX, g.y * TILE_PX, 6, 6, 10, 0x4ad6ff);
    s.setStrokeStyle(2, 0xffffff);
    scene.dynamicLayer.add(s);
    scene.gemSprites.push(s);
  }
  for (const s of scene.cubeSprites) s.destroy();
  scene.cubeSprites = [];
  if (ctx.modeState.cubes) {
    for (const c of ctx.modeState.cubes) {
      const s = scene.add.rectangle(c.x * TILE_PX, c.y * TILE_PX, 16, 16, 0xfb923c);
      s.setStrokeStyle(2, 0xffffff);
      scene.dynamicLayer.add(s);
      scene.cubeSprites.push(s);
    }
  }
  for (const k of Object.keys(scene.safeSprites)) { scene.safeSprites[k].destroy(); }
  scene.safeSprites = {};
  if (ctx.modeState.safes) {
    for (const [team, safe] of Object.entries(ctx.modeState.safes)) {
      const teamColor = team === '1' ? 0x4ad6ff : 0xff6b9d;
      const c = scene.add.container(safe.x * TILE_PX, safe.y * TILE_PX);
      const r = scene.add.rectangle(0, 0, 48, 48, 0x222222);
      r.setStrokeStyle(4, teamColor);
      c.add(r);
      const hpBg = scene.add.rectangle(0, -34, 64, 6, 0x000000, 0.8);
      const hpFill = scene.add.rectangle(-32, -34, 64 * (safe.hp / safe.hpMax), 6, teamColor).setOrigin(0, 0.5);
      c.add(hpBg); c.add(hpFill);
      const lbl = scene.add.text(0, 0, '🔒', { fontSize: '20px' }).setOrigin(0.5);
      c.add(lbl);
      scene.dynamicLayer.add(c);
      scene.safeSprites[team] = c;
    }
  }

  // ── Poison cloud overlay for Showdown
  if (scene.poisonRing) scene.poisonRing.destroy();
  if (ctx.modeState.poisonRadius) {
    scene.poisonRing = scene.add.circle(ctx.modeState.cx * TILE_PX, ctx.modeState.cy * TILE_PX,
      ctx.modeState.poisonRadius * TILE_PX, 0x000000, 0);
    scene.poisonRing.setStrokeStyle(4, 0xa855f7, 0.8);
    scene.fxLayer.add(scene.poisonRing);
  }
}

function lerpAlpha(ctx) {
  return Math.min(1, (performance.now() - ctx.lastSnapAt) / 50); // 20Hz = 50ms interval
}
function lerpVal(a, b, t) { return a + (b - a) * t; }

function makePlayerSprite(scene, p, ctx) {
  const b = ctx.brawlers[p.brawlerId];
  const teamColor = p.team === 1 ? 0x4ad6ff : 0xff6b9d;
  const myTeam = ctx.serverPlayers.get(ctx.me)?.team;
  const friendly = p.id === ctx.me ? 'me' : (myTeam === p.team ? 'ally' : 'enemy');
  const outline = friendly === 'me' ? 0xffffff : (friendly === 'ally' ? 0x4ad6ff : 0xff5566);

  const container = scene.add.container(0, 0);
  const r = (b?.radius || 0.4) * TILE_PX;
  const shadow = scene.add.ellipse(0, r * 0.7, r * 2.2, r * 0.9, 0x000000, 0.4);
  container.add(shadow);
  const body = scene.add.circle(0, 0, r, b?.color || 0x4ad6ff);
  body.setStrokeStyle(3, outline);
  container.add(body);
  // brawler initial letter
  const letter = scene.add.text(0, 0, (b?.name || '?')[0], {
    fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5);
  container.add(letter);
  const aim = scene.add.triangle(0, 0, 0, -4, 0, 4, r + 10, 0, 0xffffff, 0.9);
  container.add(aim);
  const hpBg = scene.add.rectangle(0, -r - 14, 44, 5, 0x000000, 0.7);
  const hpFill = scene.add.rectangle(-22, -r - 14, 44, 5, 0x4ade80).setOrigin(0, 0.5);
  container.add(hpBg); container.add(hpFill);
  const nameLbl = scene.add.text(0, -r - 24, p.name, {
    fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5);
  container.add(nameLbl);
  scene.playerLayer.add(container);
  return { container, body, aim, hpFill, hpBg, nameLbl, r };
}

function spawnExplosionFX(ctx, x, y, radius) {
  const s = ctx.scene.add.circle(x * TILE_PX, y * TILE_PX, radius * TILE_PX, 0xfb923c, 0.6);
  s.setStrokeStyle(3, 0xfcd34d, 1);
  ctx.scene.fxLayer.add(s);
  ctx.scene.tweens.add({ targets: s, alpha: 0, scale: 1.5, duration: 400, onComplete: () => s.destroy() });
}
function spawnHitFX(ctx, x, y, damage) {
  const t = ctx.scene.add.text(x * TILE_PX, y * TILE_PX - 20, `-${damage}`, {
    fontSize: '14px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
  }).setOrigin(0.5);
  ctx.scene.fxLayer.add(t);
  ctx.scene.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 800, onComplete: () => t.destroy() });
}
function spawnDeathFX(ctx, x, y) {
  const s = ctx.scene.add.circle(x * TILE_PX, y * TILE_PX, 10, 0xff5566);
  ctx.scene.fxLayer.add(s);
  ctx.scene.tweens.add({ targets: s, scale: 4, alpha: 0, duration: 600, onComplete: () => s.destroy() });
}

function renderHud(ctx) {
  const me = ctx.serverPlayers.get(ctx.me);
  if (!me) return;

  // Top: score / timer
  const top = ctx.overlay.querySelector('#hud-top');
  const mins = Math.floor(ctx.timeLeft / 60000), secs = Math.floor((ctx.timeLeft % 60000) / 1000);
  const timer = `${mins}:${secs.toString().padStart(2, '0')}`;
  let scoreStr = '';
  if (ctx.mode === 'gem_grab') {
    const gg = ctx.modeState.teamGems || { 1: 0, 2: 0 };
    const countdown = ctx.modeState.countdownLeft ? ` ⏳ ${Math.ceil(ctx.modeState.countdownLeft/1000)}s` : '';
    scoreStr = `<div class="hud-score"><span class="hud-team-1">💎 ${gg[1]}/10</span><span class="hud-timer">⏱ ${timer}${countdown}</span><span class="hud-team-2">💎 ${gg[2]}/10</span></div>`;
  } else if (ctx.mode === 'bounty') {
    const ts = ctx.modeState.teamStars || { 1: 0, 2: 0 };
    scoreStr = `<div class="hud-score"><span class="hud-team-1">⭐ ${ts[1]}</span><span class="hud-timer">⏱ ${timer}</span><span class="hud-team-2">⭐ ${ts[2]}</span></div>`;
  } else if (ctx.mode === 'heist') {
    const s = ctx.modeState.safes;
    if (s) {
      const pct1 = Math.round(s[1].hp / s[1].hpMax * 100);
      const pct2 = Math.round(s[2].hp / s[2].hpMax * 100);
      scoreStr = `<div class="hud-score"><span class="hud-team-1">🏦 ${pct1}%</span><span class="hud-timer">⏱ ${timer}</span><span class="hud-team-2">🏦 ${pct2}%</span></div>`;
    }
  } else if (ctx.mode === 'showdown') {
    scoreStr = `<div class="hud-score"><span class="hud-timer">⏱ ${timer}</span><span>☠ ${ctx.modeState.alive ?? '?'} alive</span></div>`;
  }
  top.innerHTML = scoreStr;

  // Bottom info
  ctx.overlay.querySelector('#hud-info').innerHTML = `
    <strong>${me.name}</strong> · ${ctx.brawlers[me.brawlerId]?.name || '—'}<br>
    ❤ ${me.hp} / ${me.hpMax}<br>
    ⚡ ${ctx.pingMs}ms
  `;

  // Ammo
  const ammoEl = ctx.overlay.querySelector('#hud-ammo');
  let ammoHtml = '<span style="font-weight:700;margin-right:6px;">AMMO</span>';
  for (let i = 0; i < me.ammoMax; i++) {
    ammoHtml += `<div class="ammo-pip ${i < me.ammo ? 'full' : ''}"></div>`;
  }
  ammoEl.innerHTML = ammoHtml;

  // Super button
  const superBtn = ctx.overlay.querySelector('#super-btn');
  if (me.super >= me.superMax) {
    superBtn.classList.add('ready');
    superBtn.textContent = 'SUPER!';
  } else {
    superBtn.classList.remove('ready');
    superBtn.textContent = `${Math.floor(me.super/me.superMax*100)}%`;
  }

  // Gadget button
  const gadgetBtn = ctx.overlay.querySelector('#gadget-btn');
  ctx.overlay.querySelector('#gadget-uses').textContent = me.gadgetUses ?? 0;
  if ((me.gadgetUses ?? 0) <= 0) gadgetBtn.classList.add('disabled');
  else gadgetBtn.classList.remove('disabled');

  // Match status overlay
  const status = ctx.overlay.querySelector('#match-status');
  if (ctx.dead && !ctx.ended) {
    status.className = 'match-status respawn-text';
    status.classList.remove('hidden');
    status.textContent = me.respawnIn > 0 ? `💀 Respawning in ${Math.ceil(me.respawnIn/1000)}s…` : '💀 ELIMINATED';
  } else if (!ctx.ended) {
    status.classList.add('hidden');
  }
}

function showResults(ctx, result) {
  // Build a results screen
  const isShowdown = ctx.mode === 'showdown';
  const me = result.participants.find(p => p.playerId === ctx.me);
  const won = me ? me.placement === 1 : false;

  const titleText = won ? '🏆 VICTORY!' : isShowdown ? `Finished #${me?.placement || '?'}` : '💀 DEFEAT';
  const titleClass = won ? 'victory-text' : 'defeat-text';

  const screen = document.createElement('div');
  screen.className = 'results-screen';
  screen.innerHTML = `
    <div class="results-card">
      <h1 class="${titleClass}">${titleText}</h1>
      <p class="subtitle">${ctx.mode.replace('_', ' ').toUpperCase()}</p>
      <table class="results-table">
        <thead><tr><th>Player</th><th>Brawler</th><th>Place</th><th>K/D</th><th>Damage</th><th>Trophies</th></tr></thead>
        <tbody>
          ${result.participants.sort((a,b)=>a.placement-b.placement).map(p => `
            <tr class="${p.playerId === ctx.me ? 'you' : ''}">
              <td>${p.isBot ? '🤖 ' : ''}${escape(p.displayName)}</td>
              <td>${p.brawlerId}</td>
              <td>#${p.placement}</td>
              <td>${p.kills}/${p.deaths}</td>
              <td>${(p.damageDealt||0).toLocaleString()}</td>
              <td class="trophy-delta ${p.trophyChange >= 0 ? 'gain' : 'loss'}">${p.trophyChange >= 0 ? '+' : ''}${p.trophyChange}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="text-align: center; margin-top: 24px;">
        <button class="btn btn-primary btn-large" id="back-btn">▶ Continue</button>
      </div>
    </div>
  `;
  document.body.appendChild(screen);
  screen.querySelector('#back-btn').onclick = async () => {
    // Tear down game
    if (ctx.game) ctx.game.destroy(true);
    if (ctx.ws && ctx.ws.readyState === 1) ctx.ws.close();
    ctx.overlay.remove();
    screen.remove();
    await ctx.app.refreshProfile();
    ctx.app.go('home');
  };
}

function escape(s) {
  return String(s).replace(/[<>&"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

import { api } from '../api.js';

const RARITY_COLORS = {
  STARTING: '#9ca3af', COMMON: '#60a5fa', RARE: '#4ade80',
  SUPER_RARE: '#fb923c', EPIC: '#c084fc', MYTHIC: '#f87171', LEGENDARY: '#fcd34d',
};

export function renderCollection(root, app) {
  const profile = app.profile;
  const catalog = app.catalog;

  root.innerHTML = `
    <div class="card" style="margin-bottom: 20px;">
      <h2>🎴 Brawler Collection</h2>
      <p style="color: var(--text-dim); margin: 0;">${Object.keys(profile.brawlers).length} of ${catalog.brawlerOrder.length} unlocked</p>
    </div>

    <div class="brawler-grid">
      ${catalog.brawlerOrder.map(id => {
        const b = catalog.brawlers.find(x => x.id === id);
        const owned = profile.brawlers[id];
        const color = RARITY_COLORS[b.rarity];
        const portrait = b.name[0];
        return `
          <div class="brawler-card ${owned ? '' : 'locked'}" data-id="${id}">
            ${owned ? `<div class="brawler-power">⚡${owned.powerLevel}</div>` : ''}
            ${owned ? `<div class="brawler-trophies">🏆 ${owned.trophies}</div>` : ''}
            <div class="brawler-portrait" style="color: ${color}; background: ${color}22;">${portrait}</div>
            <div class="brawler-name">${b.name}</div>
            <div class="brawler-rarity" style="color: ${color}">${b.rarity}</div>
            ${owned ? '' : '<div style="margin-top: 6px; font-size: 11px; color: var(--text-dim);">🔒 Locked</div>'}
          </div>
        `;
      }).join('')}
    </div>

    <div class="card" style="margin-top: 24px; text-align: center;">
      <h3>📦 Try your luck</h3>
      <p style="color: var(--text-dim);">Open boxes to unlock new Brawlers, Power Points, and Gold!</p>
      <div class="row" style="justify-content: center; margin-top: 12px;">
        <button class="btn btn-primary" data-open="brawl">Brawl Box (100 ⚡)</button>
        <button class="btn btn-warning" data-open="big">Big Box (300 ⚡)</button>
        <button class="btn btn-gold"    data-open="mega">Mega Box (1000 ⚡)</button>
      </div>
    </div>
  `;

  for (const c of root.querySelectorAll('.brawler-card')) {
    c.onclick = () => {
      const id = c.dataset.id;
      if (profile.brawlers[id]) app.go('brawler', id);
      else app.toast('Brawler not yet unlocked. Open boxes!', 'info');
    };
  }
  for (const b of root.querySelectorAll('[data-open]')) {
    b.onclick = async () => {
      try {
        const r = await api.post('/api/box/open', { type: b.dataset.open });
        if (r.error) throw new Error(r.error);
        app.profile = r.profile; app.updateTopBar();
        showBoxModal(r.items, () => { app.go('collection'); });
      } catch (e) { app.toast(e.message, 'error'); }
    };
  }
}

function showBoxModal(items, onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>📦 Box Opened!</h2>
      <div class="box-rewards">
        ${items.map(it => {
          if (it.kind === 'brawler') {
            return `<div class="box-reward brawler" style="color: ${RARITY_COLORS[it.rarity]}">🎉 New Brawler: <strong>${it.id}</strong></div>`;
          }
          if (it.kind === 'power_points') {
            return `<div class="box-reward">🔮 ${it.amount} Power Points (${it.brawlerId})</div>`;
          }
          if (it.kind === 'gold') {
            return `<div class="box-reward">🪙 ${it.amount} Gold</div>`;
          }
          return `<div class="box-reward">${JSON.stringify(it)}</div>`;
        }).join('')}
      </div>
      <button class="btn btn-primary btn-large">Awesome!</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('button').onclick = () => { backdrop.remove(); onClose(); };
}

export function renderBrawlerDetail(root, app, id) {
  const catalog = app.catalog;
  const profile = app.profile;
  const b = catalog.brawlers.find(x => x.id === id);
  const owned = profile.brawlers[id];
  if (!owned) { app.go('collection'); return; }

  const color = RARITY_COLORS[b.rarity];
  const costNext = owned.powerLevel < 10
    ? { gold: [20,35,75,140,290,580,1125,1900,3000][owned.powerLevel - 1],
        pp:   [20,30,50, 80,130,210, 340, 550, 890][owned.powerLevel - 1] }
    : null;

  root.innerHTML = `
    <button class="btn btn-ghost" onclick="window.app.go('collection')">← Back</button>
    <div style="display:grid;grid-template-columns: 320px 1fr; gap: 24px; margin-top: 20px;">
      <div class="brawler-detail" style="position: static;">
        <div class="big-portrait" style="color: ${color}; background: ${color}22;">${b.name[0]}</div>
        <h2 style="text-align: center; margin: 0;">${b.name}</h2>
        <div style="text-align: center; color: ${color}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">${b.rarity} · ${b.theme}</div>

        <div class="brawler-stats" style="margin-top: 16px;">
          <div class="stat"><span>Power Level</span><strong>⚡ ${owned.powerLevel}/10</strong></div>
          <div class="stat"><span>Trophies</span><strong>🏆 ${owned.trophies}</strong></div>
          <div class="stat"><span>Health</span><strong>${b.health}</strong></div>
          <div class="stat"><span>Attack DMG</span><strong>${b.attack.damage || b.attack.damagePerBullet || b.attack.heal || '—'}</strong></div>
          <div class="stat"><span>Range</span><strong>${b.attackRange} tiles</strong></div>
          <div class="stat"><span>Speed</span><strong>${b.moveSpeed.toFixed(1)}</strong></div>
          <div class="stat"><span>Ammo</span><strong>${b.ammoMax}</strong></div>
          <div class="stat"><span>Wins / Losses</span><strong>${owned.wins} / ${owned.losses}</strong></div>
          <div class="stat"><span>Power Points</span><strong>🔮 ${owned.powerPoints}</strong></div>
        </div>

        ${costNext ? `
          <button class="btn btn-success btn-large" id="upgrade-btn" style="width: 100%; margin-top: 14px;"
            ${(profile.gold < costNext.gold || owned.powerPoints < costNext.pp) ? 'disabled' : ''}>
            Upgrade → Level ${owned.powerLevel + 1}<br>
            <span style="font-size:11px;font-weight:400;">🪙 ${costNext.gold} · 🔮 ${costNext.pp}</span>
          </button>
        ` : '<div style="text-align: center; color: var(--gold); margin-top: 14px;">⭐ MAX LEVEL</div>'}
      </div>

      <div>
        <div class="card">
          <h3>⚔ Main Attack</h3>
          <div class="ability">
            <div class="ability-name">${b.attack.kind.replace(/_/g, ' ')}</div>
            <div class="ability-desc">${describeAttack(b.attack)}</div>
          </div>

          <h3 style="margin-top: 20px;">💥 Super</h3>
          <div class="ability">
            <div class="ability-name">${b.super.kind.replace(/_/g, ' ')}</div>
            <div class="ability-desc">${describeSuper(b.super)}</div>
          </div>

          <h3 style="margin-top: 20px;">🔧 Gadget ${owned.gadgetUnlocked ? '' : '<span class="locked-badge">LVL 7</span>'}</h3>
          <div class="ability ${owned.gadgetUnlocked ? '' : 'locked'}">
            <div class="ability-name">${b.gadget.kind.replace(/_/g, ' ')} (${b.gadget.uses} uses)</div>
            <div class="ability-desc">${describeGadget(b.gadget)}</div>
          </div>

          <h3 style="margin-top: 20px;">⭐ Star Power 1 ${owned.starPower1Unlocked ? '' : '<span class="locked-badge">LVL 9</span>'}</h3>
          <div class="ability ${owned.starPower1Unlocked ? '' : 'locked'}">
            <div class="ability-name">${b.starPower1.name}</div>
            <div class="ability-desc">${b.starPower1.desc}</div>
          </div>

          <h3 style="margin-top: 20px;">⭐ Star Power 2 ${owned.starPower2Unlocked ? '' : '<span class="locked-badge">LVL 10</span>'}</h3>
          <div class="ability ${owned.starPower2Unlocked ? '' : 'locked'}">
            <div class="ability-name">${b.starPower2.name}</div>
            <div class="ability-desc">${b.starPower2.desc}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  const upBtn = root.querySelector('#upgrade-btn');
  if (upBtn) upBtn.onclick = async () => {
    try {
      const r = await api.post('/api/upgrade', { brawlerId: id });
      if (r.error) throw new Error(r.error);
      app.profile = r.profile; app.updateTopBar();
      app.toast(`${b.name} is now Power Level ${r.profile.brawlers[id].powerLevel}!`, 'success');
      app.go('brawler', id);
    } catch (e) { app.toast(e.message, 'error'); }
  };
}

function describeAttack(a) {
  switch (a.kind) {
    case 'projectile': return `Single ${a.damage} dmg projectile.`;
    case 'multi_projectile': return `Fires ${a.bullets} projectiles, ${a.damagePerBullet} dmg each.`;
    case 'piercing': return `${a.damage} dmg projectile that pierces all enemies.`;
    case 'aoe_burst': return `Explosive projectile, ${a.damage} dmg in ${a.radius || 1} tile radius${a.pulses > 1 ? ` (${a.pulses} pulses)` : ''}.`;
    case 'chain': return `${a.damage} dmg primary, chains for ${a.chainDamage} dmg.`;
    case 'dash_slash': return `Dash ${a.distance} tiles dealing ${a.damage} dmg to all in path.`;
    case 'heal_beam': return `Auto-heals nearest ally for ${a.heal}, or damages enemies for ${a.damage}.`;
    case 'minigun_burst': return `Burst of ${a.bullets} bullets, ${a.damagePerBullet} dmg each.`;
    case 'gravity_orb': return `${a.damage} dmg orb that pulls enemies inward.`;
    case 'homing': return `Slow ${a.damage} dmg projectile that homes on enemies within ${a.seekRadius}t.`;
    default: return '';
  }
}
function describeSuper(s) {
  switch (s.kind) {
    case 'dash_charge': return `Invulnerable charge ${s.distance}t, ${s.damage} dmg + knockback.`;
    case 'speed_boost': return `Buffs speed ×${s.speedMul}, reload ×${1/s.reloadMul}, damage ×${s.damageMul} for ${s.durationMs/1000}s.`;
    case 'aoe_field': return `${s.radius}t radius DoT field, ${s.dps}/s + ${(s.slowFactor*100)|0}% slow for ${s.durationMs/1000}s.`;
    case 'aoe_ring': return `${s.radius}t ring of fire centered on self, ${s.dps}/s for ${s.durationMs/1000}s.`;
    case 'invisibility': return `Turn invisible for ${s.durationMs/1000}s with +${((s.speedMul-1)*100)|0}% speed.`;
    case 'barrage': return `Fires ${s.bullets} explosive shells in a ${s.coneDeg}° cone.`;
    case 'heal_field': return `${s.radius}t radius heal aura, +${s.hps} HP/s + speed boost for ${s.durationMs/1000}s.`;
    case 'dash_speed': return `${s.durationMs/1000}s of ×${s.speedMul} speed, contact dmg ${s.contactDamage}.`;
    case 'deploy': return `Deploys ${s.structure} (${s.hp} HP) for ${s.durationMs/1000}s.`;
    case 'singularity': return `${s.radius}t pull zone, ${s.dps}/s, ${s.finalDamage} explosion finale.`;
    case 'vision_zone': return `${s.radius}t zone giving allies ×${s.allyDamageMul} dmg & limiting enemy vision.`;
    default: return '';
  }
}
function describeGadget(g) {
  switch (g.kind) {
    case 'place_wall':  return `Place a ${g.length}-tile breakable wall.`;
    case 'shield':      return `Personal shield absorbing ${g.absorbHp} dmg for ${g.durationMs/1000}s.`;
    case 'root_next':   return `Next attack roots target for ${g.rootMs/1000}s.`;
    case 'dash_trail':  return `Dash ${g.distance}t leaving a damaging fire trail.`;
    case 'stun_pulse':  return `Stun all enemies within ${g.radius}t for ${g.stunMs/1000}s.`;
    case 'haunt_decoy': return `Spawns a decoy that mimics your movement.`;
    case 'ground_pound':return `${g.radius}t AoE stomp dealing ${g.damage} dmg.`;
    case 'revive':      return `Revive a recently-fallen ally at ${g.hpFraction*100}% HP.`;
    case 'smoke':       return `Drop a smoke cloud blinding enemies.`;
    case 'repair':      return `Repair all your deployed structures.`;
    case 'zero_g':      return `Create a zero-G zone that immobilizes enemies.`;
    case 'fear_pulse':  return `Force enemies to flee for ${g.durationMs/1000}s.`;
    default: return '';
  }
}

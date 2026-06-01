import { api } from '../api.js';

const RARITY_COLORS = {
  STARTING: '#9ca3af', COMMON: '#60a5fa', RARE: '#4ade80',
  SUPER_RARE: '#fb923c', EPIC: '#c084fc', MYTHIC: '#f87171', LEGENDARY: '#fcd34d',
};

export function renderBrawlerSelect(root, app, { mode }) {
  const profile = app.profile;
  const catalog = app.catalog;
  const modeDef = catalog.modes[mode];

  let selectedId = Object.keys(profile.brawlers)[0];

  function rerender() {
    const ownedIds = Object.keys(profile.brawlers);
    const sel = profile.brawlers[selectedId];
    const b = catalog.brawlers.find(x => x.id === selectedId);
    const color = RARITY_COLORS[b.rarity];

    root.innerHTML = `
      <button class="btn btn-ghost" onclick="window.app.go('home')">← Back</button>
      <div class="card" style="margin: 20px 0;">
        <h2>${modeDef.name}</h2>
        <p style="color: var(--text-dim); margin: 0;">${modeDef.description}</p>
      </div>

      <div class="brawler-select">
        <div>
          <h3>Choose your Brawler</h3>
          <div class="brawler-grid">
            ${catalog.brawlerOrder.map(id => {
              const owned = profile.brawlers[id];
              const cb = catalog.brawlers.find(x => x.id === id);
              const c = RARITY_COLORS[cb.rarity];
              return `
                <div class="brawler-card ${owned ? '' : 'locked'} ${id === selectedId ? 'selected' : ''}" data-pick="${id}">
                  ${owned ? `<div class="brawler-power">⚡${owned.powerLevel}</div>` : ''}
                  <div class="brawler-portrait" style="color: ${c}; background: ${c}22;">${cb.name[0]}</div>
                  <div class="brawler-name">${cb.name}</div>
                  <div class="brawler-rarity" style="color: ${c}">${cb.rarity}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="brawler-detail">
          <div class="big-portrait" style="color: ${color}; background: ${color}22;">${b.name[0]}</div>
          <h2 style="text-align: center; margin: 0;">${b.name}</h2>
          <div style="text-align: center; color: ${color}; font-size: 13px; margin-bottom: 12px;">${b.theme}</div>
          <div class="brawler-stats">
            <div class="stat"><span>Health</span><strong>${b.health}</strong></div>
            <div class="stat"><span>Damage</span><strong>${b.attack.damage || b.attack.damagePerBullet || '—'}</strong></div>
            <div class="stat"><span>Range</span><strong>${b.attackRange}t</strong></div>
            <div class="stat"><span>Power Level</span><strong>⚡ ${sel.powerLevel}</strong></div>
          </div>
          <button class="btn btn-primary btn-large" style="width: 100%; margin-top: 16px;" id="play-btn">
            ▶ Play Match
          </button>
          <button class="btn btn-ghost" style="width: 100%; margin-top: 8px;" id="play-bots-btn">
            🤖 Quick Play (vs Bots)
          </button>
          <p style="color: var(--text-dim); font-size: 11px; text-align: center; margin-top: 10px;">
            Quick Play fills empty slots with bots immediately.
          </p>
        </div>
      </div>
    `;

    for (const c of root.querySelectorAll('[data-pick]')) {
      c.onclick = () => {
        if (!profile.brawlers[c.dataset.pick]) {
          app.toast('You don\'t own this Brawler yet!', 'error');
          return;
        }
        selectedId = c.dataset.pick;
        rerender();
      };
    }
    root.querySelector('#play-btn').onclick = () => queue(false);
    root.querySelector('#play-bots-btn').onclick = () => queue(true);
  }

  async function queue(withBots) {
    try {
      const r = await api.post('/api/queue/join', {
        mode, brawlerId: selectedId, wantBots: withBots,
      });
      if (r.error) throw new Error(r.error);
      app.toast('Searching for match…', 'info');
      // Poll for match
      pollForMatch(app);
    } catch (e) { app.toast(e.message, 'error'); }
  }

  rerender();
}

async function pollForMatch(app) {
  const startedAt = Date.now();
  const interval = setInterval(async () => {
    try {
      const r = await api.get('/api/match/poll');
      if (r.matchId) {
        clearInterval(interval);
        app.go('match', { matchId: r.matchId });
      } else if (Date.now() - startedAt > 30000) {
        clearInterval(interval);
        app.toast('Match search timed out.', 'error');
      }
    } catch (e) {
      clearInterval(interval);
      app.toast(e.message, 'error');
    }
  }, 800);
}

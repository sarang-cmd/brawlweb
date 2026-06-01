import { api } from '../api.js';

export function renderTrophyRoad(root, app) {
  const profile = app.profile;
  const road = app.catalog.trophyRoad;
  root.innerHTML = `
    <div class="card" style="margin-bottom: 20px;">
      <h2>🏆 Trophy Road</h2>
      <p style="margin: 0; color: var(--text-dim);">Total trophies: <strong style="color:var(--gold)">${profile.totalTrophies}</strong></p>
    </div>
    <div class="tr-list">
      ${road.map((m, i) => {
        const pct = Math.min(100, Math.round(profile.totalTrophies / m.trophies * 100));
        const claimed = profile.trophyRoadClaimed.includes(i);
        const unlockable = profile.totalTrophies >= m.trophies && !claimed;
        const rewardStr = formatReward(m.reward);
        return `
          <div class="tr-milestone ${claimed ? 'claimed' : ''} ${unlockable ? 'unlockable' : ''}">
            <div style="font-size: 18px; font-weight: 900; color: var(--gold); min-width: 80px;">🏆 ${m.trophies}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">${rewardStr}</div>
              <div class="tr-bar"><div class="tr-bar-fill" style="width: ${pct}%"></div></div>
            </div>
            <div>
              ${claimed
                ? '<span style="color:var(--green);font-weight:700;">✓ Claimed</span>'
                : unlockable
                  ? `<button class="btn btn-gold" data-claim="${i}">Claim</button>`
                  : `<span style="color:var(--text-dim);font-size:12px;">${m.trophies - profile.totalTrophies} to go</span>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  for (const b of root.querySelectorAll('[data-claim]')) {
    b.onclick = async () => {
      try {
        const r = await api.post('/api/trophyroad/claim', { index: +b.dataset.claim });
        if (r.error) throw new Error(r.error);
        app.profile = r.profile; app.updateTopBar();
        app.toast('Reward claimed!', 'success');
        app.go('trophyroad');
      } catch (e) { app.toast(e.message, 'error'); }
    };
  }
}

function formatReward(r) {
  const parts = [];
  if (r.gold) parts.push(`🪙 ${r.gold} Gold`);
  if (r.gems) parts.push(`💎 ${r.gems} Gems`);
  if (r.brawlTokens) parts.push(`⚡ ${r.brawlTokens} Tokens`);
  if (r.brawlerToken) parts.push(`🎴 Random ${r.brawlerToken.replace('_', ' ')} Brawler`);
  return parts.join(', ');
}

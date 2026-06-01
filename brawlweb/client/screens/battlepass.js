import { api } from '../api.js';

export function renderBattlePass(root, app) {
  const profile = app.profile;
  const tiers = app.catalog.battlePassRewards;
  const tierProgress = (profile.battlePassXP / 100) * 100;

  root.innerHTML = `
    <div class="bp-summary">
      <h2 style="margin: 0;">🎟 Battle Pass — Season 1</h2>
      <p style="color: var(--text-dim); margin: 4px 0 8px;">"Storm Rising" — earn rewards by playing.</p>
      <div>
        <strong style="font-size: 24px; color: var(--gold);">Tier ${profile.battlePassTier} / 60</strong>
        ${profile.battlePassPremium
          ? '<span style="margin-left: 12px; background: var(--gold); color: #1a0a00; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">✨ PREMIUM</span>'
          : '<button class="btn btn-gold" style="margin-left: 12px;" onclick="window.app.go(\'shop\')">Upgrade for 169💎</button>'}
      </div>
      <div class="bp-progress-bar"><div class="bp-progress-fill" style="width: ${tierProgress}%"></div></div>
      <div style="color: var(--text-dim); font-size: 12px;">${profile.battlePassXP} / 100 XP to next tier</div>
    </div>

    <div class="bp-tiers">
      ${tiers.map(t => {
        const unlocked = profile.battlePassTier >= t.tier;
        const claimed = profile.battlePassClaimed.includes(t.tier);
        const freeStr = t.free ? Object.entries(t.free).map(([k,v]) => `${v} ${k}`).join(',') : '—';
        const premStr = Object.entries(t.premium).map(([k,v]) => `${v} ${k}`).join(',');
        return `
          <div class="bp-tier ${unlocked ? 'unlocked' : ''}">
            <div class="tier-num">Tier ${t.tier}</div>
            <div class="tier-rwd"><strong>Free:</strong> ${freeStr}</div>
            <div class="tier-rwd"><strong>Premium:</strong> ${premStr}</div>
            ${claimed
              ? '<div style="color:var(--green);margin-top:6px;">✓ Claimed</div>'
              : unlocked
                ? `<button class="btn btn-success" style="margin-top:6px;font-size:11px;padding:4px 10px;" data-bp-tier="${t.tier}">Claim</button>`
                : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  for (const b of root.querySelectorAll('[data-bp-tier]')) {
    b.onclick = async () => {
      try {
        const r = await api.post('/api/bp/claim', { tier: +b.dataset.bpTier });
        if (r.error) throw new Error(r.error);
        app.profile = r.profile; app.updateTopBar();
        app.toast('Battle Pass tier claimed!', 'success');
        app.go('battlepass');
      } catch (e) { app.toast(e.message, 'error'); }
    };
  }
}

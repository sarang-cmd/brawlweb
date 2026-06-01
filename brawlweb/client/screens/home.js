import { api } from '../api.js';

const MODE_DESCRIPTIONS = {
  gem_grab: { emoji: '💎', tag: '3v3 · Objective' },
  showdown: { emoji: '☠',  tag: '1v9 · Battle Royale' },
  bounty:   { emoji: '⭐', tag: '3v3 · Score' },
  heist:    { emoji: '🏦', tag: '3v3 · Attack/Defend' },
};

export function renderHome(root, app) {
  const profile = app.profile;
  const modes = Object.values(app.catalog.modes);

  // ── Daily/weekly quests
  const dailyQuests = (profile.quests || []).map(q => renderQuestRow(q)).join('');
  const weeklyQuests = (profile.weeklyQuests || []).map(q => renderQuestRow(q)).join('');

  root.innerHTML = `
    <div class="home-hero">
      <div class="hero-text">
        <h1>Welcome back, ${escapeHtml(profile.displayName)}!</h1>
        <p>You have <strong>${Object.keys(profile.brawlers).length}</strong> Brawler${Object.keys(profile.brawlers).length === 1 ? '' : 's'} unlocked.</p>
        <p style="color: var(--gold);">🏆 ${profile.totalTrophies} total trophies · 🏅 ${profile.totalWins} wins</p>
      </div>
    </div>

    <h2 style="margin: 0 0 16px;">⚡ Choose a Mode</h2>
    <div class="mode-grid">
      ${modes.map(m => {
        const d = MODE_DESCRIPTIONS[m.id] || {};
        return `
          <div class="mode-card" data-mode="${m.id}">
            <h3>${d.emoji || '🎮'} ${m.name}</h3>
            <div class="desc">${escapeHtml(m.description || '')}</div>
            <div class="meta">${d.tag || ''}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top: 24px;">
      <div class="card">
        <h2>📋 Daily Quests</h2>
        <div class="quest-list">${dailyQuests || '<div style="color:var(--text-dim)">No quests yet — play a match!</div>'}</div>
      </div>
      <div class="card">
        <h2>🗓 Weekly Quests</h2>
        <div class="quest-list">${weeklyQuests || ''}</div>
      </div>
    </div>

    ${renderRecentMatches(profile)}
  `;

  // Wire mode clicks → go to brawler select
  for (const card of root.querySelectorAll('.mode-card')) {
    card.onclick = () => app.go('brawler_select', { mode: card.dataset.mode });
  }

  // Quest claim buttons
  for (const btn of root.querySelectorAll('[data-claim-quest]')) {
    btn.onclick = async () => {
      try {
        const r = await api.post('/api/quest/claim', { questId: btn.dataset.claimQuest });
        if (r.error) throw new Error(r.error);
        app.profile = r.profile; app.updateTopBar(); app.toast('Quest reward claimed!', 'success');
        app.go('home');
      } catch (e) { app.toast(e.message, 'error'); }
    };
  }
}

function renderQuestRow(q) {
  const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
  const done = q.progress >= q.target;
  const rewardStr = Object.entries(q.reward).map(([k, v]) => `${v} ${k}`).join(', ');
  return `
    <div class="quest ${done && !q.claimed ? 'complete' : ''}">
      <div>
        <div class="quest-text">${escapeHtml(q.text)}</div>
        <div class="quest-progress"><div class="quest-progress-fill" style="width: ${pct}%"></div></div>
        <div class="quest-bar-label">${q.progress} / ${q.target}</div>
        <div class="quest-reward">Reward: ${rewardStr}</div>
      </div>
      <div>
        ${q.claimed
          ? '<span style="color:var(--text-dim);font-size:12px;">✓ Claimed</span>'
          : done
            ? `<button class="btn btn-success" data-claim-quest="${q.id}">Claim</button>`
            : `<span style="color:var(--text-dim);font-size:12px;">In progress</span>`}
      </div>
    </div>
  `;
}

function renderRecentMatches(profile) {
  const matches = (profile.matchHistory || []).slice(0, 5);
  if (!matches.length) return '';
  return `
    <div class="card" style="margin-top: 24px;">
      <h2>🕓 Recent Matches</h2>
      <table class="lb-table">
        <thead><tr><th>Mode</th><th>Brawler</th><th>Result</th><th>K/D</th><th>Damage</th><th>Trophies</th></tr></thead>
        <tbody>
          ${matches.map(m => `
            <tr>
              <td>${m.mode}</td>
              <td>${m.brawlerId}</td>
              <td>${m.placement === 1 ? '<span style="color:var(--green)">Win</span>' : '<span style="color:var(--red)">Loss</span>'}</td>
              <td>${m.kills}/${m.deaths}</td>
              <td>${m.damageDealt.toLocaleString()}</td>
              <td class="trophy-delta ${m.trophyChange >= 0 ? 'gain' : 'loss'}">${m.trophyChange >= 0 ? '+' : ''}${m.trophyChange}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

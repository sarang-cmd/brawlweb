import { api } from '../api.js';

export async function renderLeaderboard(root, app) {
  root.innerHTML = '<div class="card"><h2>📊 Global Leaderboard</h2><p style="color:var(--text-dim)">Loading…</p></div>';
  try {
    const r = await api.get('/api/leaderboard');
    root.innerHTML = `
      <div class="card">
        <h2>📊 Global Leaderboard</h2>
        <table class="lb-table">
          <thead><tr><th>Rank</th><th>Player</th><th>Trophies</th><th>Wins</th></tr></thead>
          <tbody>
            ${r.leaderboard.map((p, i) => `
              <tr ${p.displayName === app.profile.displayName ? 'style="background:rgba(74,214,255,0.08)"' : ''}>
                <td class="lb-rank">#${i + 1}</td>
                <td>${escape(p.displayName)}</td>
                <td>🏆 ${p.totalTrophies}</td>
                <td>${p.totalWins}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    root.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`;
  }
}
function escape(s) { return String(s).replace(/[<>&"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

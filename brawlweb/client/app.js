// BrawlWeb client app — screen router + state.

import { api } from './api.js';
import { renderAuth } from './screens/auth.js';
import { renderHome } from './screens/home.js';
import { renderCollection, renderBrawlerDetail } from './screens/collection.js';
import { renderTrophyRoad } from './screens/trophyroad.js';
import { renderShop } from './screens/shop.js';
import { renderBattlePass } from './screens/battlepass.js';
import { renderLeaderboard } from './screens/leaderboard.js';
import { renderBrawlerSelect } from './screens/brawler_select.js';
import { startMatch } from './screens/match.js';

class App {
  constructor() {
    this.token = localStorage.getItem('bw_token');
    this.profile = null;
    this.catalog = null;
    this.screenName = null;
    this.screenArgs = null;
  }

  async boot() {
    // Always fetch catalog (public)
    try { this.catalog = await api.get('/api/catalog'); }
    catch (e) { console.error('catalog failed', e); }

    if (this.token) {
      try {
        const r = await api.get('/api/profile');
        this.profile = r.profile;
        this.afterLogin();
      } catch (e) {
        this.token = null; localStorage.removeItem('bw_token');
        this.showAuth();
      }
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    document.getElementById('topbar').classList.add('hidden');
    document.getElementById('navbar').classList.add('hidden');
    document.body.innerHTML = '<div class="auth-bg"></div>' + document.body.innerHTML;
    const root = document.querySelector('.auth-bg');
    renderAuth(root, async (token) => {
      this.token = token;
      localStorage.setItem('bw_token', token);
      api.token = token;
      const r = await api.get('/api/profile');
      this.profile = r.profile;
      document.querySelector('.auth-bg')?.remove();
      this.afterLogin();
    });
  }

  afterLogin() {
    api.token = this.token;
    document.getElementById('topbar').classList.remove('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    this.updateTopBar();
    this.go('home');
  }

  async logout() {
    try { await api.del('/api/auth/logout'); } catch {}
    this.token = null; this.profile = null;
    localStorage.removeItem('bw_token');
    location.reload();
  }

  updateTopBar() {
    if (!this.profile) return;
    document.getElementById('res-trophies').textContent = this.profile.totalTrophies;
    document.getElementById('res-gold').textContent = this.profile.gold;
    document.getElementById('res-tokens').textContent = this.profile.brawlTokens;
    document.getElementById('res-gems').textContent = this.profile.gems;
    document.getElementById('user-name').textContent = this.profile.displayName;
  }

  async refreshProfile() {
    const r = await api.get('/api/profile');
    this.profile = r.profile;
    this.updateTopBar();
    // Re-render current screen
    if (this.screenName) this.go(this.screenName, this.screenArgs);
  }

  go(screen, args = null) {
    this.screenName = screen;
    this.screenArgs = args;
    const root = document.getElementById('screen');
    root.innerHTML = '';
    for (const b of document.querySelectorAll('#navbar button')) {
      b.classList.toggle('active', b.dataset.screen === screen);
    }
    switch (screen) {
      case 'home':        renderHome(root, this); break;
      case 'collection':  renderCollection(root, this); break;
      case 'brawler':     renderBrawlerDetail(root, this, args); break;
      case 'trophyroad':  renderTrophyRoad(root, this); break;
      case 'shop':        renderShop(root, this); break;
      case 'battlepass':  renderBattlePass(root, this); break;
      case 'leaderboard': renderLeaderboard(root, this); break;
      case 'brawler_select': renderBrawlerSelect(root, this, args); break;
      case 'match':       startMatch(this, args); break;
      default: root.innerHTML = '<div class="card"><h2>Unknown screen</h2></div>';
    }
  }

  toast(msg, kind = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
}

window.app = new App();
window.app.boot();

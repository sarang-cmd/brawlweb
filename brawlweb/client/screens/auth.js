import { api } from '../api.js';

export function renderAuth(root, onLogin) {
  root.innerHTML = `
    <div class="auth-card">
      <h1>⚔ BrawlWeb</h1>
      <p class="tagline">Browser arena brawler.<br>No install. Just play.</p>
      <div class="auth-tabs">
        <button data-tab="login" class="active">Log In</button>
        <button data-tab="register">Register</button>
      </div>
      <form class="auth-form" id="auth-form">
        <div>
          <label class="label">Username</label>
          <input class="input" id="auth-username" type="text" required minlength="3" maxlength="20" autocomplete="username" />
        </div>
        <div>
          <label class="label">Password</label>
          <input class="input" id="auth-password" type="password" required minlength="4" autocomplete="current-password" />
        </div>
        <div id="auth-error" class="auth-error hidden"></div>
        <button class="btn btn-large btn-primary" type="submit" id="auth-submit">Log In</button>
      </form>
      <div class="auth-guest">
        <p style="color: var(--text-dim); font-size: 13px; margin: 0 0 10px;">Or jump right in:</p>
        <button class="btn btn-ghost" id="guest-btn">▶ Play as Guest</button>
      </div>
    </div>
  `;
  let mode = 'login';
  const setMode = (m) => {
    mode = m;
    for (const b of root.querySelectorAll('.auth-tabs button')) b.classList.toggle('active', b.dataset.tab === m);
    root.querySelector('#auth-submit').textContent = m === 'login' ? 'Log In' : 'Register';
  };
  for (const b of root.querySelectorAll('.auth-tabs button')) {
    b.onclick = () => setMode(b.dataset.tab);
  }
  root.querySelector('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = root.querySelector('#auth-username').value.trim();
    const password = root.querySelector('#auth-password').value;
    const errEl = root.querySelector('#auth-error');
    errEl.classList.add('hidden');
    try {
      const r = await api.post(mode === 'login' ? '/api/auth/login' : '/api/auth/register', { username, password });
      onLogin(r.token);
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  };
  root.querySelector('#guest-btn').onclick = async () => {
    try {
      const r = await api.post('/api/auth/guest', {});
      onLogin(r.token);
    } catch (e) {
      const errEl = root.querySelector('#auth-error');
      errEl.textContent = e.message; errEl.classList.remove('hidden');
    }
  };
}

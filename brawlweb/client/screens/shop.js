import { api } from '../api.js';

const RARITY_COLORS = {
  STARTING: '#9ca3af', COMMON: '#60a5fa', RARE: '#4ade80',
  SUPER_RARE: '#fb923c', EPIC: '#c084fc', MYTHIC: '#f87171', LEGENDARY: '#fcd34d',
};

export function renderShop(root, app) {
  const offers = app.catalog.shopOffers;
  const packs = app.catalog.gemPacks;

  root.innerHTML = `
    <div class="shop-section">
      <h2>💎 Daily Offers</h2>
      <div class="shop-grid">
        ${offers.map(o => `
          <div class="shop-item">
            <div class="item-icon">${rewardIcon(o.reward)}</div>
            <div class="item-name">${o.name}</div>
            <div class="item-cost">💎 ${o.cost.gems} Gems</div>
            <button class="btn btn-primary" data-offer="${o.id}" ${app.profile.gems < o.cost.gems ? 'disabled' : ''}>Buy</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="shop-section">
      <h2>💎 Buy Gems</h2>
      <p style="color: var(--text-dim);">In a production launch these would be real money purchases via Stripe.<br>
      For this prototype, "buy" just credits gems instantly.</p>
      <div class="shop-grid">
        ${packs.map(p => `
          <div class="shop-item">
            <div class="item-icon">💎</div>
            <div class="item-name">${p.gems} Gems</div>
            <div class="item-cost">$${p.priceUSD.toFixed(2)} USD</div>
            <button class="btn btn-gold" data-pack="${p.id}">Purchase</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  for (const b of root.querySelectorAll('[data-offer]')) {
    b.onclick = async () => {
      try {
        const r = await api.post('/api/shop/buy_offer', { offerId: b.dataset.offer });
        if (r.error) throw new Error(r.error);
        app.profile = r.profile; app.updateTopBar();
        app.toast('Purchase successful!', 'success');
        if (r.items && r.items.length) showBoxModal(r.items);
        else app.go('shop');
      } catch (e) { app.toast(e.message, 'error'); }
    };
  }
  for (const b of root.querySelectorAll('[data-pack]')) {
    b.onclick = async () => {
      try {
        const r = await api.post('/api/shop/buy_pack', { packId: b.dataset.pack });
        if (r.error) throw new Error(r.error);
        app.profile = r.profile; app.updateTopBar();
        app.toast(`+${r.gemsAdded} 💎 added!`, 'success');
        app.go('shop');
      } catch (e) { app.toast(e.message, 'error'); }
    };
  }
}

function rewardIcon(r) {
  if (r.brawlTokens) return '⚡';
  if (r.gold) return '🪙';
  if (r.box === 'mega') return '🎁';
  if (r.box === 'big') return '📦';
  if (r.box) return '📦';
  if (r.battlePass) return '🎟';
  return '🎁';
}

function showBoxModal(items) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>📦 Box Opened!</h2>
      <div class="box-rewards">
        ${items.map(it => {
          if (it.kind === 'brawler') return `<div class="box-reward brawler" style="color: ${RARITY_COLORS[it.rarity]}">🎉 ${it.id}</div>`;
          if (it.kind === 'power_points') return `<div class="box-reward">🔮 ${it.amount} PP (${it.brawlerId})</div>`;
          if (it.kind === 'gold') return `<div class="box-reward">🪙 ${it.amount}</div>`;
          return '';
        }).join('')}
      </div>
      <button class="btn btn-primary btn-large">Cool!</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('button').onclick = () => { backdrop.remove(); window.app.go('shop'); };
}

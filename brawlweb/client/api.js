// Thin REST API client
class Api {
  constructor() { this.token = localStorage.getItem('bw_token') || null; }
  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = 'Bearer ' + this.token;
    return h;
  }
  async _fetch(method, path, body) {
    const res = await fetch(path, {
      method, headers: this._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let data; try { data = JSON.parse(txt); } catch { data = { raw: txt }; }
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }
  get(path)         { return this._fetch('GET',    path); }
  post(path, body)  { return this._fetch('POST',   path, body); }
  del(path)         { return this._fetch('DELETE', path); }
  patch(path, body) { return this._fetch('PATCH',  path, body); }
}
export const api = new Api();

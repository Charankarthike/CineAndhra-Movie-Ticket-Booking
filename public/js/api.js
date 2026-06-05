const API = {
  tokenKey: 'mtb_token',
  userKey: 'mtb_user',

  getToken() {
    return localStorage.getItem(this.tokenKey);
  },

  setSession(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  },

  getUser() {
    const raw = localStorage.getItem(this.userKey);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || 'Invalid response' };
    }
    if (!res.ok) {
      let msg = data && data.error;
      if (typeof msg === 'string' && msg.includes('<!DOCTYPE')) {
        msg =
          res.status === 404
            ? 'API not found. Restart the server (npm start) so routes like /my-bookings are loaded.'
            : 'Server returned an error page instead of JSON.';
      }
      const err = new Error(
        typeof msg === 'string' && msg.length > 200 ? msg.slice(0, 200) + '…' : msg || res.statusText || 'Request failed'
      );
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  },
};

window.API = API;

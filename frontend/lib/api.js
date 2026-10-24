const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;   // 0 means the request never reached the server
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON body */ }

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:expired'));
    }
    const e = data?.error;
    throw new ApiError(res.status, e?.code || 'UNKNOWN', e?.message || 'Something went wrong. Please try again.', e?.details);
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  listInquiries: ({ status, q } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request(`/inquiries${qs ? `?${qs}` : ''}`);
  },
  getInquiry: (id) => request(`/inquiries/${id}`),
  createInquiry: (body) => request('/inquiries', { method: 'POST', body }),
  changeStatus: (id, status, version) =>
    request(`/inquiries/${id}/status`, { method: 'PATCH', body: { status, version } }),
};
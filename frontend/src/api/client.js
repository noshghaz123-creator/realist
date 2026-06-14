const API = import.meta.env.VITE_API_URL || '/api';

const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      throw new Error(
        import.meta.env.PROD && !import.meta.env.VITE_API_URL
          ? 'Backend not configured. Set VITE_API_URL in Vercel environment variables.'
          : 'Unable to reach server. Please try again later.'
      );
    }

    const data = await res.json().catch(() => null);
    if (data === null) {
      throw new Error('Invalid response from server.');
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        import.meta.env.PROD && !import.meta.env.VITE_API_URL
          ? 'Backend not configured. Set VITE_API_URL in Vercel environment variables.'
          : 'Unable to reach server. Please try again later.'
      );
    }
    throw err;
  }
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  getPublicLeads: () => request('/leads/public'),
  getMarketStats: () => request('/leads/market-stats'),
  getLeads: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/leads?${q}`);
  },
  getFavouriteLeads: () => request('/leads/favourites'),
  getStaffLeads: () => request('/leads/staff'),
  getLead: (id) => request(`/leads/${id}`),
  purchaseLead: (id) => request(`/leads/${id}/purchase`, { method: 'POST' }),
  toggleFavourite: (id) => request(`/leads/${id}/favourite`, { method: 'POST' }),
  createLead: (body) => request('/leads', { method: 'POST', body: JSON.stringify(body) }),
  updateLead: (id, body) =>
    request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),

  getMyPurchases: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/purchases/my?${q}`);
  },
  getPurchaseStats: () => request('/purchases/stats'),
  updatePurchase: (id, body) =>
    request(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getAllPurchases: () => request('/purchases/all'),

  getAdminStats: () => request('/admin/stats'),
  getUsers: () => request('/admin/users'),
  updateUser: (id, body) =>
    request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getAdminLeads: () => request('/admin/leads'),

  getNotifications: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),

  subscribe: (email) =>
    request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),

  getAttomProperties: (category = 'all', limit = 8) => {
    const q = new URLSearchParams({ category, limit: String(limit) }).toString();
    return request(`/attom/properties?${q}`);
  },
  getAttomCategories: () => request('/attom/categories'),
};

const PRODUCTION_API = 'https://realist-production.up.railway.app/api';

const API = import.meta.env.VITE_API_URL || PRODUCTION_API;

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
      const text = await res.text().catch(() => '');
      throw new Error(
        res.status >= 500
          ? 'Server error. Please try again in a moment.'
          : `Unexpected response (${res.status}). ${text.slice(0, 80)}`
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
      throw new Error('Cannot reach API server. Check your internet connection.');
    }
    throw err;
  }
}

async function requestBlob(path) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Export failed');
  }
  return res.blob();
}

function leadParamId(lead) {
  return encodeURIComponent(String(lead?._id || lead?.id || lead?.radarId || ''));
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  getFeaturedLeads: (limit = 10) => request(`/leads/featured?limit=${limit}`),
  searchPropertyLeads: (filters) =>
    request('/leads/search', { method: 'POST', body: JSON.stringify(filters) }),
  getPropertyLeads: (cacheKey, page = 1) =>
    request(`/leads?cacheKey=${encodeURIComponent(cacheKey)}&page=${page}`),
  refreshPropertyLeads: (filters) =>
    request('/leads/refresh', { method: 'POST', body: JSON.stringify({ filters }) }),
  exportPropertyLeads: (cacheKey, radarIds = []) => {
    const q = new URLSearchParams({ cacheKey });
    if (radarIds.length) q.set('ids', radarIds.join(','));
    return requestBlob(`/leads/export?${q.toString()}`);
  },
  togglePropertyFavourite: (lead) =>
    request(`/leads/${leadParamId(lead)}/favourite`, {
      method: 'POST',
      body: JSON.stringify({ lead }),
    }),
  togglePropertyMyLead: (lead) =>
    request(`/leads/${leadParamId(lead)}/my-leads`, {
      method: 'POST',
      body: JSON.stringify({ lead }),
    }),
  addAllPropertyMyLeads: (leads) =>
    request('/leads/my-leads/bulk', {
      method: 'POST',
      body: JSON.stringify({
        ids: leads.map((l) => l._id || l.id || l.radarId).filter(Boolean),
        leads,
      }),
    }),
  getPropertyFavourites: () => request('/leads/favourites'),
  getPropertyMyLeads: () => request('/leads/my-saved'),
  exportMyPropertyLeads: () => requestBlob('/leads/export/my-leads'),

  getMarketStats: () => request('/marketplace/market-stats'),
  getMarketplaceLeads: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/marketplace?${q}`);
  },
  getFavouriteLeads: () => request('/marketplace/favourites'),
  getStaffLeads: () => request('/marketplace/staff'),
  getLead: (id) => request(`/marketplace/${id}`),
  purchaseLead: (id) => request(`/marketplace/${id}/purchase`, { method: 'POST' }),
  toggleFavourite: (id) => request(`/marketplace/${id}/favourite`, { method: 'POST' }),
  createLead: (body) => request('/marketplace', { method: 'POST', body: JSON.stringify(body) }),
  updateLead: (id, body) =>
    request(`/marketplace/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/marketplace/${id}`, { method: 'DELETE' }),

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
  adminSync: (body) => request('/admin/sync', { method: 'POST', body: JSON.stringify(body) }),
  clearPropertyCache: () => request('/admin/clear-cache', { method: 'POST' }),
  getPropertyRadarStatus: () => request('/admin/propertyradar-status'),

  getNotifications: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),

  subscribe: (email) =>
    request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),

  getHomeShowcase: () => request('/public/home'),
  submitContact: (body) =>
    request('/contact', { method: 'POST', body: JSON.stringify(body) }),
  getInbox: () => request('/contact/inbox'),
  getInboxThread: (id) => request(`/contact/inbox/${id}`),
  replyInbox: (id, message) =>
    request(`/contact/inbox/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),

  getAdminContacts: () => request('/admin/contacts'),
  markContactRead: (id) => request(`/admin/contacts/${id}/read`, { method: 'PUT' }),
  adminReplyContact: (id, message) =>
    request(`/admin/contacts/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
  getLeadUsage: () => request('/admin/lead-usage'),
  getPlatformSettings: () => request('/admin/platform-settings'),
  updatePlatformSettings: (body) =>
    request('/admin/platform-settings', { method: 'PUT', body: JSON.stringify(body) }),
};

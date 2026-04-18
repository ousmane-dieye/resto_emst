const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const getToken = () => localStorage.getItem('sr_token');

const api = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Erreur', data.code, response.status);
  }

  return data;
};

export const authApi = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, motDePasse: password } }),
  register: (userData) => api('/auth/register', { method: 'POST', body: userData }),
  me: () => api('/auth/me'),
};

export const platsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/plats${query ? `?${query}` : ''}`);
  },
  create: (plat) => api('/plats', { method: 'POST', body: plat }),
  update: (id, data) => api(`/plats/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/plats/${id}`, { method: 'DELETE' }),
};

export const commandesApi = {
  getAll: () => api('/commandes'),
  create: (data) => api('/commandes', { method: 'POST', body: data }),
  valider: (id) => api(`/commandes/${id}/valider`, { method: 'PUT' }),
  getBonsPreparation: () => api('/commandes/bons-preparation'),
};

export const creneauxApi = {
  getAll: () => api('/creneaux'),
};

export const stocksApi = {
  getAll: () => api('/stocks'),
  update: (id, data) => api(`/stocks/${id}`, { method: 'PUT', body: data }),
  create: (data) => api('/stocks', { method: 'POST', body: data }),
};

export const fournisseursApi = {
  getAll: () => api('/fournisseurs'),
  create: (data) => api('/fournisseurs', { method: 'POST', body: data }),
  update: (id, data) => api(`/fournisseurs/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/fournisseurs/${id}`, { method: 'DELETE' }),
};

export const feedbackApi = {
  create: (data) => api('/feedbacks', { method: 'POST', body: data }),
  getAll: (platId) => api(`/feedbacks${platId ? `?platId=${platId}` : ''}`),
};

export const utilisateursApi = {
  getAll: () => api('/utilisateurs'),
  createStaff: (data) => api('/utilisateurs/staff', { method: 'POST', body: data }),
  toggle: (id) => api(`/utilisateurs/${id}/toggle`, { method: 'PUT' }),
};

export const notificationsApi = {
  getAll: () => api('/notifications'),
  markRead: (id) => api(`/notifications/${id}/lire`, { method: 'PUT' }),
  markAllRead: () => api('/notifications/tout-lire', { method: 'PUT' }),
};

export const statsApi = {
  get: () => api('/stats'),
  getPrediction: () => api('/stats/prediction'),
};

export { ApiError };
export default api;
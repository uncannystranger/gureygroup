/**
 * API Service — Central HTTP client for all backend API calls.
 * 
 * All requests include the backend JWT token for authentication and the
 * x-company-id header for tenant scoping.
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

export const getResolvedApiBase = () => API_BASE;


/**
 * Get authorization headers including JWT token and tenant ID.
 */
function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  // Try to get JWT from localStorage
  try {
    const authData = localStorage.getItem('gurey_auth_token');
    if (authData) {
      headers['Authorization'] = `Bearer ${authData}`;
    }
  } catch (e) { /* ignore */ }

  // Add tenant company ID
  try {
    const company = localStorage.getItem('gurey_tenant_company');
    if (company) {
      const parsed = JSON.parse(company);
      headers['x-company-id'] = parsed.id || '';
    }
  } catch (e) { /* ignore */ }

  // Branch scope travels with every protected request. The API still verifies
  // this value against the member's assignment; it is never trusted on its own.
  try {
    const branchId = localStorage.getItem('gurey_active_branch_id');
    if (branchId) headers['x-branch-id'] = branchId;
  } catch (e) { /* ignore */ }

  return headers;
}

/**
 * Generic fetch wrapper with error handling.
 */
/**
 * Generic fetch wrapper with robust error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: getHeaders(),
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      data = {};
    }

    if (!response.ok) {
      if (response.status === 503 && data.error === 'Database unavailable') {
        throw new Error(data.message || 'Database unavailable. Check MongoDB Atlas network access/IP allowlist and MONGODB_URI.');
      }
      const apiError = new Error(data.message || data.error || `API error: ${response.status} ${response.statusText}`);
      apiError.status = response.status;
      apiError.code = data.code;
      throw apiError;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      const customErr = new Error(`Backend API is unreachable at ${API_BASE}. Check VITE_API_URL or the development proxy/backend process.`);
      customErr.isNetworkError = true;
      throw customErr;
    }
    throw err;
  }
}

export const authAPI = {
  employeeLogin: (data) => apiFetch('/team/auth/employee-login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  syncFirebaseUser: (data) => apiFetch('/auth/google', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  me: () => apiFetch('/auth/me'),

  updateProfile: (updates) => apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
};

// ─── Organization API ─────────────────────────────────────────────────────────

export const organizationAPI = {
  create: (orgData) => apiFetch('/organizations', {
    method: 'POST',
    body: JSON.stringify(orgData),
  }),

  getMyOrg: () => apiFetch('/organizations/me'),

  update: (updates) => apiFetch('/organizations', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  delete: () => apiFetch('/organizations', { method: 'DELETE' }),
};

// ─── Team API ─────────────────────────────────────────────────────────────────

export const teamAPI = {
  getMembers: () => apiFetch('/team/members'),

  updateMember: (userId, updates) => apiFetch(`/team/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  removeMember: (userId) => apiFetch(`/team/members/${userId}`, {
    method: 'DELETE',
  }),

  createInvitation: (data) => apiFetch('/team/invitations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getInvitations: () => apiFetch('/team/invitations'),

  verifyInvitation: (token) => apiFetch(`/team/invitations/verify/${token}`),

  acceptInvitation: (token, userData) => apiFetch(`/team/invitations/accept/${token}`, {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  revokeInvitation: (id) => apiFetch(`/team/invitations/${id}`, { method: 'DELETE' }),
  regenerateInvitationCode: (id) => apiFetch(`/team/invitations/${id}/regenerate-code`, { method: 'POST' }),
};

export const productAPI = {
  list: (branchId) => apiFetch(`/products${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`),

  create: (data) => apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, updates) => apiFetch(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  archive: (id) => apiFetch(`/products/${id}`, {
    method: 'DELETE',
  }),
};

export const aiAPI = {
  listConversations: () => apiFetch('/ai/conversations'),

  createConversation: (title = 'New Conversation') => apiFetch('/ai/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  }),

  sendMessage: (conversationId, content) => apiFetch(`/ai/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),

  updateConversation: (conversationId, updates) => apiFetch(`/ai/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  deleteConversation: (conversationId) => apiFetch(`/ai/conversations/${conversationId}`, {
    method: 'DELETE',
  }),
};

export const saleAPI = {
  list: (options = {}) => {
    const params = new URLSearchParams();
    if (options.branchId) params.set('branchId', options.branchId);
    if (options.limit) params.set('limit', options.limit);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/sales${suffix}`);
  },

  create: (data) => apiFetch('/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};


// ─── Attendance API ───────────────────────────────────────────────────────────

export const attendanceAPI = {
  checkIn: (data) => apiFetch('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  checkOut: () => apiFetch('/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify({}),
  }),

  getToday: (branchId) => {
    const params = branchId ? `?branchId=${branchId}` : '';
    return apiFetch(`/attendance/today${params}`);
  },

  getMyHistory: (options = {}) => {
    const params = new URLSearchParams();
    if (options.from) params.set('from', options.from);
    if (options.to) params.set('to', options.to);
    if (options.limit) params.set('limit', options.limit);
    return apiFetch(`/attendance/my?${params}`);
  },

  getHistory: (options = {}) => {
    const params = new URLSearchParams();
    if (options.from) params.set('from', options.from);
    if (options.to) params.set('to', options.to);
    if (options.branchId) params.set('branchId', options.branchId);
    if (options.userId) params.set('userId', options.userId);
    if (options.limit) params.set('limit', options.limit);
    return apiFetch(`/attendance/history?${params}`);
  },
};

// ─── Audit API ────────────────────────────────────────────────────────────────

export const auditAPI = {
  getLogs: (options = {}) => {
    const params = new URLSearchParams();
    if (options.action) params.set('action', options.action);
    if (options.userEmail) params.set('userEmail', options.userEmail);
    if (options.from) params.set('from', options.from);
    if (options.to) params.set('to', options.to);
    if (options.limit) params.set('limit', options.limit);
    if (options.page) params.set('page', options.page);
    return apiFetch(`/audit?${params}`);
  },

  getActionTypes: () => apiFetch('/audit/actions'),
};

// ─── Branch API ───────────────────────────────────────────────────────────────

export const branchAPI = {
  list: () => apiFetch('/branches'),

  create: (data) => apiFetch('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, updates) => apiFetch(`/branches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  delete: (id) => apiFetch(`/branches/${id}`, { method: 'DELETE' }),
};

// ─── Session API ──────────────────────────────────────────────────────────────

export const sessionAPI = {
  create: (data) => apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  heartbeat: (sessionId) => apiFetch('/sessions/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  }),

  logout: (sessionId) => apiFetch('/sessions/logout', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  }),

  getActive: () => apiFetch('/sessions/active'),

  terminate: (sessionId) => apiFetch(`/sessions/${sessionId}`, {
    method: 'DELETE',
  }),

  logoutOtherDevices: (currentSessionId) => apiFetch('/sessions/logout-other-devices', {
    method: 'POST',
    body: JSON.stringify({ currentSessionId }),
  }),

  getHistory: (options = {}) => {
    const params = new URLSearchParams();
    if (options.userId) params.set('userId', options.userId);
    if (options.limit) params.set('limit', options.limit);
    return apiFetch(`/sessions/history?${params}`);
  },
};

export default {
  auth: authAPI,
  product: productAPI,
  ai: aiAPI,
  sale: saleAPI,
  organization: organizationAPI,
  team: teamAPI,
  attendance: attendanceAPI,
  audit: auditAPI,
  branch: branchAPI,
  session: sessionAPI,
};

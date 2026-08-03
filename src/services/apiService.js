/**
 * API Service — Central HTTP client for all backend API calls.
 * 
 * All requests include the JWT token from localStorage for authentication
 * and the x-company-id header for tenant scoping.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      throw new Error(data.error || data.message || `API error: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (err) {
    // Catch browser network errors (e.g. Failed to fetch when backend server is down)
    if (err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      const customErr = new Error(`Backend server unreachable at ${url}. Please ensure backend API service is running on port 5000.`);
      customErr.isNetworkError = true;
      throw customErr;
    }
    throw err;
  }
}

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
  getMembers: async () => {
    try {
      return await apiFetch('/team/members');
    } catch (err) {
      if (err.isNetworkError) {
        // Fallback to local storage members if backend is offline
        const company = JSON.parse(localStorage.getItem('gurey_tenant_company') || '{}');
        const companyId = company.id || 'comp_default';
        const localMembers = JSON.parse(localStorage.getItem(`gurey_employees_${companyId}`) || '[]');
        return { members: localMembers, total: localMembers.length, isOffline: true };
      }
      throw err;
    }
  },

  updateMember: (userId, updates) => apiFetch(`/team/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),

  removeMember: (userId) => apiFetch(`/team/members/${userId}`, {
    method: 'DELETE',
  }),

  // Invitations with high-availability fallback
  createInvitation: async (data) => {
    try {
      return await apiFetch('/team/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err.isNetworkError) {
        // High-availability client fallback token generation
        const company = JSON.parse(localStorage.getItem('gurey_tenant_company') || '{}');
        const companyId = company.id || 'comp_default';
        const user = JSON.parse(localStorage.getItem('gurey_auth_user') || '{}');
        
        const token = 'inv_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const inviteUrl = `${origin}/invite/${token}`;

        const fallbackInvite = {
          _id: 'inv_' + Date.now(),
          companyId,
          email: data.email.toLowerCase(),
          role: data.role || 'Employee',
          branchId: data.branchId || null,
          token,
          status: 'pending',
          invitedByName: user.displayName || user.email || 'Owner',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        try {
          const existing = JSON.parse(localStorage.getItem(`gurey_invitations_${companyId}`) || '[]');
          localStorage.setItem(`gurey_invitations_${companyId}`, JSON.stringify([fallbackInvite, ...existing]));
        } catch (e) {}

        return {
          invitation: fallbackInvite,
          inviteUrl,
          isOfflineFallback: true,
        };
      }
      throw err;
    }
  },

  getInvitations: async () => {
    try {
      return await apiFetch('/team/invitations');
    } catch (err) {
      if (err.isNetworkError) {
        const company = JSON.parse(localStorage.getItem('gurey_tenant_company') || '{}');
        const companyId = company.id || 'comp_default';
        const localInvites = JSON.parse(localStorage.getItem(`gurey_invitations_${companyId}`) || '[]');
        return { invitations: localInvites, isOffline: true };
      }
      throw err;
    }
  },

  verifyInvitation: (token) => apiFetch(`/team/invitations/verify/${token}`),

  acceptInvitation: (token, userData) => apiFetch(`/team/invitations/accept/${token}`, {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  revokeInvitation: async (id) => {
    try {
      return await apiFetch(`/team/invitations/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (err.isNetworkError) {
        const company = JSON.parse(localStorage.getItem('gurey_tenant_company') || '{}');
        const companyId = company.id || 'comp_default';
        const localInvites = JSON.parse(localStorage.getItem(`gurey_invitations_${companyId}`) || '[]');
        const updated = localInvites.filter(i => i._id !== id);
        localStorage.setItem(`gurey_invitations_${companyId}`, JSON.stringify(updated));
        return { success: true };
      }
      throw err;
    }
  },
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

  getHistory: (options = {}) => {
    const params = new URLSearchParams();
    if (options.userId) params.set('userId', options.userId);
    if (options.limit) params.set('limit', options.limit);
    return apiFetch(`/sessions/history?${params}`);
  },
};

export default {
  organization: organizationAPI,
  team: teamAPI,
  attendance: attendanceAPI,
  audit: auditAPI,
  branch: branchAPI,
  session: sessionAPI,
};

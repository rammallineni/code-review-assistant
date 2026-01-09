import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized
      localStorage.removeItem('auth-storage');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getAuthUrl: () => `${API_URL}/api/auth/github`,
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Repositories API
export const repositoriesApi = {
  list: (page = 1, limit = 20) => 
    api.get('/repositories', { params: { page, limit } }),
  listFromGitHub: (page = 1) => 
    api.get('/repositories/github', { params: { page } }),
  connect: (owner: string, repo: string) => 
    api.post('/repositories/connect', { owner, repo }),
  get: (id: string) => 
    api.get(`/repositories/${id}`),
  update: (id: string, data: { autoReview?: boolean }) => 
    api.patch(`/repositories/${id}`, data),
  delete: (id: string) => 
    api.delete(`/repositories/${id}`),
  listPullRequests: (id: string, state = 'open', page = 1) => 
    api.get(`/repositories/${id}/pull-requests`, { params: { state, page } }),
};

// Reviews API
export const reviewsApi = {
  list: (filters?: { repositoryId?: string; status?: string }, page = 1, limit = 20) => 
    api.get('/reviews', { params: { ...filters, page, limit } }),
  create: (owner: string, repo: string, prNumber: number) => 
    api.post('/reviews', { owner, repo, prNumber }),
  get: (id: string) => 
    api.get(`/reviews/${id}`),
  getIssues: (id: string, filters?: { severity?: string; category?: string }) => 
    api.get(`/reviews/${id}/issues`, { params: filters }),
  delete: (id: string) => 
    api.delete(`/reviews/${id}`),
  resolveIssue: (issueId: string) => 
    api.post(`/reviews/issues/${issueId}/resolve`),
  unresolveIssue: (issueId: string) => 
    api.post(`/reviews/issues/${issueId}/unresolve`),
};

// Settings API
export const settingsApi = {
  get: () => 
    api.get('/settings'),
  update: (settings: Record<string, unknown>) => 
    api.put('/settings', settings),
  getDefaults: () => 
    api.get('/settings/defaults'),
  getForRepository: (repositoryId: string) => 
    api.get(`/settings/repository/${repositoryId}`),
  updateForRepository: (repositoryId: string, settings: Record<string, unknown>) => 
    api.put(`/settings/repository/${repositoryId}`, settings),
  reset: () => 
    api.post('/settings/reset'),
};

// Analytics API
export const analyticsApi = {
  getOverview: () => 
    api.get('/analytics/overview'),
  getCategories: () => 
    api.get('/analytics/categories'),
  getSeverity: () => 
    api.get('/analytics/severity'),
  getTimeline: (days = 30) => 
    api.get('/analytics/timeline', { params: { days } }),
  getRepositories: () => 
    api.get('/analytics/repositories'),
  getTopIssues: (limit = 10) => 
    api.get('/analytics/top-issues', { params: { limit } }),
  getResolutionRate: () => 
    api.get('/analytics/resolution-rate'),
  getDashboard: () => 
    api.get('/analytics/dashboard'),
};

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Clients
export const clientsAPI = {
  create: (data: { name: string; email?: string }) =>
    api.post("/clients", data),
  getAll: () => api.get("/clients"),
  get: (id: string) => api.get(`/clients/${id}`),
  update: (id: string, data: { name: string; email?: string }) =>
    api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Projects
export const projectsAPI = {
  create: (data: { name: string; client_id: string }) =>
    api.post("/projects", data),
  getAll: (clientId?: string) => {
    const params = clientId ? { clientId } : {};
    return api.get("/projects", { params });
  },
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: { name: string }) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getTasks: (projectId: string) => api.get(`/projects/${projectId}/tasks`),
};

// Tasks
export const tasksAPI = {
  create: (projectId: string, data: { name: string }) =>
    api.post(`/projects/${projectId}/tasks`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Time Entries
export const timeEntriesAPI = {
  create: (data: any) => api.post("/time-entries", data),
  getAll: (params?: any) => api.get("/time-entries", { params }),
  get: (id: string) => api.get(`/time-entries/${id}`),
  update: (id: string, data: any) => api.put(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
};

// Reports
export const reportsAPI = {
  getSummary: (params?: any) => api.get("/reports/summary", { params }),
  getDetailed: (params?: any) => api.get("/reports/detailed", { params }),
  getPDF: (params?: any) =>
    api.get("/reports/pdf", { params, responseType: "blob" }),
  createShareLink: (data: any) => api.post("/reports/share", data),
  revokeShareLink: (token: string) => api.delete(`/reports/share/${token}`),
  getSharedReport: (token: string) => api.get(`/reports/public/${token}`),
};

export default api;

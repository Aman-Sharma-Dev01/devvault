import axios from 'axios';
import { Project, Developer, AnalyticsSummary, SystemNotification } from '../types.js';

// Create custom axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devvault_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  async register(data: { username: string; email: string; password: string }) {
    const response = await api.post<{ token: string; user: Developer }>('/auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password: string }) {
    const response = await api.post<{ token: string; user: Developer }>('/auth/login', data);
    return response.data;
  },

  async getProfile() {
    const response = await api.get<Developer>('/auth/profile');
    return response.data;
  },

  async updateProfile(data: Partial<Developer>) {
    const response = await api.put<Developer>('/auth/profile', data);
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  async forgotPassword(data: { email: string }) {
    const response = await api.post<{ message: string; tempPassword?: string; instructions?: string }>('/auth/forgot-password', data);
    return response.data;
  },

  async deleteAccount() {
    const response = await api.delete<{ message: string }>('/auth/delete-account');
    return response.data;
  },
};

// Projects endpoints
export const projectService = {
  async getProjects(filters: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    tech?: string;
    hosting?: string;
    database?: string;
    favorite?: boolean;
    pinned?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}) {
    const response = await api.get<{
      projects: Project[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>('/projects', { params: filters });
    return response.data;
  },

  async getProjectById(id: string) {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: Partial<Project>) {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  async updateProject(id: string, data: Partial<Project>) {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: string) {
    const response = await api.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },

  async revealCredential(data: { projectId: string; credentialId: string; masterPassword: string }) {
    const response = await api.post<{ value: string }>('/projects/credentials/reveal', data);
    return response.data;
  },

  async exportBackup() {
    const response = await api.get('/projects/export');
    return response.data;
  },

  async importBackup(backupData: any) {
    const response = await api.post<{ message: string; projects: Project[] }>('/projects/import', { backupData });
    return response.data;
  },

  async getAnalytics() {
    const response = await api.get<AnalyticsSummary>('/projects/analytics');
    return response.data;
  },

  async getNotifications() {
    const response = await api.get<SystemNotification[]>('/projects/notifications');
    return response.data;
  },
};

export default api;

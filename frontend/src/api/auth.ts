import api from './client';
import type { User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/api/auth/login', { email, password }),

  register: (username: string, email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/api/auth/register', { username, email, password }),

  me: () => api.get<{ user: User }>('/api/auth/me'),

  logout: () => api.post('/api/auth/logout'),
};

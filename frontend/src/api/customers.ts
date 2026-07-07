import api from './client';
import type { Customer } from '../types';

interface CustomersResponse {
  customers: Customer[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

export const customersApi = {
  list: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<CustomersResponse>('/api/customers', { params }),

  get: (id: string, includeOrders = false) =>
    api.get<{ customer: Customer }>(`/api/customers/${id}`, {
      params: { include_orders: includeOrders },
    }),

  create: (data: Partial<Customer>) =>
    api.post<{ customer: Customer }>('/api/customers', data),

  update: (id: string, data: Partial<Customer>) =>
    api.put<{ customer: Customer }>(`/api/customers/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/customers/${id}`),
};

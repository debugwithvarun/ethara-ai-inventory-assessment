import api from './client';
import type { Order } from '../types';

interface OrdersResponse {
  orders: Order[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

interface CreateOrderPayload {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
  notes?: string;
}

export const ordersApi = {
  list: (params?: { page?: number; per_page?: number; status?: string; search?: string }) =>
    api.get<OrdersResponse>('/api/orders', { params }),

  get: (id: string) =>
    api.get<{ order: Order }>(`/api/orders/${id}`),

  create: (data: CreateOrderPayload) =>
    api.post<{ order: Order }>('/api/orders', data),

  updateStatus: (id: string, status: string) =>
    api.put<{ order: Order }>(`/api/orders/${id}/status`, { status }),

  cancel: (id: string) =>
    api.delete<{ message: string; order: Order }>(`/api/orders/${id}`),
};

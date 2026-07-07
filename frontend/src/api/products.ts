import api from './client';
import type { Product } from '../types';

interface ProductsResponse {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

interface ProductParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  low_stock_only?: boolean;
}

export const productsApi = {
  list: (params?: ProductParams) =>
    api.get<ProductsResponse>('/api/products', { params }),

  get: (id: string) =>
    api.get<{ product: Product }>(`/api/products/${id}`),

  create: (data: Partial<Product>) =>
    api.post<{ product: Product }>('/api/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<{ product: Product }>(`/api/products/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/api/products/${id}`),

  categories: () =>
    api.get<{ categories: string[] }>('/api/products/categories/list'),
};

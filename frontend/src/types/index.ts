// Shared TypeScript interfaces used across the app

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  total_orders: number;
  created_at: string;
  updated_at: string;
  orders?: Order[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
  total_amount: number;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  pages: number;
  page: number;
  per_page: number;
  items?: T[];
}

export interface DashboardStats {
  summary: {
    total_products: number;
    total_customers: number;
    total_orders: number;
    total_revenue: number;
  };
  orders_by_status: Record<string, number>;
  low_stock_alerts: Product[];
  recent_orders: Order[];
  daily_revenue: { date: string; revenue: number }[];
  top_products: {
    id: string;
    name: string;
    sku: string;
    total_sold: number;
    total_revenue: number;
  }[];
}

export interface ApiError {
  error: string;
  insufficient_items?: {
    product_id: string;
    product_name: string;
    sku: string;
    requested: number;
    available: number;
  }[];
}

import { useState, useEffect } from 'react';
import {
  TrendingUp, Package, Users, ShoppingCart, IndianRupee,
  AlertTriangle, Clock, ArrowUpRight, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats } from '../types';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  fulfilled: '#10b981',
  cancelled: '#ef4444',
};

function StatCard({
  label, value, icon: Icon, iconBg, trend
}: {
  label: string; value: string | number; icon: React.ElementType;
  iconBg: string; trend?: string;
}) {
  return (
    <div className="stat-card group">
      <div className={`stat-icon ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-stone-900 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1"><ArrowUpRight size={12} />{trend}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res.data))
      .catch(() => setError('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 animate-spin" style={{ borderColor: '#c2d3ff', borderTopColor: '#1f3af5' }} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">{error || 'No data available'}</p>
      </div>
    );
  }

  const { summary, orders_by_status, low_stock_alerts, recent_orders, daily_revenue, top_products } = stats;

  const pieData = Object.entries(orders_by_status).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Business overview & key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₹${summary.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={IndianRupee}
          iconBg="bg-emerald-500/15 text-emerald-600"
        />
        <StatCard
          label="Total Orders"
          value={summary.total_orders.toLocaleString()}
          icon={ShoppingCart}
          iconBg="bg-brand-500/15 text-brand-400"
        />
        <StatCard
          label="Products"
          value={summary.total_products.toLocaleString()}
          icon={Package}
          iconBg="bg-violet-500/15 text-violet-400"
        />
        <StatCard
          label="Customers"
          value={summary.total_customers.toLocaleString()}
          icon={Users}
          iconBg="bg-amber-500/15 text-amber-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-stone-900 flex items-center gap-2">
                <Activity size={16} className="text-brand-400" />
                Revenue (Last 30 Days)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Fulfilled orders only</p>
            </div>
          </div>
          {daily_revenue.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-stone-500 text-sm">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily_revenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea6a0a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ea6a0a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(new Date(d), 'MMM d')}
                  tick={{ fill: '#9a9088', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fill: '#9a9088', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `\u20B9${v}`} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e8e4dc', borderRadius: 0 }}
                  labelStyle={{ color: '#7a7268', fontSize: 12 }}
                  itemStyle={{ color: '#1f3af5' }}
                  formatter={(v) => [`\u20B9${(v as number).toFixed(2)}`, 'Revenue']}
                  labelFormatter={(d) => format(new Date(d), 'MMM d, yyyy')}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ea6a0a" strokeWidth={2}
                  fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#ea6a0a' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by Status Pie */}
        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400" />
            Orders by Status
          </h2>
          {pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-stone-500 text-sm">
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e8e4dc', borderRadius: 0 }}
                  itemStyle={{ color: '#1a1510' }}
                />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(value) => <span className="text-xs capitalize" style={{ color: '#7a7268' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-brand-400" />
            Recent Orders
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_orders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-stone-500 py-8">No orders yet</td></tr>
                ) : recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td><span className="font-mono text-brand-400 text-xs">{order.order_number}</span></td>
                    <td>
                      <div>
                        <p className="font-medium text-stone-900 text-sm">{order.customer_name}</p>
                        <p className="text-xs text-stone-500">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="font-semibold text-emerald-600">₹{order.total_amount.toFixed(2)}</td>
                    <td>
                      <span className={`badge-${order.status}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-xs text-stone-500">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            Low Stock Alerts
            {low_stock_alerts.length > 0 && (
              <span className="ml-auto badge-low-stock">{low_stock_alerts.length}</span>
            )}
          </h2>
          {low_stock_alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="w-10 h-10 text-slate-700 mb-2" />
              <p className="text-stone-500 text-sm">All products are well-stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {low_stock_alerts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3" style={{ background: '#faf9f7', border: '1px solid #e8e4dc' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1a1510' }}>{product.name}</p>
                    <p className="text-xs font-mono" style={{ color: '#9a9088' }}>{product.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className={product.is_out_of_stock ? 'badge-out-stock' : 'badge-low-stock'}>
                      {product.stock_quantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {top_products.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" />
            Top Selling Products
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top_products.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`font-bold text-lg ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-stone-500' : i === 2 ? 'text-orange-700' : 'text-stone-600'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="font-medium text-stone-900">{p.name}</td>
                    <td><span className="font-mono text-xs text-stone-500">{p.sku}</span></td>
                    <td className="font-semibold text-brand-400">{p.total_sold.toLocaleString()}</td>
                    <td className="font-semibold text-emerald-600">₹{p.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

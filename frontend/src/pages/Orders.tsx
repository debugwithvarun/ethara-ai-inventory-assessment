import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, RefreshCw, ShoppingCart, ChevronRight,
  Minus, Trash2, AlertCircle, CheckCircle2, Package, User, FileText
} from 'lucide-react';
import { ordersApi } from '../api/orders';
import { productsApi } from '../api/products';
import { customersApi } from '../api/customers';
import type { Order, Product, Customer } from '../types';
import { AxiosError } from 'axios';
import { format } from 'date-fns';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Order['status'] }) {
  const cls: Record<string, string> = {
    pending: 'badge-pending', processing: 'badge-processing',
    fulfilled: 'badge-fulfilled', cancelled: 'badge-cancelled',
  };
  return <span className={cls[status] || 'badge'}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onStatusChange }: {
  order: Order; onClose: () => void; onStatusChange: () => void;
}) {
  const [fullOrder, setFullOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    ordersApi.get(order.id)
      .then(res => setFullOrder(res.data.order))
      .finally(() => setLoading(false));
  }, [order.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true); setStatusError('');
    try {
      await ordersApi.updateStatus(order.id, newStatus);
      onStatusChange(); onClose();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setStatusError(e.response?.data?.error || 'Failed to update status');
    } finally { setUpdatingStatus(false); }
  };

  const handleCancel = async () => {
    setUpdatingStatus(true); setStatusError('');
    try {
      await ordersApi.cancel(order.id);
      onStatusChange(); onClose();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setStatusError(e.response?.data?.error || 'Failed to cancel order');
    } finally { setUpdatingStatus(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Order Details</h2>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{order.order_number}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent  animate-spin" />
          </div>
        ) : fullOrder ? (
          <div className="modal-body space-y-5">
            {statusError && (
              <div className="p-3  bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{statusError}
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3  bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-500 mb-1">Customer</p>
                <p className="font-medium text-stone-900">{fullOrder.customer_name}</p>
                <p className="text-xs text-stone-500">{fullOrder.customer_email}</p>
              </div>
              <div className="p-3  bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-500 mb-1">Status</p>
                <StatusBadge status={fullOrder.status} />
                <p className="text-xs text-stone-500 mt-1">{format(new Date(fullOrder.created_at), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-sm font-medium text-stone-500 mb-3">Order Items</p>
              <div className=" border border-stone-200 overflow-hidden">
                <table>
                  <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {fullOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium text-stone-900">{item.product_name}</td>
                        <td><span className="font-mono text-xs text-stone-500">{item.product_sku}</span></td>
                        <td className="font-semibold text-brand-400">{item.quantity}</td>
                        <td>₹{item.unit_price.toFixed(2)}</td>
                        <td className="font-semibold text-emerald-600">₹{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-2">
                <span className="text-sm font-bold text-stone-900">
                  Total: <span className="text-emerald-700 text-base">₹{fullOrder.total_amount.toFixed(2)}</span>
                </span>
              </div>
            </div>

            {fullOrder.notes && (
              <div className="p-3  bg-stone-50 border border-stone-200">
                <p className="text-xs text-stone-500 mb-1">Notes</p>
                <p className="text-sm text-stone-700">{fullOrder.notes}</p>
              </div>
            )}

            {/* Status Actions */}
            {fullOrder.status !== 'cancelled' && (
              <div>
                <p className="text-xs text-stone-500 mb-2 font-medium">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'processing', 'fulfilled'].map((s) => (
                    s !== fullOrder.status && (
                      <button key={s} className="btn-secondary text-xs py-1.5 px-3 capitalize"
                        onClick={() => handleStatusUpdate(s)} disabled={updatingStatus}>
                        → {s}
                      </button>
                    )
                  ))}
                  {['pending', 'processing'].includes(fullOrder.status) && (
                    <button className="btn-danger text-xs py-1.5 px-3" onClick={handleCancel} disabled={updatingStatus}>
                      Cancel & Restore Stock
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Create Order Wizard ───────────────────────────────────────────────────────
interface CartItem { product: Product; quantity: number; }

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [insufficientItems, setInsufficientItems] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      customersApi.list({ per_page: 100 }),
      productsApi.list({ per_page: 100 }),
    ]).then(([custRes, prodRes]) => {
      setCustomers(custRes.data.customers);
      setProducts(prodRes.data.products);
    }).finally(() => setLoadingData(false));
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    setSubmitting(true); setSubmitError(''); setInsufficientItems([]);
    try {
      await ordersApi.create({
        customer_id: selectedCustomer.id,
        items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        notes: notes.trim() || undefined,
      });
      onCreated(); onClose();
    } catch (err) {
      const e = err as AxiosError<{ error: string; insufficient_items?: any[] }>;
      setSubmitError(e.response?.data?.error || 'Failed to create order');
      if (e.response?.data?.insufficient_items) {
        setInsufficientItems(e.response.data.insufficient_items);
      }
    } finally { setSubmitting(false); }
  };

  const stepLabels = ['Select Customer', 'Add Products', 'Review & Submit'];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Create New Order</h2>
            <div className="flex items-center gap-1 mt-1.5">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${step === i + 1 ? 'text-orange-700' : step > i + 1 ? 'text-emerald-700' : 'text-stone-500'}`}>
                    <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border
                      ${step === i + 1 ? 'border-orange-400 bg-orange-50 text-orange-700' :
                        step > i + 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                        'border-stone-300 text-stone-500'}`}>
                      {step > i + 1 ? '✓' : i + 1}
                    </span>
                    {label}
                  </div>
                  {i < 2 && <ChevronRight size={12} className="text-stone-400" />}
                </div>
              ))}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent  animate-spin" />
            </div>
          ) : (
            <>
              {/* Step 1: Select Customer */}
              {step === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-brand-400" />
                    <span className="font-medium text-stone-900 text-sm">Select a Customer</span>
                  </div>
                  <input
                    className="input" placeholder="Search customers…"
                    value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredCustomers.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className={`w-full flex items-center gap-3 p-3 border text-left transition-all duration-200
                          ${selectedCustomer?.id === c.id
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'}`}>
                        <div className="w-8 h-8 bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-semibold text-sm flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 text-sm">{c.name}</p>
                          <p className="text-xs text-stone-500 truncate">{c.email}</p>
                        </div>
                        {selectedCustomer?.id === c.id && (
                          <CheckCircle2 size={16} className="text-brand-600 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="text-center text-stone-500 text-sm py-6">No customers found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Add Products */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Product list */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package size={16} className="text-brand-400" />
                        <span className="font-medium text-stone-900 text-sm">Products</span>
                      </div>
                      <input
                        className="input mb-2" placeholder="Search products…"
                        value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                      />
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {filteredProducts.map((p) => (
                          <button key={p.id} type="button"
                            disabled={p.is_out_of_stock}
                            onClick={() => !p.is_out_of_stock && addToCart(p)}
                            className={`w-full flex items-center justify-between p-2.5  border text-left transition-all duration-200
                              ${p.is_out_of_stock
                                ? 'border-stone-200 bg-white/30 opacity-50 cursor-not-allowed'
                                : 'border-stone-200 bg-stone-50 hover:border-brand-500/30 hover:bg-brand-600/5 cursor-pointer'}`}>
                            <div className="min-w-0">
                              <p className="font-medium text-stone-900 text-xs">{p.name}</p>
                              <p className="text-[11px] text-stone-500 font-mono">{p.sku}</p>
                              <p className="text-[11px] text-emerald-400 font-semibold">₹{p.price.toFixed(2)}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              {p.is_out_of_stock ? (
                                <span className="badge-out-stock text-[10px]">Out</span>
                              ) : p.is_low_stock ? (
                                <span className="badge-low-stock text-[10px]">{p.stock_quantity} left</span>
                              ) : (
                                <span className="text-[11px] text-stone-500">{p.stock_quantity} in stock</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cart */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShoppingCart size={16} className="text-brand-400" />
                          <span className="font-medium text-stone-900 text-sm">Cart ({cart.length})</span>
                        </div>
                        {cart.length > 0 && (
                          <span className="text-xs font-bold text-emerald-600">₹{cartTotal.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {cart.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <ShoppingCart className="w-8 h-8 text-slate-700 mb-2" />
                            <p className="text-stone-500 text-xs">Click products to add them</p>
                          </div>
                        ) : cart.map((item) => (
                          <div key={item.product.id} className="p-2.5  border border-stone-200 bg-stone-50">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-stone-900 text-xs truncate">{item.product.name}</p>
                                <p className="text-[11px] text-emerald-600">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                              </div>
                              <button type="button" className="text-stone-600 hover:text-red-400 transition-colors flex-shrink-0"
                                onClick={() => removeFromCart(item.product.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button type="button" className="w-6 h-6  bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                onClick={() => updateQty(item.product.id, -1)}>
                                <Minus size={11} />
                              </button>
                              <span className="text-sm font-semibold text-stone-900 w-6 text-center">{item.quantity}</span>
                              <button type="button"
                                disabled={item.quantity >= item.product.stock_quantity}
                                className="w-6 h-6  bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                                onClick={() => updateQty(item.product.id, 1)}>
                                <Plus size={11} />
                              </button>
                              <span className="text-[10px] text-stone-600 ml-auto">max {item.product.stock_quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={16} className="text-brand-400" />
                    <span className="font-medium text-stone-900 text-sm">Review & Confirm</span>
                  </div>

                  {submitError && (
                    <div className="p-3  bg-red-50 border border-red-200 text-red-700 text-sm space-y-2">
                      <div className="flex gap-2"><AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{submitError}</div>
                      {insufficientItems.length > 0 && (
                        <div className="pl-5 space-y-1">
                          {insufficientItems.map((i) => (
                            <p key={i.product_id} className="text-xs">
                              <span className="font-medium">{i.product_name}</span>: requested {i.requested}, only {i.available} available
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3  bg-stone-50 border border-stone-200">
                      <p className="text-xs text-stone-500 mb-1">Customer</p>
                      <p className="font-medium text-stone-900">{selectedCustomer?.name}</p>
                      <p className="text-xs text-stone-500">{selectedCustomer?.email}</p>
                    </div>
                    <div className="p-3  bg-stone-50 border border-stone-200">
                      <p className="text-xs text-stone-500 mb-1">Order Total</p>
                      <p className="text-xl font-bold text-emerald-600">₹{cartTotal.toFixed(2)}</p>
                      <p className="text-xs text-stone-500">{cart.length} product{cart.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className=" border border-stone-200 overflow-hidden">
                    <table>
                      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {cart.map((item) => (
                          <tr key={item.product.id}>
                            <td>
                              <p className="font-medium text-stone-900 text-sm">{item.product.name}</p>
                              <p className="text-xs text-stone-500 font-mono">{item.product.sku}</p>
                            </td>
                            <td className="font-semibold text-brand-400">{item.quantity}</td>
                            <td>₹{item.product.price.toFixed(2)}</td>
                            <td className="font-semibold text-emerald-600">₹{(item.product.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <label className="label">Notes <span className="text-stone-500 font-normal">(optional)</span></label>
                    <textarea className="input resize-none" rows={2} placeholder="Any special instructions…"
                      value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button type="button" className="btn-secondary mr-auto" onClick={() => setStep(s => (s - 1) as any)}>
              Back
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          {step < 3 ? (
            <button type="button" className="btn-primary"
              disabled={(step === 1 && !selectedCustomer) || (step === 2 && cart.length === 0)}
              onClick={() => setStep(s => (s + 1) as any)}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Placing Order…' : 'Place Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders Page ───────────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.list({ page, per_page: 15, status: statusFilter || undefined, search });
      setOrders(res.data.orders);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { } finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const STATUS_FILTERS = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{total} total orders</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="card-sm flex items-center gap-3 flex-1">
          <Search size={16} className="text-stone-500 flex-shrink-0" />
          <input
            className="bg-transparent flex-1 text-sm text-stone-800 placeholder:text-stone-500 outline-none"
            placeholder="Search by order # or customer…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} className="text-stone-500 hover:text-stone-900"><X size={14} /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 text-xs font-medium border transition-all duration-200
                ${statusFilter === f.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-800'}`}>
              {f.label}
            </button>
          ))}
          <button onClick={fetchOrders} className="btn-icon flex-shrink-0">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-stone-500">
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent  animate-spin" />
                    Loading…
                  </div>
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No orders found</p>
                </td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="cursor-pointer" onClick={() => setViewOrder(order)}>
                  <td><span className="font-mono text-brand-400 text-xs">{order.order_number}</span></td>
                  <td>
                    <div>
                      <p className="font-medium text-stone-900 text-sm">{order.customer_name}</p>
                      <p className="text-xs text-stone-500">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="text-stone-500">{(order as any).items?.length ?? '—'}</td>
                  <td className="font-semibold text-emerald-600">₹{order.total_amount.toFixed(2)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="text-xs text-stone-500">{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setViewOrder(order); }} title="View details">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
            <span className="text-xs text-stone-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn-secondary text-xs py-1.5 px-3" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {viewOrder && (
        <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} onStatusChange={fetchOrders} />
      )}
      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={fetchOrders} />
      )}
    </div>
  );
}

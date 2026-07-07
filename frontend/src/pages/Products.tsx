import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { productsApi } from '../api/products';
import type { Product } from '../types';
import { AxiosError } from 'axios';

type FormData = {
  name: string;
  price: string;
  stock_quantity: string;
  category: string;
  description: string;
  low_stock_threshold: string;
  sku: string;
};


function StockBadge({ product }: { product: Product }) {
  if (product.is_out_of_stock) return <span className="badge-out-stock">Out of Stock</span>;
  if (product.is_low_stock) return <span className="badge-low-stock">Low Stock</span>;
  return <span className="badge-in-stock">In Stock</span>;
}

interface ModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

function ProductModal({ product, onClose, onSave }: ModalProps) {
  const isEdit = !!product;
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: product
      ? {
          name: product.name,
          price: String(product.price),
          stock_quantity: String(product.stock_quantity),
          category: product.category || '',
          description: product.description || '',
          low_stock_threshold: String(product.low_stock_threshold),
          sku: product.sku || '',
        }
      : { low_stock_threshold: '10', stock_quantity: '0', price: '', name: '', category: '', description: '', sku: '' },
  });

  const onSubmit = async (raw: FormData) => {
    setServerError('');
    setSaving(true);
    const data = {
      name: raw.name.trim(),
      price: parseFloat(raw.price),
      stock_quantity: parseInt(raw.stock_quantity, 10),
      category: raw.category?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      low_stock_threshold: parseInt(raw.low_stock_threshold, 10),
      sku: raw.sku?.trim() || undefined,
    };
    try {
      if (isEdit) {
        await productsApi.update(product!.id, data);
      } else {
        await productsApi.create(data);
      }
      onSave();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setServerError(e.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-stone-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {serverError && (
              <div className="p-3  bg-red-50 border border-red-200 text-red-700 text-sm">
                {serverError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Wireless Mouse" {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Price (₹) *</label>
                <input type="number" step="0.01" className={`input ${errors.price ? 'input-error' : ''}`} placeholder="0.00" {...register('price')} />
                {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price.message}</p>}
              </div>
              <div>
                <label className="label">Stock Quantity *</label>
                <input type="number" className={`input ${errors.stock_quantity ? 'input-error' : ''}`} placeholder="0" {...register('stock_quantity')} />
                {errors.stock_quantity && <p className="mt-1 text-xs text-red-400">{errors.stock_quantity.message}</p>}
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" placeholder="e.g. Electronics" {...register('category')} />
              </div>
              <div>
                <label className="label">Low Stock Threshold</label>
                <input type="number" className="input" placeholder="10" {...register('low_stock_threshold')} />
              </div>
              {isEdit && (
                <div className="col-span-2">
                  <label className="label">SKU</label>
                  <input className="input font-mono" placeholder="Auto-generated if empty" {...register('sku')} />
                  <p className="mt-1 text-xs text-stone-500">Leave blank to keep existing SKU</p>
                </div>
              )}
              {!isEdit && (
                <div className="col-span-2 flex items-start gap-2 px-3 py-2.5" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea6a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <p className="text-xs" style={{ color: '#9a3412' }}>
                    SKU will be <span className="font-semibold">auto-generated</span> based on the product category after saving.
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} placeholder="Product description..." {...register('description')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({ page, per_page: 15, search });
      setProducts(res.data.products);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset page on search
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await productsApi.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setDeleteError(e.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} products in inventory</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="card-sm flex items-center gap-3">
        <Search size={16} className="text-stone-500 flex-shrink-0" />
        <input
          className="bg-transparent flex-1 text-sm text-stone-800 placeholder:text-stone-500 outline-none"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-stone-500 hover:text-stone-900 transition-colors">
            <X size={14} />
          </button>
        )}
        <button onClick={fetchProducts} className="btn-icon ml-auto flex-shrink-0" title="Refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
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
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Package className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No products found</p>
                </td></tr>
              ) : products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <p className="font-medium text-stone-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-stone-500 truncate max-w-[200px]">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td><span className="font-mono text-xs text-brand-400 bg-brand-500/10 px-2 py-1 ">{product.sku}</span></td>
                  <td><span className="text-stone-500">{product.category || '—'}</span></td>
                  <td className="font-semibold text-emerald-600">₹{product.price.toFixed(2)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${product.is_out_of_stock ? 'text-red-600' : product.is_low_stock ? 'text-orange-600' : 'text-stone-900'}`}>
                        {product.stock_quantity}
                      </span>
                      {product.is_low_stock && !product.is_out_of_stock && (
                        <AlertTriangle size={12} className="text-orange-400" />
                      )}
                    </div>
                  </td>
                  <td><StockBadge product={product} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-icon" onClick={() => setEditProduct(product)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn-icon hover:text-red-400 hover:bg-red-500/10" onClick={() => { setDeleteConfirm(product); setDeleteError(''); }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Add Modal */}
      {showAddModal && (
        <ProductModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); fetchProducts(); }} />
      )}

      {/* Edit Modal */}
      {editProduct && (
        <ProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={() => { setEditProduct(null); fetchProducts(); }} />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal-box max-w-sm">
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-stone-900">Delete Product</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {deleteError && (
                <div className="p-3  bg-red-50 border border-red-200 text-red-700 text-sm">{deleteError}</div>
              )}
              <p className="text-stone-700">
                Are you sure you want to delete <span className="font-semibold text-stone-900">{deleteConfirm.name}</span>?
              </p>
              <p className="text-xs text-stone-500 mt-1">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

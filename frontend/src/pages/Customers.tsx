import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, X, RefreshCw, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { customersApi } from '../api/customers';
import type { Customer } from '../types';
import { AxiosError } from 'axios';
import { format } from 'date-fns';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface ModalProps { customer?: Customer | null; onClose: () => void; onSave: () => void; }

function CustomerModal({ customer, onClose, onSave }: ModalProps) {
  const isEdit = !!customer;
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: customer
      ? { name: customer.name, email: customer.email, phone: customer.phone || '', address: customer.address || '' }
      : {},
  });

  const onSubmit = async (data: FormData) => {
    setServerError(''); setSaving(true);
    try {
      if (isEdit) await customersApi.update(customer!.id, data);
      else await customersApi.create(data);
      onSave();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setServerError(e.response?.data?.error || 'Failed to save customer');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-stone-900">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {serverError && <div className="p-3  bg-red-50 border border-red-200 text-red-700 text-sm">{serverError}</div>}
            <div>
              <label className="label">Full Name *</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Alice Johnson" {...register('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="alice@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" placeholder="+1-555-0100" {...register('phone')} />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea className="input resize-none" rows={3} placeholder="Street, City, State, ZIP" {...register('address')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({ page, per_page: 15, search });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true); setDeleteError('');
    try {
      await customersApi.delete(deleteConfirm.id);
      setDeleteConfirm(null); fetchCustomers();
    } catch (err) {
      const e = err as AxiosError<{ error: string }>;
      setDeleteError(e.response?.data?.error || 'Failed to delete customer');
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} registered customers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card-sm flex items-center gap-3">
        <Search size={16} className="text-stone-500 flex-shrink-0" />
        <input
          className="bg-transparent flex-1 text-sm text-stone-800 placeholder:text-stone-500 outline-none"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')} className="text-stone-500 hover:text-stone-900 transition-colors"><X size={14} /></button>}
        <button onClick={fetchCustomers} className="btn-icon ml-auto flex-shrink-0">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Orders</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-stone-500">
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent  animate-spin" />
                    Loading…
                  </div>
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No customers found</p>
                </td></tr>
              ) : customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8  bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-brand-300 font-semibold text-sm flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-stone-900">{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Mail size={11} className="text-stone-600" />{c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500">
                          <Phone size={11} className="text-stone-600" />{c.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {c.address ? (
                      <div className="flex items-start gap-1.5 text-xs text-stone-500 max-w-[180px]">
                        <MapPin size={11} className="text-stone-600 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    ) : <span className="text-stone-600">—</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-400">
                      <ShoppingCart size={13} />
                      {c.total_orders}
                    </div>
                  </td>
                  <td className="text-xs text-stone-500">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-icon" onClick={() => setEditCustomer(c)} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn-icon hover:text-red-400 hover:bg-red-500/10" onClick={() => { setDeleteConfirm(c); setDeleteError(''); }} title="Delete"><Trash2 size={14} /></button>
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

      {showAddModal && <CustomerModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); fetchCustomers(); }} />}
      {editCustomer && <CustomerModal customer={editCustomer} onClose={() => setEditCustomer(null)} onSave={() => { setEditCustomer(null); fetchCustomers(); }} />}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal-box max-w-sm">
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-stone-900">Delete Customer</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {deleteError && <div className="p-3  bg-red-50 border border-red-200 text-red-700 text-sm">{deleteError}</div>}
              <p className="text-stone-700">Delete <span className="font-semibold text-stone-900">{deleteConfirm.name}</span>?</p>
              <p className="text-xs text-stone-500 mt-1">Customers with existing orders cannot be deleted.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Customer } from '@/types';
import {
  Users,
  Search,
  Loader2,
  Phone,
  MapPin,
  Wallet,
  Edit,
  X,
  CheckCircle,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');

  const loadCustomers = useCallback(async () => {
    try {
      const res = await api.get(`/customers${search ? `?search=${search}` : ''}`);
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setName(customer.name);
    setMobile(customer.mobile || '');
    setAddress(customer.address || '');
  };

  const handleUpdate = async () => {
    if (!editCustomer || !name.trim()) return;
    setSaving(true);
    try {
      await api.put(`/customers/${editCustomer.id}`, { name, mobile: mobile || undefined, address: address || undefined });
      setEditCustomer(null);
      loadCustomers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (customer: Customer) => {
    try {
      await api.put(`/customers/${customer.id}`, { isActive: !customer.isActive });
      loadCustomers();
    } catch { }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Customer Management</h1>
        <p className="text-sm text-surface-400 mt-1">View and manage all customer records.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-brand-400">{customers.filter((c) => c.isActive).length}</p>
          <p className="text-sm text-surface-400 mt-1">Active Customers</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-amber-400">{customers.filter((c) => c.creditBalance > 0).length}</p>
          <p className="text-sm text-surface-400 mt-1">With Outstanding Credit</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-2xl font-bold text-red-400">
            ₹{customers.reduce((sum, c) => sum + c.creditBalance, 0).toFixed(0)}
          </p>
          <p className="text-sm text-surface-400 mt-1">Total Outstanding</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input type="text" className="input-field pl-10" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Credit</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-semibold text-surface-200">{customer.name}</td>
                  <td>
                    {customer.mobile ? (
                      <span className="flex items-center gap-1 text-surface-400 text-sm"><Phone className="w-3 h-3" />{customer.mobile}</span>
                    ) : '—'}
                  </td>
                  <td>
                    {customer.address ? (
                      <span className="flex items-center gap-1 text-surface-400 text-sm"><MapPin className="w-3 h-3" />{customer.address}</span>
                    ) : '—'}
                  </td>
                  <td>
                    {customer.creditBalance > 0 ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-sm"><Wallet className="w-3 h-3" />₹{customer.creditBalance}</span>
                    ) : <span className="text-emerald-400 text-sm">Clear</span>}
                  </td>
                  <td className="text-surface-500 text-xs">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => toggleActive(customer)}>
                      <span className={`status-badge text-xs ${customer.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-surface-500 bg-surface-700/50 border-surface-600/30'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td>
                    <button onClick={() => openEdit(customer)} className="text-surface-500 hover:text-brand-400 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editCustomer && (
        <div className="modal-overlay" onClick={() => setEditCustomer(null)}>
          <div className="modal-content glass-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">Edit Customer</h2>
              <button onClick={() => setEditCustomer(null)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Name *</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Phone</label>
                <input type="text" className="input-field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Address</label>
                <input type="text" className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditCustomer(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleUpdate} disabled={saving || !name.trim()} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

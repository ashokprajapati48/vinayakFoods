'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Customer } from '@/types';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Wallet,
  X,
  Loader2,
  Edit,
} from 'lucide-react';

export default function CashierCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/customers', { name, mobile: mobile || undefined, address: address || undefined });
      setShowCreate(false);
      setName(''); setMobile(''); setAddress('');
      loadCustomers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Customers</h1>
          <p className="text-sm text-surface-400 mt-1">Manage customer records.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : customers.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Users className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400">No customers found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Credit Balance</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <p className="font-medium text-surface-200">{customer.name}</p>
                    {customer.customerType && (
                      <p className="text-xs text-surface-500">{customer.customerType}</p>
                    )}
                  </td>
                  <td>
                    {customer.mobile ? (
                      <span className="flex items-center gap-1.5 text-surface-400 text-sm">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.mobile}
                      </span>
                    ) : (
                      <span className="text-surface-600">—</span>
                    )}
                  </td>
                  <td>
                    {customer.address ? (
                      <span className="flex items-center gap-1.5 text-surface-400 text-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        {customer.address}
                      </span>
                    ) : (
                      <span className="text-surface-600">—</span>
                    )}
                  </td>
                  <td>
                    {customer.creditBalance > 0 ? (
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                        <Wallet className="w-3.5 h-3.5" />
                        ₹{customer.creditBalance}
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-sm">Clear</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">New Customer</h2>
              <button onClick={() => setShowCreate(false)} className="text-surface-500 hover:text-surface-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Name *</label>
                <input type="text" className="input-field" placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Phone</label>
                <input type="text" className="input-field" placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Address</label>
                <input type="text" className="input-field" placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !name.trim()} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

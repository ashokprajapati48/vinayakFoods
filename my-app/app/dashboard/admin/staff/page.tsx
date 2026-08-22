'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Staff } from '@/types';
import {
  UserCog,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Phone,
  Edit,
  DollarSign,
} from 'lucide-react';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [contact, setContact] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const openModal = (member?: Staff) => {
    if (member) {
      setEditStaff(member);
      setName(member.name); setRole(member.role); setContact(member.contact || '');
      setSalary(String(member.salary)); setJoiningDate(member.joiningDate.split('T')[0]);
    } else {
      setEditStaff(null);
      setName(''); setRole(''); setContact(''); setSalary('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !role || !salary) return;
    setSaving(true);
    try {
      const data = { name, role, contact: contact || undefined, salary: parseFloat(salary), joiningDate };
      if (editStaff) {
        await api.put(`/staff/${editStaff.id}`, { name, role, contact: contact || undefined, salary: parseFloat(salary) });
      } else {
        await api.post('/staff', data);
      }
      setShowModal(false);
      loadStaff();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const totalSalary = staff.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + s.salary, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Staff Management</h1>
          <p className="text-sm text-surface-400 mt-1">Manage restaurant staff members.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Staff', value: staff.filter((s) => s.status === 'ACTIVE').length, color: 'text-emerald-400' },
          { label: 'Total Staff', value: staff.length, color: 'text-blue-400' },
          { label: 'Monthly Salary', value: `₹${totalSalary.toLocaleString()}`, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-surface-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : staff.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <UserCog className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400">No staff members yet</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Salary</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="font-semibold text-surface-200">{member.name}</td>
                  <td className="text-surface-400 text-sm">{member.role}</td>
                  <td>
                    {member.contact ? (
                      <span className="flex items-center gap-1 text-surface-400 text-sm">
                        <Phone className="w-3 h-3" /> {member.contact}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-emerald-400 font-bold">₹{member.salary.toLocaleString()}</td>
                  <td className="text-surface-400 text-sm">
                    {new Date(member.joiningDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge text-xs ${
                      member.status === 'ACTIVE'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-surface-500 bg-surface-700/50 border-surface-600/30'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openModal(member)} className="text-surface-500 hover:text-brand-400 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">{editStaff ? 'Edit Staff' : 'New Staff Member'}</h2>
              <button onClick={() => setShowModal(false)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
                <input type="text" className="input-field" placeholder="Staff name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Role/Position *</label>
                <input type="text" className="input-field" placeholder="e.g., Chef, Waiter, Cashier" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Contact</label>
                <input type="text" className="input-field" placeholder="Phone number" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Monthly Salary (₹) *</label>
                <input type="number" className="input-field" placeholder="0" value={salary} onChange={(e) => setSalary(e.target.value)} />
              </div>
              {!editStaff && (
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Joining Date</label>
                  <input type="date" className="input-field" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !name || !role || !salary} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
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

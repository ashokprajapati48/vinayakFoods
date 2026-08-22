'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Table } from '@/types';
import {
  LayoutGrid,
  Plus,
  Edit,
  Loader2,
  CheckCircle,
  X,
  Minus,
} from 'lucide-react';

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [saving, setSaving] = useState(false);

  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const loadTables = useCallback(async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data);
    } catch {
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const openModal = (table?: Table) => {
    if (table) {
      setEditTable(table);
      setNumber(String(table.number));
      setCapacity(String(table.capacity));
    } else {
      setEditTable(null);
      setNumber(''); setCapacity('4');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!number || !capacity) return;
    setSaving(true);
    try {
      const data = { number: parseInt(number), capacity: parseInt(capacity) };
      if (editTable) {
        await api.put(`/tables/${editTable.id}`, data);
      } else {
        await api.post('/tables', data);
      }
      setShowModal(false);
      loadTables();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
      case 'OCCUPIED': return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'RESERVED': return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
      default: return '';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Tables</h1>
          <p className="text-sm text-surface-400 mt-1">Manage restaurant tables.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', count: tables.filter((t) => t.status === 'AVAILABLE').length, color: 'text-emerald-400' },
          { label: 'Occupied', count: tables.filter((t) => t.status === 'OCCUPIED').length, color: 'text-red-400' },
          { label: 'Reserved', count: tables.filter((t) => t.status === 'RESERVED').length, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-sm text-surface-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`glass-card p-4 text-center border cursor-pointer hover:scale-105 transition-all ${getStatusColor(table.status)}`}
              onClick={() => openModal(table)}
            >
              <p className="text-2xl font-bold">{table.number}</p>
              <p className="text-xs mt-1 opacity-70">{table.capacity} seats</p>
              <p className="text-xs mt-0.5 opacity-60">{table.status}</p>
            </div>
          ))}
          {tables.length === 0 && (
            <div className="col-span-full glass-card p-10 text-center">
              <LayoutGrid className="w-12 h-12 text-surface-700 mx-auto mb-3" />
              <p className="text-surface-400">No tables configured</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">{editTable ? 'Edit Table' : 'New Table'}</h2>
              <button onClick={() => setShowModal(false)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Table Number *</label>
                <input type="number" className="input-field" placeholder="e.g. 1" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Capacity *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCapacity(String(Math.max(1, parseInt(capacity || '1') - 1)))} className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center text-surface-300 hover:bg-surface-700">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold text-surface-100 w-8 text-center">{capacity}</span>
                  <button onClick={() => setCapacity(String(parseInt(capacity || '0') + 1))} className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center text-surface-300 hover:bg-surface-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving || !number} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
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

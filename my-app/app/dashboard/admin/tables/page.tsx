'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { apiErrorMessage } from '@/lib/api';
import { useOrderEvents } from '@/lib/realtime';
import type { Table, TableStatus } from '@/types';
import {
  LayoutGrid,
  Plus,
  Loader2,
  CheckCircle,
  X,
  Minus,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const STATUS_STYLES: Record<TableStatus, string> = {
  AVAILABLE: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  OCCUPIED: 'bg-red-500/20 border-red-500/40 text-red-400',
  RESERVED: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
};

const STATUS_OPTIONS: TableStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];

interface TableWithOrders extends Table {
  orders?: { id: string; orderNumber: number; status: string }[];
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState<TableWithOrders | null>(null);
  const [saving, setSaving] = useState(false);

  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');

  const loadTables = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true);
    try {
      const res = await api.get<TableWithOrders[]>('/tables');
      setTables(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load tables'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useOrderEvents({
    onTableUpdate: () => loadTables({ silent: true }),
    onNewOrder: () => loadTables({ silent: true }),
    onStatusUpdate: () => loadTables({ silent: true }),
    onReconnect: () => loadTables({ silent: true }),
  });

  const openModal = (table?: TableWithOrders) => {
    if (table) {
      setEditTable(table);
      setNumber(String(table.number));
      setCapacity(String(table.capacity));
    } else {
      setEditTable(null);
      setNumber('');
      setCapacity('4');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!number || !capacity) return;
    setSaving(true);
    try {
      const data = { number: parseInt(number, 10), capacity: parseInt(capacity, 10) };
      if (editTable) {
        await api.put(`/tables/${editTable.id}`, data);
      } else {
        await api.post('/tables', data);
      }
      setShowModal(false);
      setError(null);
      loadTables();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the table'));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (table: TableWithOrders, status: TableStatus) => {
    const openOrder = table.orders?.[0];
    if (
      status === 'AVAILABLE' &&
      openOrder &&
      !confirm(
        `Table ${table.number} still has order #${openOrder.orderNumber} open (${openOrder.status}). Free it anyway?`,
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await api.put(`/tables/${table.id}/status`, { status });
      setShowModal(false);
      setError(null);
      loadTables();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change the table status'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: TableWithOrders) => {
    if (!confirm(`Delete table ${table.number}?`)) return;
    setSaving(true);
    try {
      await api.delete(`/tables/${table.id}`);
      setShowModal(false);
      setError(null);
      loadTables();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the table'));
    } finally {
      setSaving(false);
    }
  };

  const counts = STATUS_OPTIONS.map((status) => ({
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    count: tables.filter((t) => t.status === status).length,
    color:
      status === 'AVAILABLE'
        ? 'text-emerald-400'
        : status === 'OCCUPIED'
          ? 'text-red-400'
          : 'text-amber-400',
  }));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Tables</h1>
          <p className="text-sm text-surface-400 mt-1">
            Tap a table to change its status, capacity or number.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTables({ silent: true })}
            className="p-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-surface-400 hover:text-surface-200"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-3 flex items-center gap-2 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {counts.map((s) => (
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
            <button
              key={table.id}
              className={`glass-card p-4 text-center border transition-all hover:scale-105 ${STATUS_STYLES[table.status]}`}
              onClick={() => openModal(table)}
            >
              <p className="text-2xl font-bold">{table.number}</p>
              <p className="text-xs mt-1 opacity-70">{table.capacity} seats</p>
              <p className="text-xs mt-0.5 opacity-60">{table.status}</p>
              {table.orders?.[0] && (
                <p className="text-[10px] mt-1 opacity-80">
                  #{table.orders[0].orderNumber}
                </p>
              )}
            </button>
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
          <div
            className="modal-content glass-card p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">
                {editTable ? `Table ${editTable.number}` : 'New Table'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-surface-500 hover:text-surface-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editTable && (
              <div className="mb-5">
                <label className="block text-xs font-medium text-surface-400 mb-2 uppercase tracking-wider">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatus(editTable, status)}
                      disabled={saving}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${
                        editTable.status === status
                          ? STATUS_STYLES[status]
                          : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:text-surface-200'
                      }`}
                    >
                      {status === 'AVAILABLE'
                        ? 'Free'
                        : status === 'OCCUPIED'
                          ? 'Occupied'
                          : 'Reserved'}
                    </button>
                  ))}
                </div>
                {editTable.orders?.[0] && (
                  <p className="text-xs text-surface-500 mt-2">
                    Open order #{editTable.orders[0].orderNumber} (
                    {editTable.orders[0].status})
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                  Table Number *
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 1"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                  Capacity *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCapacity(String(Math.max(1, parseInt(capacity || '1', 10) - 1)))
                    }
                    className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center text-surface-300 hover:bg-surface-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold text-surface-100 w-8 text-center">
                    {capacity}
                  </span>
                  <button
                    onClick={() =>
                      setCapacity(String(Math.min(20, parseInt(capacity || '0', 10) + 1)))
                    }
                    className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center text-surface-300 hover:bg-surface-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              {editTable && (
                <button
                  onClick={() => handleDelete(editTable)}
                  disabled={saving}
                  className="btn-danger text-sm px-3 flex items-center justify-center disabled:opacity-60"
                  title="Delete table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !number}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { apiErrorMessage } from '@/lib/api';
import { formatMoney, sumBy } from '@/lib/utils';
import type { Staff } from '@/types';
import {
  DollarSign,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Calendar,
} from 'lucide-react';

interface SalaryPayment {
  id: string;
  staffId: string;
  staff?: Staff;
  amount: number;
  month: number;
  year: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'ONLINE' | 'CREDIT';
  notes?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function AdminSalariesPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Form
  const [staffId, setStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [payMonth, setPayMonth] = useState(currentDate.getMonth() + 1);
  const [payYear, setPayYear] = useState(currentDate.getFullYear());
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<'CASH' | 'ONLINE' | 'CREDIT'>('CASH');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [staffRes, payRes] = await Promise.all([
        api.get('/staff'),
        api.get(`/staff/salary/history?month=${selectedMonth}&year=${selectedYear}`),
      ]);
      setStaff(staffRes.data.filter((s: Staff) => s.status === 'ACTIVE'));
      setPayments(payRes.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePay = async () => {
    if (!staffId || !amount) return;
    setSaving(true);
    try {
      await api.post(`/staff/${staffId}/salary`, {
        amount: parseFloat(amount),
        month: payMonth,
        year: payYear,
        paymentDate: payDate,
        paymentMethod: payMethod,
        notes: notes || undefined,
      });
      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      alert(apiErrorMessage(err, 'Failed to record salary'));
    } finally {
      setSaving(false);
    }
  };

  const paidStaffIds = payments.map((p) => p.staffId);
  const unpaidStaff = staff.filter((s) => !paidStaffIds.includes(s.id));
  const totalPaid = sumBy(payments, (p) => p.amount);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Salary Management</h1>
          <p className="text-sm text-surface-400 mt-1">Record and track monthly salary payments.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Record Salary
        </button>
      </div>

      {/* Month/Year selector */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <Calendar className="w-4 h-4 text-surface-400" />
        <select className="input-field w-40 py-1.5 text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select className="input-field w-28 py-1.5 text-sm" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto">
          <p className="text-xl font-bold text-emerald-400">{formatMoney(totalPaid)}</p>
          <p className="text-xs text-surface-400">Paid this month ({payments.length}/{staff.length} staff)</p>
        </div>
      </div>

      {/* Status Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paid */}
        <div>
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Paid ({payments.length})
          </h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="glass-card p-3 flex items-center justify-between border border-emerald-500/20">
                <div>
                  <p className="font-semibold text-surface-200">{p.staff?.name}</p>
                  <p className="text-xs text-surface-500">{p.staff?.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{formatMoney(p.amount)}</p>
                  <p className="text-xs text-surface-500">{p.paymentMethod}</p>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="glass-card p-6 text-center">
                <p className="text-surface-500 text-sm">No salaries paid yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Unpaid */}
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Pending ({unpaidStaff.length})
          </h2>
          <div className="space-y-2">
            {unpaidStaff.map((s) => (
              <div key={s.id} className="glass-card p-3 flex items-center justify-between border border-amber-500/20">
                <div>
                  <p className="font-semibold text-surface-200">{s.name}</p>
                  <p className="text-xs text-surface-500">{s.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-400">{formatMoney(s.salary)}</p>
                  <button
                    onClick={() => {
                      setStaffId(s.id);
                      setAmount(String(s.salary));
                      setShowModal(true);
                    }}
                    className="text-xs text-brand-400 hover:text-brand-300 mt-0.5"
                  >
                    Pay now →
                  </button>
                </div>
              </div>
            ))}
            {unpaidStaff.length === 0 && (
              <div className="glass-card p-6 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-surface-400 text-sm">
                  {staff.length === 0
                    ? 'No active staff yet — add them under Staff.'
                    : 'All staff paid!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">Record Salary Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Staff Member *</label>
                <select className="input-field" value={staffId} onChange={(e) => {
                  setStaffId(e.target.value);
                  const s = staff.find((st) => st.id === e.target.value);
                  if (s) setAmount(String(s.salary));
                }}>
                  <option value="">Select staff member</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Month</label>
                  <select className="input-field" value={payMonth} onChange={(e) => setPayMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Year</label>
                  <select className="input-field" value={payYear} onChange={(e) => setPayYear(parseInt(e.target.value))}>
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Amount (₹) *</label>
                <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Payment Date</label>
                <input type="date" className="input-field" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'ONLINE', 'CREDIT'] as const).map((m) => (
                    <button key={m} onClick={() => setPayMethod(m)} className={`py-2 rounded-xl text-xs font-semibold transition-all ${payMethod === m ? 'bg-brand-500/20 border border-brand-500/30 text-brand-400' : 'bg-surface-800/50 border border-surface-700/50 text-surface-400'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Notes</label>
                <input type="text" className="input-field" placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handlePay} disabled={saving || !staffId || !amount} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {saving ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

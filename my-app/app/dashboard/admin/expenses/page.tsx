'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Expense, ExpenseCategory } from '@/types';
import {
  Receipt,
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  CheckCircle,
  Calendar,
} from 'lucide-react';

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Form
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'CREDIT'>('CASH');

  const loadData = useCallback(async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`),
        api.get('/expenses/categories'),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !category) setCategory(catRes.data[0].id);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category]);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditExpense(expense);
      setCategory(expense.categoryId);
      setDescription(expense.description);
      setAmount(String(expense.amount));
      setDate(expense.date);
      setPaymentMethod(expense.paymentMethod);
    } else {
      setEditExpense(null);
      setDescription(''); setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('CASH');
      if (categories.length > 0) setCategory(categories[0].id);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!category || !description || !amount) return;
    setSaving(true);
    try {
      const data = { categoryId: category, description, amount: parseFloat(amount), date, paymentMethod };
      if (editExpense) {
        await api.put(`/expenses/${editExpense.id}`, data);
      } else {
        await api.post('/expenses', data);
      }
      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      loadData();
    } catch { }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Expenses</h1>
          <p className="text-sm text-surface-400 mt-1">Track all business expenses.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Date Filter */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-400">From:</span>
          <input type="date" className="input-field py-1.5 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">To:</span>
          <input type="date" className="input-field py-1.5 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xl font-bold text-red-400">₹{total.toFixed(2)}</p>
          <p className="text-xs text-surface-400">{expenses.length} expenses</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Receipt className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400">No expenses in this period</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="text-surface-400 text-sm">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td>
                    <span className="text-xs px-2 py-1 rounded-lg bg-surface-800 text-surface-300">
                      {expense.category?.name}
                    </span>
                  </td>
                  <td className="text-surface-200 font-medium">{expense.description}</td>
                  <td className="font-bold text-red-400">₹{expense.amount}</td>
                  <td>
                    <span className={`text-xs font-semibold ${
                      expense.paymentMethod === 'CASH' ? 'text-emerald-400' :
                      expense.paymentMethod === 'ONLINE' ? 'text-blue-400' : 'text-amber-400'
                    }`}>
                      {expense.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(expense)} className="text-surface-500 hover:text-brand-400 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="text-surface-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
              <h2 className="text-lg font-bold text-surface-100">{editExpense ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={() => setShowModal(false)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Category *</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Description *</label>
                <input type="text" className="input-field" placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Amount (₹) *</label>
                <input type="number" className="input-field" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Date</label>
                <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'ONLINE', 'CREDIT'] as const).map((m) => (
                    <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      paymentMethod === m
                        ? 'bg-brand-500/20 border border-brand-500/30 text-brand-400'
                        : 'bg-surface-800/50 border border-surface-700/50 text-surface-400'
                    }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { apiErrorMessage } from '@/lib/api';
import { formatMoney, sumBy } from '@/lib/utils';
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
  AlertTriangle,
  Tag,
} from 'lucide-react';

function isoDate(value: string | Date): string {
  return new Date(value).toISOString().split('T')[0];
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(isoDate(new Date()));
  const [endDate, setEndDate] = useState(isoDate(new Date()));

  // Form
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(isoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'CREDIT'>('CASH');

  const loadData = useCallback(async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.get<Expense[]>(`/expenses?startDate=${startDate}&endDate=${endDate}`),
        api.get<ExpenseCategory[]>('/expenses/categories'),
      ]);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load expenses'));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditExpense(expense);
      setCategory(expense.categoryId);
      setDescription(expense.description);
      setAmount(String(expense.amount));
      // <input type="date"> only accepts YYYY-MM-DD, never a full timestamp.
      setDate(isoDate(expense.date));
      setPaymentMethod(expense.paymentMethod);
    } else {
      setEditExpense(null);
      setDescription(''); setAmount('');
      setDate(isoDate(new Date()));
      setPaymentMethod('CASH');
      setCategory((current) => current || categories[0]?.id || '');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!category || !description.trim() || !amount) {
      setError('Pick a category and fill in a description and amount.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        categoryId: category,
        description: description.trim(),
        amount: parseFloat(amount),
        date,
        paymentMethod,
      };
      if (editExpense) {
        await api.put(`/expenses/${editExpense.id}`, data);
      } else {
        await api.post('/expenses', data);
      }
      setShowModal(false);
      setError(null);
      loadData();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the expense'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<ExpenseCategory>('/expenses/categories', {
        name: newCategory.trim(),
      });
      setNewCategory('');
      setShowCatModal(false);
      setCategory(res.data.id);
      setError(null);
      loadData();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the category'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      loadData();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the expense'));
    }
  };

  const total = sumBy(expenses, (e) => e.amount);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Expenses</h1>
          <p className="text-sm text-surface-400 mt-1">Track all business expenses.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4" />
            Add Category
          </button>
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-3 flex items-center gap-2 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

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
          <p className="text-xl font-bold text-red-400">{formatMoney(total, 2)}</p>
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
                  <td className="font-bold text-red-400">{formatMoney(expense.amount)}</td>
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
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New expense category */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">New Expense Category</h2>
              <button onClick={() => setShowCatModal(false)} className="text-surface-500 hover:text-surface-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              className="input-field mb-4"
              placeholder="e.g. Gas cylinder"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCatModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={handleCreateCategory}
                disabled={saving || !newCategory.trim()}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

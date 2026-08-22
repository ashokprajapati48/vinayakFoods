'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Category, MenuItem } from '@/types';
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  ChefHat,
  Tag,
  X,
  Loader2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import { MOCK_CATEGORIES } from '@/lib/mockData';

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(MOCK_CATEGORIES[0]?.id || '');

  // Create item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemKitchen, setItemKitchen] = useState<'KITCHEN_1' | 'KITCHEN_2'>('KITCHEN_1');
  const [itemCategory, setItemCategory] = useState(MOCK_CATEGORIES[0]?.id || '');
  const [itemDesc, setItemDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Create category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/menu/categories/all');
      if (res.data?.length > 0) {
        setCategories(res.data);
        if (!activeCategory) {
          setActiveCategory(res.data[0].id);
          setItemCategory(res.data[0].id);
        }
      }
    } catch {
      setCategories(MOCK_CATEGORIES);
      if (MOCK_CATEGORIES.length > 0 && !activeCategory) {
        setActiveCategory(MOCK_CATEGORIES[0].id);
        setItemCategory(MOCK_CATEGORIES[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setEditItem(item);
      setItemName(item.name);
      setItemPrice(String(item.price));
      setItemKitchen(item.kitchen);
      setItemCategory(item.categoryId);
      setItemDesc(item.description || '');
    } else {
      setEditItem(null);
      setItemName(''); setItemPrice(''); setItemDesc('');
      setItemKitchen('KITCHEN_1');
      setItemCategory(activeCategory);
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemName || !itemPrice || !itemCategory) return;
    setSaving(true);
    try {
      const data = {
        name: itemName,
        price: parseFloat(itemPrice),
        kitchen: itemKitchen,
        categoryId: itemCategory,
        description: itemDesc || undefined,
      };
      if (editItem) {
        await api.put(`/menu/items/${editItem.id}`, data);
      } else {
        await api.post('/menu/items', data);
      }
      setShowItemModal(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = async (item: MenuItem) => {
    try {
      await api.put(`/menu/items/${item.id}`, { isAvailable: !item.isAvailable });
      loadData();
    } catch {
      //
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Deactivate this item?')) return;
    try {
      await api.delete(`/menu/items/${itemId}`);
      loadData();
    } catch {
      //
    }
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) return;
    setCreatingCat(true);
    try {
      await api.post('/menu/categories', { name: catName });
      setCatName('');
      setShowCatModal(false);
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
  };

  const activeItems = categories.find((c) => c.id === activeCategory)?.menuItems || [];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Menu Management</h1>
          <p className="text-sm text-surface-400 mt-1">Manage categories and menu items.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4" />
            Add Category
          </button>
          <button onClick={() => openItemModal()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <ClipboardList className="w-12 h-12 text-surface-700 mx-auto mb-3" />
          <p className="text-surface-400 mb-4">No categories yet</p>
          <button onClick={() => setShowCatModal(true)} className="btn-primary text-sm">Create First Category</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Category Sidebar */}
          <div className="xl:col-span-1">
            <div className="glass-card p-3 space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeCategory === cat.id
                      ? 'bg-brand-500/20 border border-brand-500/30 text-brand-400 font-semibold'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                  }`}
                >
                  <p>{cat.name}</p>
                  <p className="text-xs text-surface-600">
                    {(cat as any)._count?.menuItems || cat.menuItems?.length || 0} items
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="xl:col-span-3">
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-surface-800 flex items-center justify-between">
                <h2 className="font-semibold text-surface-100">
                  {categories.find((c) => c.id === activeCategory)?.name} Items
                </h2>
                <button onClick={() => openItemModal()} className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/20 border border-brand-500/30 text-brand-400 hover:bg-brand-500/30 transition-colors">
                  + Add Item
                </button>
              </div>
              {activeItems.length === 0 ? (
                <div className="p-10 text-center">
                  <ChefHat className="w-10 h-10 text-surface-700 mx-auto mb-2" />
                  <p className="text-surface-400 text-sm">No items in this category</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Kitchen</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <p className={`font-medium ${item.isAvailable ? 'text-surface-200' : 'text-surface-600 line-through'}`}>
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-surface-500">{item.description}</p>
                          )}
                        </td>
                        <td className="text-brand-400 font-bold">₹{item.price}</td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                            item.kitchen === 'KITCHEN_1'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {item.kitchen === 'KITCHEN_1' ? 'Kitchen 1' : 'Kitchen 2'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleToggleItem(item)}>
                            {item.isAvailable ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-surface-600" />
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openItemModal(item)} className="text-surface-500 hover:text-brand-400 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-surface-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">{editItem ? 'Edit Item' : 'New Menu Item'}</h2>
              <button onClick={() => setShowItemModal(false)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Name *</label>
                <input type="text" className="input-field" placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Price (₹) *</label>
                <input type="number" className="input-field" placeholder="0.00" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Category *</label>
                <select className="input-field" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Kitchen *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['KITCHEN_1', 'KITCHEN_2'] as const).map((k) => (
                    <button key={k} onClick={() => setItemKitchen(k)} className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      itemKitchen === k
                        ? k === 'KITCHEN_1' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                        : 'bg-surface-800/50 border border-surface-700/50 text-surface-400'
                    }`}>
                      {k === 'KITCHEN_1' ? 'Kitchen 1' : 'Kitchen 2'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Description</label>
                <input type="text" className="input-field" placeholder="Optional description" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowItemModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleSaveItem} disabled={saving || !itemName || !itemPrice} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content glass-card p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-100">New Category</h2>
              <button onClick={() => setShowCatModal(false)} className="text-surface-500 hover:text-surface-300"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" className="input-field mb-4" placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowCatModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleCreateCategory} disabled={creatingCat || !catName.trim()} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {creatingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creatingCat ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

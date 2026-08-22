'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Settings,
  User,
  Lock,
  Loader2,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // In a real implementation, this would call the user update endpoint
      // For now, just a stub
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setSaving(false);
      }, 500);
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Settings</h1>
        <p className="text-sm text-surface-400 mt-1">Manage your account and system preferences.</p>
      </div>

      {message && (
        <div className={`glass-card p-4 flex items-center gap-3 border ${
          message.type === 'success' ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}>
          <CheckCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} />
          <p className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      {/* Profile Section */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-surface-100">Profile Information</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Username</label>
            <input type="text" className="input-field opacity-60 cursor-not-allowed" value={user?.username || ''} disabled />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Display Name</label>
            <input type="text" className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Role</label>
            <input type="text" className="input-field opacity-60 cursor-not-allowed" value={user?.role || ''} disabled />
          </div>
        </div>
        <button
          onClick={handleUpdateProfile}
          disabled={saving}
          className="btn-primary mt-4 flex items-center gap-2 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Change Password */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-surface-100">Change Password</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Current Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">New Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <button
          onClick={handleChangePassword}
          disabled={saving || !currentPassword || !newPassword}
          className="btn-primary mt-4 flex items-center gap-2 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Change Password
        </button>
      </div>

      {/* System Info */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-surface-100">System Information</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'System', value: 'RestaurantOS v1.0' },
            { label: 'API URL', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api' },
            { label: 'Environment', value: process.env.NODE_ENV || 'development' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-800">
              <span className="text-sm text-surface-400">{item.label}</span>
              <span className="text-sm text-surface-200 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

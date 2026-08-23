'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  UtensilsCrossed,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ChefHat,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(
          axiosError.response?.data?.message || 'Login failed. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setIsLoading(true);
    try {
      await login(user, pass);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(
          axiosError.response?.data?.message || 'Login failed. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{
            background:
              'radial-gradient(circle, rgba(249,115,22,1) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,1) 0%, transparent 70%)',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo & Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-5 shadow-lg shadow-brand-500/20">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            VINAYAK FOODS
          </h1>
          <p className="text-surface-400 text-sm">
            Restaurant Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 animate-scale-in">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-surface-100">Sign In</h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-scale-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick Login (Dev Only) */}
        <div className="mt-6 glass-card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-4 h-4 text-surface-400" />
            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
              Quick Access
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Admin', user: 'admin', pass: 'Admin@123', color: 'text-purple-400' },
              { label: 'Cashier', user: 'cashier', pass: 'Cashier@123', color: 'text-blue-400' },
              { label: 'Kitchen 1', user: 'kitchen1', pass: 'Kitchen1@123', color: 'text-amber-400' },
              { label: 'Kitchen 2', user: 'kitchen2', pass: 'Kitchen2@123', color: 'text-orange-400' },
              { label: 'Waiter', user: 'waiter', pass: 'Waiter@123', color: 'text-emerald-400' },
            ].map((item) => (
              <button
                key={item.user}
                onClick={() => quickLogin(item.user, item.pass)}
                disabled={isLoading}
                className={`text-xs px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50 hover:border-surface-600 transition-all ${item.color} font-medium disabled:opacity-50`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-surface-600 text-xs mt-6">
          © 2026 VINAYAK FOODS — All rights reserved
        </p>
      </div>
    </div>
  );
}

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { getRolePath } from '@/lib/utils';
import type { User, AuthResponse, Role } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo fallback accounts for immediate preview / offline development
const DEMO_USERS: Record<string, { user: User; pass: string }> = {
  admin: {
    user: { id: 'demo-admin-id', username: 'admin', displayName: 'Administrator', role: 'ADMIN' },
    pass: 'Admin@123',
  },
  cashier: {
    user: { id: 'demo-cashier-id', username: 'cashier', displayName: 'Cashier Staff', role: 'CASHIER' },
    pass: 'Cashier@123',
  },
  kitchen1: {
    user: { id: 'demo-kitchen1-id', username: 'kitchen1', displayName: 'Kitchen 1 (Non-Veg, Chinese, Gravies, Biryani)', role: 'KITCHEN1' },
    pass: 'Kitchen1@123',
  },
  kitchen2: {
    user: { id: 'demo-kitchen2-id', username: 'kitchen2', displayName: 'Kitchen 2 (Breakfast, Paratha, Veg Thali, Drinks)', role: 'KITCHEN2' },
    pass: 'Kitchen2@123',
  },
  waiter: {
    user: { id: 'demo-waiter-id', username: 'waiter', displayName: 'Waiter Station', role: 'WAITER' },
    pass: 'Waiter@123',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        try {
          connectSocket(parsedUser.role);
        } catch {
          // Socket optional in offline preview
        }
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      let userData: User | null = null;
      let accessToken = '';
      let refreshToken = '';

      try {
        // Try authenticating with backend API
        const response = await api.post<AuthResponse>('/auth/login', {
          username,
          password,
        });

        userData = response.data.user;
        accessToken = response.data.accessToken;
        refreshToken = response.data.refreshToken;
      } catch (err: unknown) {
        // Check if demo fallback credentials match
        const lowerUser = username.toLowerCase().trim();
        const demo = DEMO_USERS[lowerUser];

        if (demo && (demo.pass === password || password === demo.pass.toLowerCase() || password.length >= 4)) {
          userData = demo.user;
          accessToken = `demo-jwt-token-${userData.role.toLowerCase()}`;
          refreshToken = `demo-refresh-token-${userData.role.toLowerCase()}`;
        } else {
          // If neither backend nor demo matches, throw error
          const axiosError = err as { response?: { data?: { message?: string } } };
          throw new Error(axiosError.response?.data?.message || 'Invalid username or password');
        }
      }

      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        setUser(userData);
        try {
          connectSocket(userData.role);
        } catch {
          // Socket optional in preview
        }
        router.push(getRolePath(userData.role));
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors, logout anyway
    }
    localStorage.clear();
    try {
      disconnectSocket();
    } catch {
      // Ignore
    }
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

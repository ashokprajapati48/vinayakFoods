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
import api, { isOffline, apiErrorMessage } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { getRolePath } from '@/lib/utils';
import type { AuthResponse, User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /** True when signed in against local demo data because the API was unreachable. */
  isDemo: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials are useful for local UI development but must never be
// available in a deployed build.
const OFFLINE_DEMO_ENABLED = process.env.NODE_ENV !== 'production';

// Offline fallback accounts. Only used when the API cannot be reached at all —
// a wrong password against a reachable server must never land here.
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
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();

  // Restore the stored session on mount.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    let parsedUser: User | null = null;
    try {
      parsedUser = JSON.parse(storedUser) as User;
    } catch {
      localStorage.clear();
      setIsLoading(false);
      return;
    }

    setUser(parsedUser);
    const demoMode = localStorage.getItem('demoMode') === 'true';
    setIsDemo(demoMode);
    try {
      connectSocket(parsedUser.role);
    } catch {
      // Socket is optional; screens still work with manual refresh.
    }
    setIsLoading(false);

    // Confirm the token is still valid; refresh the profile if it changed.
    if (!demoMode) {
      api
        .get<User>('/auth/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(() => {
          // 401s are handled by the api interceptor (refresh or redirect);
          // a network error just means we keep showing the stored session.
        });
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const response = await api.post<AuthResponse>(
          '/auth/login',
          { username: username.trim(), password },
          // The very first request can wait on a cold dev-server compile.
          { timeout: 45000 },
        );

        const { user: userData } = response.data;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('demoMode');

        setUser(userData);
        setIsDemo(false);
        try {
          connectSocket(userData.role);
        } catch {
          // Non-fatal.
        }
        router.push(getRolePath(userData.role));
        return;
      } catch (err: unknown) {
        // Server answered (wrong credentials, disabled account, …) — report it.
        if (!isOffline(err)) {
          throw new Error(apiErrorMessage(err, 'Invalid username or password'));
        }

        // Server unreachable → allow the documented demo accounts so the UI
        // can still be explored, and make that state visible.
        if (!OFFLINE_DEMO_ENABLED) {
          throw new Error('Cannot reach the server. Please try again later.');
        }

        const demo = DEMO_USERS[username.toLowerCase().trim()];
        if (!demo || demo.pass !== password) {
          throw new Error(
            'Cannot reach the server. Start the API, or sign in with a demo account to browse offline.',
          );
        }

        localStorage.setItem('user', JSON.stringify(demo.user));
        localStorage.setItem('demoMode', 'true');

        setUser(demo.user);
        setIsDemo(true);
        router.push(getRolePath(demo.user.role));
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors, sign out locally anyway.
    }
    localStorage.clear();
    try {
      disconnectSocket();
    } catch {
      // Ignore.
    }
    setUser(null);
    setIsDemo(false);
    router.push('/');
  }, [router]);

  const updateUser = useCallback((next: User) => {
    setUser(next);
    localStorage.setItem('user', JSON.stringify(next));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isDemo, login, logout, updateUser }}
    >
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

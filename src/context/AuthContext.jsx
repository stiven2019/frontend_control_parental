import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.me();
      setUser(user);
    } catch (err) {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });
    setToken(token);
    setUser(user);
    setIsGuest(false);
    return user;
  };

  const register = async (payload) => {
    const { token, user } = await api.register(payload);
    setToken(token);
    setUser(user);
    setIsGuest(false);
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
  };

  const continueAsGuest = () => setIsGuest(true);

  const refreshUser = async () => {
    const { user } = await api.me();
    setUser(user);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isGuest, login, register, logout, continueAsGuest, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

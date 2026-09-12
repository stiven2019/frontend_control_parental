import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const STORAGE_USER_KEY = 'mibebe_user';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicialización síncrona con el usuario en caché para evitar pantalla de carga o redirección al login
  const [user, setUser] = useState(() => {
    const token = getToken();
    if (!token) return null;
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = getToken();
    const saved = localStorage.getItem(STORAGE_USER_KEY);
    // Si ya tenemos token y datos de usuario en caché, no bloqueamos la UI con pantalla de carga
    return Boolean(token && !saved);
  });

  const [isGuest, setIsGuest] = useState(false);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      localStorage.removeItem(STORAGE_USER_KEY);
      setLoading(false);
      return;
    }

    try {
      const { user } = await api.me();
      setUser(user);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } catch (err) {
      // CRÍTICO: SOLO si el backend responde con 401 (token inválido o expirado) se cierra la sesión.
      // Si fue fallo de red, servidor apagado o reiniciando, o error temporal, se MANTIENE la sesión local.
      if (err.status === 401) {
        console.warn('Sesión expirada o token no válido en el backend (401). Cerrando sesión.');
        setToken(null);
        localStorage.removeItem(STORAGE_USER_KEY);
        setUser(null);
      } else {
        console.warn('Aviso: No se pudo sincronizar usuario con el servidor, manteniendo sesión activa local:', err.message);
      }
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
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    setUser(user);
    setIsGuest(false);
    return user;
  };

  const register = async (payload) => {
    const { token, user } = await api.register(payload);
    setToken(token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    setUser(user);
    setIsGuest(false);
    return user;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setIsGuest(false);
  };

  const continueAsGuest = () => setIsGuest(true);

  const refreshUser = async () => {
    try {
      const { user } = await api.me();
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      setUser(user);
      return user;
    } catch (err) {
      if (err.status === 401) {
        logout();
      }
    }
  };

  const handleSetUser = (newVal) => {
    setUser((prev) => {
      const updated = typeof newVal === 'function' ? newVal(prev) : newVal;
      if (updated) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        login,
        register,
        logout,
        continueAsGuest,
        refreshUser,
        setUser: handleSetUser,
      }}
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


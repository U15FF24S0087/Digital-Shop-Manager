import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user,         setUser]         = useState(null);
  const [accessToken,  setAccessToken]  = useState(() => localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [loading,      setLoading]      = useState(true);

  // ── Persist tokens ──────────────────────────────────────────────────────────
  const saveTokens = (access, refresh) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem('accessToken',  access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
  };

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // ── Fetch current user ──────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) fetchProfile();
    else             setLoading(false);
  }, [accessToken, fetchProfile]);

  // ── Permission helper ───────────────────────────────────────────────────────
  const hasPermission = useCallback((permission) => {
    if (!user?.role) return false;
    if (user.role.name === 'Admin') return true;
    return user.role.permissions?.includes(permission) ?? false;
  }, [user]);

  const hasAnyPermission = useCallback((...perms) =>
    perms.some((p) => hasPermission(p)), [hasPermission]);

  // ── Auth actions ────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken: at, refreshToken: rt, user: u } = res.data.data;
    saveTokens(at, rt);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { accessToken: at, refreshToken: rt, user: u } = res.data.data;
    saveTokens(at, rt);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearTokens();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  const updateProfile = async (data) => {
    const res = await api.patch('/auth/me', data);
    setUser(res.data.data);
    return res.data.data;
  };

  return (
    <AuthContext.Provider value={{
      user, accessToken, loading,
      login, register, logout, updateProfile,
      hasPermission, hasAnyPermission,
      isAuthenticated: !!accessToken && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { loginUser, refreshToken as refreshTokenRequest } from '../services/api';

const AuthContext = createContext(null);

// Refresh this many ms before the token's actual expiry, so the session
// renews silently instead of the user getting bounced out mid-action.
const REFRESH_MARGIN_MS = 60 * 1000;

function getTokenExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;

    const runRefresh = async () => {
      try {
        const response = await refreshTokenRequest();
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        scheduleRefresh(access_token);
      } catch {
        logout();
      }
    };

    const delay = expiryMs - Date.now() - REFRESH_MARGIN_MS;
    refreshTimerRef.current = setTimeout(runRefresh, Math.max(delay, 0));
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      scheduleRefresh(token);
    }
    setLoading(false);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = async (email, password) => {
    const response = await loginUser(email, password);
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    scheduleRefresh(access_token);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
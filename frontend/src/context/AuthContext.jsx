import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('photodey_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify and hydrate user session from localStorage on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('photodey_token');
      const storedUser = localStorage.getItem('photodey_user');

      if (storedToken) {
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse cached user:', e);
          }
        }

        try {
          // Fetch fresh user profile from backend to verify token validity
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('photodey_user', JSON.stringify(res.data));
          }
        } catch (error) {
          console.warn('Session verification failed, logging out:', error.message);
          // Token is invalid or expired
          localStorage.removeItem('photodey_token');
          localStorage.removeItem('photodey_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        const { user: userData, token: jwtToken } = res.data;
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('photodey_token', jwtToken);
        localStorage.setItem('photodey_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register handler
  const register = useCallback(async ({ name, email, password }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      return res;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('photodey_token');
    localStorage.removeItem('photodey_user');
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

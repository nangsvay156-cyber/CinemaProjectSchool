import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('cinema_user');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(token, user) {
    localStorage.setItem('cinema_token', token);
    localStorage.setItem('cinema_user', JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  }

  async function register(fullName, email, password, phone) {
    const { data } = await api.post('/auth/register', { fullName, email, password, phone });
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('cinema_token');
    localStorage.removeItem('cinema_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

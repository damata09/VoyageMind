import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('voyagemind_token');
      if (token) {
        try {
            const data = await getCurrentUser();
            setUser({ id: data.id, name: data.name, email: data.email, avatarUrl: data.avatarUrl });
        } catch (err) {
            localStorage.removeItem('voyagemind_token');
            localStorage.removeItem('voyagemind_user_name');
            setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  function login(token: string, userData: User) {
    localStorage.setItem('voyagemind_token', token);
    localStorage.setItem('voyagemind_user_name', userData.name);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('voyagemind_token');
    localStorage.removeItem('voyagemind_user_name');
    // Opção: Pode apagar o state de visits locais se quiser, mas deixaremos p/ não perder checkins offline
    setUser(null);
  }

  function updateAvatar(url: string) {
    setUser(prev => prev ? { ...prev, avatarUrl: url } : null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

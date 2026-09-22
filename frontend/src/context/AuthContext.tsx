import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  LoginCredentials,
  RegisterClientDTO,
  RegisterProviderDTO,
} from '@/types/auth';
import {
  loginApi,
  registerClientApi,
  registerProviderApi,
  verifyCodeApi,
  resendCodeApi,
} from '@/api/auth';
import { ApiError } from '@/api/client';

export type AppView =
  | 'landing'
  | 'catalogo'
  | 'reservas'
  | 'login'
  | 'registro-cliente'
  | 'registro-proveedor'
  | 'servicios'
  | 'perfil';

interface NotificationState {
  type: 'success' | 'info' | 'error';
  message: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  currentView: AppView;
  notification: NotificationState | null;
  navigate: (view: AppView) => void;
  showNotification: (type: 'success' | 'info' | 'error', message: string) => void;
  clearNotification: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  registerClient: (data: RegisterClientDTO) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<{ role: string }>;
  resendCode: (email: string) => Promise<void>;
  registerProvider: (data: RegisterProviderDTO) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'promarket_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const clearNotification = () => setNotification(null);

  const navigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (credentials: LoginCredentials) => {
    const res = await loginApi(credentials);
    const loggedUser: User = {
      id: `user-${res.email}`,
      email: res.email,
      firstName: res.email.split('@')[0],
      role: res.role,
      isVerified: true,
    };

    setUser(loggedUser);
    showNotification('success', `¡Bienvenido de nuevo, ${loggedUser.firstName}!`);

    if (loggedUser.role === 'PROVEEDOR') {
      navigate('servicios');
    } else {
      navigate('catalogo');
    }
  };

  const logout = () => {
    setUser(null);
    showNotification('info', 'Has cerrado sesión con éxito.');
    navigate('landing');
  };

  const registerClient = async (data: RegisterClientDTO) => {
    await registerClientApi(data);
  };

  const verifyCode = async (email: string, code: string) => {
    const res = await verifyCodeApi({ email, code });
    const newUser: User = {
      id: `user-${res.email}`,
      email: res.email,
      firstName: email.split('@')[0],
      role: res.role as User['role'],
      isVerified: true,
    };
    setUser(newUser);
    return { role: res.role };
  };

  const resendCode = async (email: string) => {
    await resendCodeApi({ email });
  };

  const registerProvider = async (data: RegisterProviderDTO) => {
    await registerProviderApi(data);
  };

  const updateUserProfile = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
    showNotification('success', 'Perfil actualizado correctamente.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        currentView,
        notification,
        navigate,
        showNotification,
        clearNotification,
        login,
        logout,
        registerClient,
        verifyCode,
        resendCode,
        registerProvider,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

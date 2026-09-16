import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  LoginCredentials,
  RegisterClientDTO,
  RegisterProviderDTO,
} from '@/types/auth';
import { loginApi, registerClientApi } from '@/api/auth';

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
    const loggedUser: User = res.user || {
      id: `user-${Date.now()}`,
      email: res.email,
      firstName: res.email.split('@')[0],
      role: res.role,
      isVerified: true,
      businessName: res.role === 'PROVEEDOR' ? 'Mi Negocio' : undefined,
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
    const newUser: User = {
      id: `client-${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'CLIENTE',
      isVerified: true,
    };
    setUser(newUser);
    showNotification('success', '¡Cuenta creada y verificada con éxito!');
    navigate('catalogo');
  };

  const registerProvider = async (data: RegisterProviderDTO) => {
    const newProvider: User = {
      id: `provider-${Date.now()}`,
      email: data.email,
      firstName: data.contactName,
      phone: data.phone,
      role: 'PROVEEDOR',
      businessName: data.businessName,
      businessCategory: data.category,
      isVerified: true,
    };
    setUser(newProvider);
    showNotification('success', `¡Negocio ${data.businessName} registrado con éxito!`);
    navigate('servicios');
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

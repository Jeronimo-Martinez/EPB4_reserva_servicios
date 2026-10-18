import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  logoutApi,
} from '@/api/auth';
import { ApiError, SESSION_ENDED_MESSAGE, SESSION_EXPIRED_EVENT, USER_STORAGE_KEY } from '@/api/client';
import { Service } from '@/types/service';

export type AppView =
  | 'landing'
  | 'catalogo'
  | 'reservas'
  | 'login'
  | 'registro-cliente'
  | 'registro-proveedor'
  | 'servicios'
  | 'horarios'
  | 'agenda'
  | 'reservar'
  | 'negocios'
  | 'negocio'
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
  /** Servicio con el que el cliente abrió el flujo de reserva. */
  bookingService: Service | null;
  startBooking: (service: Service) => void;
  /** Negocio abierto en el detalle y vista a la que regresa "Volver". */
  selectedBusinessId: string | null;
  businessReturnView: AppView;
  openBusiness: (businessId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Least privilege in the UI too (the backend enforces the same rule): each role only opens its own screens.
const PROVIDER_VIEWS: AppView[] = ['servicios', 'horarios', 'agenda'];
const CLIENT_VIEWS: AppView[] = ['reservas', 'reservar'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      const saved: User | null = stored ? JSON.parse(stored) : null;
      // A session saved without a token (before HA-29) cannot call the backend: ask to log in again.
      return saved?.token ? saved : null;
    } catch {
      return null;
    }
  });

  // navigate() can run right after setUser() in the same handler, before the re-render; the ref is never stale.
  const userRef = useRef(user);
  userRef.current = user;
  const signIn = (signedUser: User) => {
    userRef.current = signedUser;
    setUser(signedUser);
  };

  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessReturnView, setBusinessReturnView] = useState<AppView>('negocios');

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    const onSessionExpired = () => {
      setUser(null);
      setCurrentView('login');
      showNotification('info', SESSION_ENDED_MESSAGE);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    // showNotification only uses state setters, so the first one stays valid.
  }, []);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const clearNotification = () => setNotification(null);

  const navigate = (view: AppView) => {
    const role = userRef.current?.role;
    if ((PROVIDER_VIEWS.includes(view) && role !== 'PROVEEDOR') || (CLIENT_VIEWS.includes(view) && role !== 'CLIENTE')) {
      showNotification('error', 'No tienes permitido acceder a esta sección.');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startBooking = (service: Service) => {
    if (!user) {
      showNotification('info', 'Inicia sesión para reservar una cita.');
      navigate('login');
      return;
    }
    setBookingService(service);
    navigate('reservar');
  };

  const openBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId);
    // Coming back from the booking flow keeps the original origin (results or catalog).
    if (currentView !== 'reservar') setBusinessReturnView(currentView);
    navigate('negocio');
  };

  const login = async (credentials: LoginCredentials) => {
    const res = await loginApi(credentials);
    const loggedUser: User = {
      id: `user-${res.email}`,
      email: res.email,
      firstName: res.email.split('@')[0],
      role: res.role,
      isVerified: true,
      token: res.token,
    };

    signIn(loggedUser);
    showNotification('success', `¡Bienvenido de nuevo, ${loggedUser.firstName}!`);

    if (loggedUser.role === 'PROVEEDOR') {
      navigate('servicios');
    } else {
      navigate('catalogo');
    }
  };

  const logout = () => {
    if (userRef.current?.token) {
      // Best effort: the token is dropped locally even if the backend cannot be reached.
      logoutApi().catch(() => undefined);
    }
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
      token: res.token,
    };
    signIn(newUser);
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
        bookingService,
        startBooking,
        selectedBusinessId,
        businessReturnView,
        openBusiness,
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

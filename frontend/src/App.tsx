import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Landing from '@/pages/Landing';
import { CatalogoServicios } from '@/features/cliente';
import { InicioSesion, RegistroCliente, RegistroProveedor } from '@/features/auth';
import { GestionServicios } from '@/features/servicios';
import { PerfilUsuario } from '@/features/perfil';

function MainRouter() {
  const { currentView, notification, clearNotification } = useAuth();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'catalogo':
        return <CatalogoServicios initialView="catalogo" />;
      case 'reservas':
        return <CatalogoServicios initialView="reservas" />;
      case 'login':
        return <InicioSesion />;
      case 'registro-cliente':
        return <RegistroCliente />;
      case 'registro-proveedor':
        return <RegistroProveedor />;
      case 'servicios':
        return <GestionServicios />;
      case 'perfil':
        return <PerfilUsuario />;
      case 'landing':
      default:
        return <Landing />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Toast flotante de notificación global */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in">
          <div
            className={`px-5 py-3.5 rounded-[10px] shadow-xl border flex items-center gap-3 text-[14px] font-medium
              ${
                notification.type === 'success'
                  ? 'bg-[#005146] text-white border-emerald-700'
                  : notification.type === 'error'
                  ? 'bg-[#d94f41] text-white border-red-700'
                  : 'bg-[#18211e] text-white border-gray-700'
              }`}
          >
            {notification.type === 'success' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              type="button"
              onClick={clearNotification}
              className="text-white/80 hover:text-white ml-2 text-[16px] bg-transparent border-none cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Vista activa con animación de transición */}
      <div key={currentView} className="flex-1 flex flex-col animate-page-enter">
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

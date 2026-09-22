import React, { useState } from 'react';
import ProMarketLogo from './ProMarketLogo';
import { useAuth } from '@/context/AuthContext';

interface NavLink {
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}

interface NavBarProps {
  links?: NavLink[];
  trailing?: React.ReactNode;
  avatarInitial?: string;
}

export default function NavBar({ links: customLinks, trailing, avatarInitial: customAvatar }: NavBarProps) {
  const { user, isAuthenticated, currentView, navigate, logout, showNotification } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Navegación limpia y consistente
  const defaultLinks: NavLink[] = [];

  if (!isAuthenticated) {
    defaultLinks.push(
      {
        label: 'Explorar Servicios',
        active: currentView === 'catalogo' || currentView === 'reservas',
        onClick: () => navigate('catalogo'),
      },
      {
        label: '¿Cómo funciona?',
        onClick: () => {
          navigate('landing');
          setTimeout(() => {
            const el = document.getElementById('como-funciona');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        },
      }
    );
  } else if (user?.role === 'CLIENTE') {
    defaultLinks.push(
      {
        label: 'Explorar Servicios',
        active: currentView === 'catalogo',
        onClick: () => navigate('catalogo'),
      },
      {
        label: 'Mis Reservas',
        active: currentView === 'reservas',
        onClick: () => navigate('reservas'),
      }
    );
  } else if (user?.role === 'PROVEEDOR') {
    defaultLinks.push(
      {
        label: 'Mis Servicios',
        active: currentView === 'servicios',
        onClick: () => navigate('servicios'),
      },
      {
        label: 'Agenda y Disponibilidad',
        onClick: () => {
          showNotification(
            'info',
            'Agenda y Disponibilidad: Módulo actualmente en desarrollo.'
          );
        },
      },
      {
        label: 'Reservas Recibidas',
        onClick: () => {
          showNotification(
            'info',
            'Reservas Recibidas: Módulo actualmente en desarrollo.'
          );
        },
      },
      {
        label: 'Reportes',
        onClick: () => {
          showNotification(
            'info',
            'Reportes de Ocupación: Módulo actualmente en desarrollo.'
          );
        },
      }
    );
  }

  const activeLinks = customLinks || defaultLinks;
  const initial = customAvatar || user?.firstName?.charAt(0).toUpperCase() || 'U';

  const handleLogoClick = () => {
    if (isAuthenticated) {
      if (user?.role === 'PROVEEDOR') navigate('servicios');
      else navigate('catalogo');
    } else {
      navigate('landing');
    }
  };

  return (
    <header className="bg-[#fcfcf8] border-b border-[#d4d9d3] w-full z-20 sticky top-0 shadow-xs backdrop-blur-md bg-opacity-95">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-3.5 flex items-center justify-between">
        {/* Logo con micro-interacción */}
        <div
          onClick={handleLogoClick}
          className="cursor-pointer select-none transition-transform duration-150 active:scale-95 hover:opacity-90"
        >
          <ProMarketLogo />
        </div>

        {/* Links de navegación */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            {activeLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className={`text-[14px] font-semibold tracking-[0.14px] transition-all duration-150 bg-transparent border-none cursor-pointer py-1 relative flex items-center gap-1.5
                  ${
                    link.active
                      ? 'text-[#005146] border-b-2 border-[#005146]'
                      : 'text-[#66716c] hover:text-[#18211e] hover:-translate-y-0.5'
                  }`}
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                {link.label}
                {link.badge && (
                  <span className="w-4 h-4 rounded-full bg-[#005146] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {link.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Acciones de usuario autenticado o invitado consistente */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('login')}
                className={`font-semibold text-[14px] px-3.5 py-2 transition-all duration-150 cursor-pointer rounded-[8px] bg-transparent border-none
                  ${currentView === 'login' ? 'text-[#005146] bg-[#e6f0ef]' : 'text-[#005146] hover:bg-[#e6f0ef]'}`}
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => navigate('registro-cliente')}
                className="bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-4 py-2 rounded-[8px] transition-all duration-150 cursor-pointer shadow-xs active:scale-95 hover:shadow-md"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Registrarse
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#f2f3ee] transition-all duration-150 cursor-pointer bg-transparent border-none active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-[#005146] text-white flex items-center justify-center font-bold text-[13px] shadow-xs">
                  {initial}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[13px] font-semibold text-[#18211e] leading-tight">
                    {user?.firstName}
                  </span>
                  <span className="text-[11px] text-[#66716c] font-medium leading-tight">
                    {user?.role === 'PROVEEDOR' ? 'Proveedor' : 'Cliente'}
                  </span>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={`text-[#66716c] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Menú desplegable animado */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-[12px] shadow-xl border border-[#d4d9d3] py-2 z-30 flex flex-col animate-pop-in">
                    <div className="px-4 py-2.5 border-b border-[#ecefe9]">
                      <p className="text-[13px] font-semibold text-[#18211e] truncate">
                        {user?.firstName} {user?.lastName || ''}
                      </p>
                      <p className="text-[12px] text-[#66716c] truncate">
                        {user?.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('perfil');
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-[#18211e] hover:bg-[#f2f3ee] flex items-center gap-2.5 cursor-pointer bg-transparent border-none transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      {user?.role === 'PROVEEDOR' ? 'Perfil de Negocio' : 'Mi Perfil'}
                    </button>

                    <div className="my-1 border-t border-[#ecefe9]" />

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-[#d94f41] hover:bg-[#fdf1f0] flex items-center gap-2.5 cursor-pointer bg-transparent border-none transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

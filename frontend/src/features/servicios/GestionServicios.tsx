import React, { useState, useEffect } from 'react';
import { NavBar, SideNav } from '@/components/layout';
import { SuccessBanner, EmptyState } from '@/components/ui';
import ServicioCard from './components/ServicioCard';
import FormServicio from './components/FormServicio';
import { Servicio, FormServicio as FormServicioType, DEMO_SERVICIOS } from './types';
import { useAuth } from '@/context/AuthContext';

type View = 'lista' | 'nuevo' | 'editar';

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const PROVIDER_SERVICES_KEY = 'promarket_provider_servicios_state';

export default function GestionServicios() {
  const { user, navigate, showNotification, logout } = useAuth();
  const [view, setView] = useState<View>('lista');
  const [servicios, setServicios] = useState<Servicio[]>(() => {
    try {
      const stored = localStorage.getItem(PROVIDER_SERVICES_KEY);
      return stored ? JSON.parse(stored) : DEMO_SERVICIOS;
    } catch {
      return DEMO_SERVICIOS;
    }
  });

  const [editando, setEditando] = useState<Servicio | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(PROVIDER_SERVICES_KEY, JSON.stringify(servicios));
    } catch (e) {
      console.error('Error guardando servicios de proveedor', e);
    }
  }, [servicios]);

  const businessName = user?.businessName || 'Centro Vital Salud y Bienestar';
  const businessCategory = user?.businessCategory || 'Salud y Bienestar';

  const sideNavItems = [
    {
      label: 'Mis Servicios',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => setView('lista'),
    },
    {
      label: 'Perfil de Negocio',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
      onClick: () => navigate('perfil'),
    },
    {
      label: 'Cerrar Sesión',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => logout(),
    },
  ];

  function handleSave(form: FormServicioType, id?: string) {
    const precio = Math.round(parseFloat(form.precio.replace(',', '.')) * 100);
    if (id) {
      setServicios((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                nombre: form.nombre,
                categoria: form.categoria,
                duracion: parseInt(form.duracion),
                precio,
                descripcion: form.descripcion,
                activo: form.activo,
              }
            : s
        )
      );
      setBannerMsg(`"${form.nombre}" ha sido actualizado correctamente.`);
      showNotification('success', `Servicio "${form.nombre}" actualizado.`);
    } else {
      const nuevoServicio: Servicio = {
        id: genId(),
        nombre: form.nombre,
        categoria: form.categoria,
        duracion: parseInt(form.duracion),
        precio,
        descripcion: form.descripcion,
        activo: form.activo,
      };
      setServicios((prev) => [nuevoServicio, ...prev]);
      setBannerMsg(`"${form.nombre}" ha sido registrado en tu catálogo.`);
      showNotification('success', `Servicio "${form.nombre}" creado exitosamente.`);
    }
    setEditando(null);
    setView('lista');
    setShowBanner(true);
  }

  function handleToggle(id: string) {
    setServicios((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newState = !s.activo;
          showNotification(
            'info',
            `Servicio "${s.nombre}" ${newState ? 'activado' : 'desactivado'}.`
          );
          return { ...s, activo: newState };
        }
        return s;
      })
    );
  }

  const activos = servicios.filter((s) => s.activo).length;

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        {/* Barra Lateral */}
        <aside className="w-full md:w-[240px] shrink-0">
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 mb-5 shadow-xs">
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
              Panel Profesional
            </p>
            <p className="text-[#18211e] text-[17px] font-bold leading-snug">
              {businessName}
            </p>
            <span className="inline-block mt-1 text-[12px] text-[#005146] bg-[#e6f0ef] px-2 py-0.5 rounded-full font-medium">
              {businessCategory}
            </span>
          </div>

          <SideNav items={sideNavItems} active="Mis Servicios" />
        </aside>

        {/* Contenido Principal */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {showBanner && view === 'lista' && (
            <SuccessBanner
              title={bannerMsg}
              description="Los cambios se reflejan de inmediato en tu catálogo público para los clientes."
              onDismiss={() => setShowBanner(false)}
            />
          )}

          {view === 'nuevo' || view === 'editar' ? (
            <FormServicio
              editing={editando}
              onSave={handleSave}
              onCancel={() => {
                setView('lista');
                setEditando(null);
              }}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[#18211e] text-[24px] font-bold leading-tight">
                    Gestión de Servicios
                  </h2>
                  <p className="text-[#66716c] text-[14px] mt-1">
                    Administra los servicios que ofreces, ajusta precios y controla la disponibilidad.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditando(null);
                    setView('nuevo');
                    setShowBanner(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Agregar nuevo servicio
                </button>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total de servicios', value: servicios.length, color: '#005146' },
                  { label: 'Disponibles para reserva', value: activos, color: '#005146' },
                  { label: 'Pausados / Inactivos', value: servicios.length - activos, color: '#66716c' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[10px] px-5 py-4 flex items-center gap-3.5 shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#e6f0ef] flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke={stat.color} strokeWidth="1.8" />
                        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={stat.color} strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#18211e] text-[24px] font-bold leading-none">
                        {stat.value}
                      </p>
                      <p className="text-[#66716c] text-[12px] mt-1">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {servicios.length === 0 ? (
                <EmptyState
                  variant="dashed"
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  }
                  title="No tienes servicios registrados aún"
                  description="Comienza agregando tu primer servicio para que aparezca en el marketplace público y los clientes puedan reservarlo."
                  actionText="Crear mi primer servicio"
                  onAction={() => {
                    setEditando(null);
                    setView('nuevo');
                  }}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {servicios.map((s) => (
                    <ServicioCard
                      key={s.id}
                      servicio={s}
                      onEdit={() => {
                        setEditando(s);
                        setView('editar');
                        setShowBanner(false);
                      }}
                      onToggle={() => handleToggle(s.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { AppView, useAuth } from '@/context/AuthContext';
import { CATEGORIAS_SERVICIO_LABELS } from '@/features/servicios/types';
import SideNav from './SideNav';

const icon = (path: React.ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    {path}
  </svg>
);

const ITEMS: { label: string; view?: AppView; icon: React.ReactNode }[] = [
  {
    label: 'Mis Servicios',
    view: 'servicios',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: 'Agenda',
    view: 'agenda',
    icon: icon(
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: 'Horarios',
    view: 'horarios',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: 'Perfil de Negocio',
    view: 'perfil',
    icon: icon(
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" />
    ),
  },
  {
    label: 'Cerrar Sesión',
    icon: icon(
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

type Overrides = Partial<Record<string, () => void>>;

/** Provider side menu; `overrides` lets a page handle its own item (e.g. go back to its list). */
export function useProviderNavItems(overrides: Overrides = {}) {
  const { navigate, logout } = useAuth();
  return ITEMS.map(({ label, view, icon }) => ({
    label,
    icon,
    onClick: overrides[label] ?? (view ? () => navigate(view) : logout),
  }));
}

export default function ProviderAside({ active, overrides }: { active: string; overrides?: Overrides }) {
  const { user } = useAuth();
  const items = useProviderNavItems(overrides);
  const category = user?.businessCategory || '';

  return (
    <aside className="w-full md:w-[240px] shrink-0">
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 mb-5 shadow-xs">
        <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
          Panel Profesional
        </p>
        <p className="text-[#18211e] text-[17px] font-bold leading-snug">{user?.businessName || 'Mi Negocio'}</p>
        {category && (
          <span className="inline-block mt-1 text-[12px] text-[#005146] bg-[#e6f0ef] px-2 py-0.5 rounded-full font-medium">
            {CATEGORIAS_SERVICIO_LABELS[category] || category}
          </span>
        )}
      </div>

      <SideNav items={items} active={active} />
    </aside>
  );
}

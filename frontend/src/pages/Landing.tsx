import React, { useState } from 'react';
import { NavBar } from '@/components/layout';
import { useAuth, AppView } from '@/context/AuthContext';

interface CategoryCard {
  name: string;
  icon: React.ReactNode;
  count: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    name: 'Salud y Bienestar',
    count: '24 servicios',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    name: 'Belleza y Estética',
    count: '18 servicios',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v10M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Entrenamiento Físico',
    count: '12 servicios',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Reparaciones del Hogar',
    count: '30 servicios',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Educación y Tutorías',
    count: '15 servicios',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    name: 'Tecnología y TI',
    count: '10 servicios',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Landing() {
  const { navigate, isAuthenticated, user } = useAuth();
  const [searchWord, setSearchWord] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('catalogo');
  };

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-6 lg:px-10 border-b border-[#d4d9d3] bg-gradient-to-b from-[#fcfcf8] to-[#f2f3ee]">
        <div className="max-w-[1240px] mx-auto">
          <div className="max-w-[780px] text-left">
            <span className="inline-flex items-center gap-2 bg-[#e6f0ef] text-[#005146] text-[12px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-5 border border-[#b8d4d1]">
              Reserva de Servicios
            </span>
            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-bold text-[#18211e] leading-[1.1] tracking-[-1.2px]">
              Encuentra y reserva servicios de confianza en minutos.
            </h1>
            <p className="text-[17px] sm:text-[19px] text-[#66716c] leading-relaxed mt-5">
              Conectamos clientes con profesionales calificados en salud, belleza, mantenimiento, tutorías y más. Precios claros, agendas en tiempo real.
            </p>

            {/* Formulario de búsqueda rápida */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3 bg-white p-2.5 rounded-[12px] border border-[#d4d9d3] shadow-md max-w-[580px]"
            >
              <div className="flex-1 flex items-center px-3 gap-3">
                <svg className="text-[#66716c]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="¿Qué servicio buscas? (ej. Masaje, Plomería...)"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  className="w-full text-[15px] outline-none text-[#18211e] bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[15px] px-6 py-3 rounded-[8px] transition-colors cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </form>

            <div className="flex items-center gap-6 mt-6 text-[13px] text-[#66716c]">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="#005146" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Sin costos ocultos
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="#005146" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Profesionales verificados
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="#005146" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Confirmación instantánea
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Principales */}
      <section className="py-16 px-6 lg:px-10 max-w-[1240px] mx-auto w-full">
        <div className="text-center max-w-[600px] mx-auto mb-12">
          <span className="text-[#005146] text-[12px] font-bold uppercase tracking-wider block mb-2">
            Especialidades
          </span>
          <h2 className="text-[32px] sm:text-[36px] font-bold text-[#18211e] leading-tight">
            Explora por categoría
          </h2>
          <p className="text-[#66716c] text-[15px] mt-2">
            Encuentra exactamente lo que necesitas organizado por áreas profesionales.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate('catalogo')}
              className="bg-[#fcfcf8] hover:bg-white border border-[#d4d9d3] hover:border-[#005146] p-5 rounded-[14px] text-center transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-[#e6f0ef] text-[#005146] group-hover:bg-[#005146] group-hover:text-white transition-colors flex items-center justify-center">
                {cat.icon}
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#18211e] group-hover:text-[#005146] transition-colors leading-tight">
                  {cat.name}
                </h4>
                <p className="text-[12px] text-[#66716c] mt-1">{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ¿Cómo Funciona? */}
      <section id="como-funciona" className="py-16 px-6 lg:px-10 bg-[#fcfcf8] border-y border-[#d4d9d3]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <span className="text-[#005146] text-[12px] font-bold uppercase tracking-wider block mb-2">
              Paso a Paso
            </span>
            <h2 className="text-[32px] sm:text-[36px] font-bold text-[#18211e]">
              ¿Cómo funciona ProMarket?
            </h2>
            <p className="text-[#66716c] text-[15px] mt-2">
              Diseñado para que agendar un servicio profesional sea tan fácil como un clic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[16px] p-7 text-left flex flex-col justify-between">
              <div>
                <span className="text-[32px] font-bold text-[#005146] font-mono block mb-3">01</span>
                <h3 className="text-[19px] font-bold text-[#18211e] mb-2">
                  1. Explora el catálogo
                </h3>
                <p className="text-[14px] text-[#66716c] leading-relaxed">
                  Filtra por categoría, revisa precios transparentes, duración y calificaciones reales de otros clientes.
                </p>
              </div>
            </div>

            <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[16px] p-7 text-left flex flex-col justify-between">
              <div>
                <span className="text-[32px] font-bold text-[#005146] font-mono block mb-3">02</span>
                <h3 className="text-[19px] font-bold text-[#18211e] mb-2">
                  2. Agenda tu cita
                </h3>
                <p className="text-[14px] text-[#66716c] leading-relaxed">
                  Elige la fecha y el horario que mejor se adapte a tu disponibilidad con confirmación inmediata.
                </p>
              </div>
            </div>

            <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[16px] p-7 text-left flex flex-col justify-between">
              <div>
                <span className="text-[32px] font-bold text-[#005146] font-mono block mb-3">03</span>
                <h3 className="text-[19px] font-bold text-[#18211e] mb-2">
                  3. Disfruta el servicio
                </h3>
                <p className="text-[#66716c] text-[14px] leading-relaxed">
                  Recibe atención garantizada por profesionales verificados y gestiona todo desde tu panel de usuario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Llamado a la acción final */}
      <section className="py-14 px-6 lg:px-10 bg-[#005146] text-white">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h3 className="text-[26px] sm:text-[30px] font-bold leading-tight">
              ¿Listo para reservar o hacer crecer tu negocio?
            </h3>
            <p className="text-emerald-100 text-[15px] mt-2 max-w-xl">
              Únete hoy a ProMarket. Acceso inmediato a profesionales de calidad y herramientas de reserva en tiempo real.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('catalogo')}
              className="bg-white hover:bg-emerald-50 text-[#005146] font-semibold text-[14px] px-6 py-3 rounded-[8px] transition-colors cursor-pointer shadow-xs"
            >
              Explorar catálogo
            </button>
            <button
              type="button"
              onClick={() => navigate('registro-proveedor')}
              className="bg-[#006e5f] hover:bg-[#007f6e] text-white border border-emerald-400/40 font-semibold text-[14px] px-6 py-3 rounded-[8px] transition-colors cursor-pointer"
            >
              Registrar mi negocio
            </button>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-[#18211e] text-white py-8 px-6 lg:px-10 mt-auto border-t border-gray-800">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-[#9ca8a2]">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white text-[15px] tracking-wide">ProMarket</span>
            <span className="text-[#66716c]">·</span>
            <span className="text-[12.5px] text-[#66716c]">© {new Date().getFullYear()} Todos los derechos reservados</span>
          </div>
          <div className="flex items-center gap-6 text-[12.5px]">
            <span className="hover:text-white transition-colors cursor-pointer">Términos del Servicio</span>
            <span className="hover:text-white transition-colors cursor-pointer">Política de Privacidad</span>
            <span className="hover:text-white transition-colors cursor-pointer">Soporte Técnico</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

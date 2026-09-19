import { Servicio, fmtPrecio, fmtDuracion } from "../types";

interface ServicioCardProps {
  servicio: Servicio;
  onEdit: () => void;
  onToggle: () => void;
}

export default function ServicioCard({ servicio, onEdit, onToggle }: ServicioCardProps) {
  return (
    <div className={`bg-[#fcfcf8] border rounded-[12px] p-5 flex flex-col gap-3 transition-all ${
      servicio.activo ? "border-[#d4d9d3]" : "border-[#d4d9d3] opacity-60"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[#18211e] text-[16px] font-bold leading-[22px]"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif', fontVariationSettings: '"opsz" 14' }}>
              {servicio.nombre}
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              servicio.activo
                ? "bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]"
                : "bg-[#f2f3ee] text-[#66716c] border-[#d4d9d3]"
            }`} style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}>
              {servicio.activo ? "Disponible" : "No disponible"}
            </span>
          </div>
          <p className="text-[#66716c] text-[13px] mt-0.5" style={{ fontFamily: '"Inter:Regular", sans-serif' }}>
            {servicio.categoria}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#d4d9d3] hover:border-[#005146] hover:bg-[#e6f0ef] text-[#66716c] hover:text-[#005146] transition-colors"
            title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#d4d9d3] hover:border-[#005146] hover:bg-[#e6f0ef] text-[#66716c] hover:text-[#005146] transition-colors"
            title={servicio.activo ? "Desactivar" : "Activar"}>
            {servicio.activo ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {servicio.descripcion && (
        <p className="text-[#66716c] text-[13px] leading-[19px]" style={{ fontFamily: '"Inter:Regular", sans-serif' }}>
          {servicio.descripcion}
        </p>
      )}

      <div className="flex gap-3 pt-1 border-t border-[#f2f3ee]">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#66716c" strokeWidth="1.6" />
            <path d="M12 6v6l4 2" stroke="#66716c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[#18211e] text-[13px] font-semibold" style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}>
            {fmtDuracion(servicio.duracion)}
          </span>
        </div>
        <div className="w-px bg-[#d4d9d3]" />
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="1" x2="12" y2="23" stroke="#66716c" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#66716c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[#18211e] text-[13px] font-semibold" style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}>
            {fmtPrecio(servicio.precio)}
          </span>
        </div>
        <div className="ml-auto">
          <span className="text-[#66716c] text-[12px]" style={{ fontFamily: '"Inter:Regular", sans-serif' }}>
            Visible para clientes
          </span>
        </div>
      </div>
    </div>
  );
}

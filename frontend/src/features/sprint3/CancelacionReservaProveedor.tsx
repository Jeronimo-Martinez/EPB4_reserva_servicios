import { useState } from "react"
import { NavBar } from "@/components/layout"
import ProviderAside from "@/components/layout/ProviderAside"
import { useAuth } from "@/context/AuthContext"
import { SuccessBanner, TextareaField } from "@/components/ui"

type View = "detail" | "reason" | "confirm" | "success"


function Shell({ children }: { children: React.ReactNode }) {
  const { navigate } = useAuth()
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Reservas Recibidas" />
        <section className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => navigate('historial-proveedor')}
            className="text-[#66716c] hover:text-[#18211e] text-[13px] font-medium flex items-center gap-1.5 mb-4 cursor-pointer bg-transparent border-none"
            style={{ fontFamily: '"Inter:Medium", sans-serif' }}
          >
            ← Volver al historial de reservas
          </button>
          {children}
        </section>
      </main>
    </div>
  )
}

function ReservationInfo({
  cancelled,
  reason,
}: {
  cancelled: boolean
  reason: string
}) {
  return (
    <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 mt-5">
      {[
        ["Cliente", "Laura Gómez"],
        ["Servicio", "Masaje relajante"],
        ["Fecha", "Miércoles, 16 de julio de 2025"],
        ["Hora", "14:00 – 15:00"],
        ["Contacto", "laura.gomez@email.com"],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex justify-between gap-5 py-3 border-b border-[#e2e5df] last:border-0"
        >
          <span
            className="text-[#66716c] text-[13px]"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {label}
          </span>
          <span
            className="text-[#18211e] text-[13px] font-medium text-right"
            style={{ fontFamily: '"Inter:Medium", sans-serif' }}
          >
            {value}
          </span>
        </div>
      ))}
      {cancelled && (
        <div className="bg-[#fff4f2] border border-[#edc1bb] rounded-[8px] p-4 mt-4">
          <p
            className="text-[#b64135] text-[12px] font-semibold"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Cancelación iniciada por el proveedor
          </p>
          <p
            className="text-[#66716c] text-[12px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Motivo enviado a la cliente: {reason || "No se indicó un motivo."}
          </p>
        </div>
      )}
    </section>
  )
}

export default function CancelacionReservaProveedor() {
  const [view, setView] = useState<View>("detail")
  const [reason, setReason] = useState("")
  const [eligible, setEligible] = useState(true)

  if (view === "success") {
    return (
      <Shell>
        <SuccessBanner
          title="Reserva cancelada correctamente"
          description="El cliente recibió una notificación inmediata con el motivo ingresado y el horario quedó disponible."
        />
        <div className="mt-5">
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Cita cancelada
          </p>
          <div className="flex items-start justify-between mt-1">
            <h1
              className="text-[#18211e] text-[26px] font-bold"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              Reserva R-1848
            </h1>
            <span className="bg-[#fff0ee] text-[#b64135] border border-[#edc1bb] rounded-full px-3 py-1 text-[11px] font-semibold">
              Cancelada
            </span>
          </div>
          <ReservationInfo cancelled reason={reason} />
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 mt-5">
            <p
              className="text-[#18211e] text-[14px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Calendario · Miércoles 16 de julio
            </p>
            <div className="grid grid-cols-[70px_1fr] mt-4">
              <div className="text-[#66716c] text-[11px] py-4">14:00</div>
              <div className="border border-dashed border-[#b8d4d1] bg-[#f8fbf9] rounded-[7px] p-4">
                <p className="text-[#005146] text-[12px] font-semibold">
                  Disponible para reservas
                </p>
                <p className="text-[#66716c] text-[11px] mt-1">
                  El espacio se liberó automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <p
        className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
        style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
      >
        Detalle de la reserva
      </p>
      <div className="flex items-start justify-between gap-5 mt-1">
        <div>
          <h1
            className="text-[#18211e] text-[26px] font-bold"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Reserva R-1848
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Gestiona esta cita desde el calendario.
          </p>
        </div>
        <span
          className={`border rounded-full px-3 py-1 text-[11px] font-semibold ${
            eligible
              ? "bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]"
              : "bg-[#f2f3ee] text-[#66716c] border-[#d4d9d3]"
          }`}
        >
          {eligible ? "Confirmada" : "Atendida"}
        </span>
      </div>
      <ReservationInfo cancelled={false} reason="" />
      {eligible ? (
        <button
          onClick={() => setView("reason")}
          className="float-right mt-5 border border-[#d94f41] text-[#b64135] hover:bg-[#fff0ee] rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
        >
          Cancelar reserva
        </button>
      ) : (
        <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[8px] p-4 mt-5">
          <p className="text-[#18211e] text-[13px] font-semibold">
            Cancelación no disponible
          </p>
          <p className="text-[#66716c] text-[12px] mt-1">
            Las reservas pasadas, atendidas, canceladas o marcadas como
            inasistencia no pueden cancelarse.
          </p>
        </div>
      )}
      <button
        onClick={() => setEligible((value) => !value)}
        className="mt-6 text-[#005146] text-[12px] font-semibold underline"
      >
        {eligible ? "Ver caso no permitido" : "Volver a reserva activa"}
      </button>

      {(view === "reason" || view === "confirm") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute inset-0 bg-[#18211e]/35"
            onClick={() => setView("detail")}
            aria-label="Cerrar diálogo"
          />
          <div className="relative bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xl w-full max-w-[500px] p-6">
            {view === "reason" ? (
              <>
                <p
                  className="text-[#d94f41] text-[11px] font-semibold uppercase tracking-[0.8px]"
                  style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                >
                  Motivo de la cancelación
                </p>
                <h2
                  className="text-[#18211e] text-[22px] font-bold mt-1"
                  style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
                >
                  Cancelar reserva de Laura
                </h2>
                <p
                  className="text-[#66716c] text-[13px] leading-[20px] mt-2"
                  style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                >
                  Puedes explicar por qué no podrás prestar el servicio. El
                  motivo es opcional y se incluirá en la notificación.
                </p>
                <div className="mt-5">
                  <TextareaField
                    label="Motivo de cancelación (opcional)"
                    value={reason}
                    onChange={setReason}
                    placeholder="Ej: El profesional asignado no estará disponible."
                    maxLength={250}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setView("detail")}
                    className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setView("confirm")}
                    className="bg-[#b64135] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p
                  className="text-[#d94f41] text-[11px] font-semibold uppercase tracking-[0.8px]"
                  style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                >
                  Confirmar cancelación
                </p>
                <h2
                  className="text-[#18211e] text-[22px] font-bold mt-1"
                  style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
                >
                  ¿Confirmas la cancelación?
                </h2>
                <div className="bg-[#f2f3ee] rounded-[8px] p-4 mt-5">
                  <p className="text-[#18211e] text-[13px] font-semibold">
                    Laura Gómez · Masaje relajante
                  </p>
                  <p className="text-[#66716c] text-[12px] mt-1">
                    Miércoles, 16 de julio · 14:00 – 15:00
                  </p>
                  {reason && (
                    <p className="text-[#66716c] text-[12px] mt-3">
                      <strong>Motivo:</strong> {reason}
                    </p>
                  )}
                </div>
                <p className="text-[#66716c] text-[12px] leading-[18px] mt-4">
                  El horario se liberará, la cliente recibirá una notificación
                  inmediata y el historial indicará que la cancelación fue
                  iniciada por el proveedor.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setView("reason")}
                    className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
                  >
                    Revisar
                  </button>
                  <button
                    onClick={() => setView("success")}
                    className="bg-[#b64135] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
                  >
                    Sí, cancelar reserva
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

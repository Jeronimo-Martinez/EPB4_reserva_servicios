import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { NavBar } from "@/components/layout"
import { SuccessBanner } from "@/components/ui"

type Status = "Confirmada" | "Cancelada" | "Completada"
type View = "list" | "detail" | "dialog"

interface Booking {
  id: string
  service: string
  date: string
  time: string
  status: Status
}

const INITIAL: Booking[] = [
  {
    id: "R-2048",
    service: "Masaje relajante",
    date: "Miércoles, 23 de julio de 2025",
    time: "10:00 – 11:00",
    status: "Confirmada",
  },
  {
    id: "R-1984",
    service: "Consulta nutricional",
    date: "Martes, 8 de julio de 2025",
    time: "09:00 – 10:00",
    status: "Completada",
  },
]

function StatusBadge({ status }: { status: Status }) {
  const cls =
    status === "Confirmada"
      ? "bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]"
      : status === "Cancelada"
        ? "bg-[#fff0ee] text-[#b64135] border-[#edc1bb]"
        : "bg-[#f2f3ee] text-[#66716c] border-[#d4d9d3]"
  return (
    <span
      className={`inline-flex border rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
      style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
    >
      {status}
    </span>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[920px] mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}

export default function CancelacionReservaCliente() {
  const { navigate } = useAuth();
  const [bookings, setBookings] = useState(INITIAL)
  const [selected, setSelected] = useState(INITIAL[0])
  const [view, setView] = useState<View>("list")
  const [success, setSuccess] = useState(false)
  const current =
    bookings.find((booking) => booking.id === selected.id) ?? selected
  const canCancel = current.status === "Confirmada"

  function cancel() {
    setBookings((items) =>
      items.map((item) =>
        item.id === current.id ? { ...item, status: "Cancelada" } : item,
      ),
    )
    setSelected({ ...current, status: "Cancelada" })
    setView("detail")
    setSuccess(true)
  }

  return (
    <Shell>
      {view === "list" ? (
        <>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Tus Reservas
          </p>
          <h1
            className="text-[#18211e] text-[28px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Tus reservas
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1 mb-6"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Consulta y gestiona tus próximas citas.
          </p>
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => {
                  setSelected(booking)
                  setView("detail")
                  setSuccess(false)
                }}
                className="w-full bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146] rounded-[12px] p-5 text-left flex items-center justify-between gap-5"
              >
                <div>
                  <p
                    className="text-[#18211e] text-[17px] font-bold"
                    style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
                  >
                    {booking.service}
                  </p>
                  <p
                    className="text-[#66716c] text-[13px] mt-1"
                    style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                  >
                    Centro Vital · {booking.date}
                  </p>
                  <p
                    className="text-[#66716c] text-[12px] mt-1"
                    style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                  >
                    {booking.time}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-5">
          {success && (
            <SuccessBanner
              title="Reserva cancelada correctamente"
              description="El horario fue liberado exitosamente y el negocio recibió la notificación correspondiente."
            />
          )}
          <button
            onClick={() => navigate("reservas")}
            className="self-start text-[#66716c] hover:text-[#18211e] text-[13px] font-medium"
            style={{ fontFamily: '"Inter:Medium", sans-serif' }}
          >
            ← Volver a mis reservas
          </button>
          <div>
            <p
              className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              {success
                ? "Reserva cancelada"
                : "Detalle de la reserva"}
            </p>
            <div className="flex items-start justify-between gap-4 mt-1">
              <h1
                className="text-[#18211e] text-[27px] font-bold"
                style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
              >
                {current.service}
              </h1>
              <StatusBadge status={current.status} />
            </div>
          </div>
          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6">
            {[
              ["Negocio", "Centro Vital"],
              ["Fecha", current.date],
              ["Hora", current.time],
              ["Código", current.id],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-3 border-b border-[#e2e5df] last:border-0"
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
            {success && (
              <div className="mt-4 bg-[#f2f3ee] rounded-[8px] p-4">
                <p
                  className="text-[#18211e] text-[12px] font-semibold"
                  style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                >
                  Registro de actividad
                </p>
                <p
                  className="text-[#66716c] text-[12px] mt-1"
                  style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                >
                  Cancelada por la cliente · Horario nuevamente disponible.
                </p>
              </div>
            )}
          </section>
          {canCancel ? (
            <button
              onClick={() => setView("dialog")}
              className="self-end border border-[#d94f41] text-[#b64135] hover:bg-[#fff0ee] rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Cancelar reserva
            </button>
          ) : (
            <div
              className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[8px] p-4"
              role="status"
            >
              <p
                className="text-[#18211e] text-[13px] font-semibold"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Cancelación no disponible
              </p>
              <p
                className="text-[#66716c] text-[12px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {current.status === "Cancelada"
                  ? "Esta reserva ya fue cancelada y no admite nuevas acciones."
                  : "Las reservas pasadas, atendidas o marcadas como inasistencia no pueden cancelarse."}
              </p>
            </div>
          )}
        </div>
      )}
      {view === "dialog" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-title"
        >
          <button
            className="absolute inset-0 bg-[#18211e]/35"
            onClick={() => setView("detail")}
            aria-label="Cerrar confirmación"
          />
          <div className="relative bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xl w-full max-w-[470px] p-6">
            <p
              className="text-[#d94f41] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Confirmar cancelación
            </p>
            <h2
              id="cancel-title"
              className="text-[#18211e] text-[22px] font-bold mt-1"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              ¿Quieres cancelar esta reserva?
            </h2>
            <p
              className="text-[#66716c] text-[13px] leading-[20px] mt-3"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Esta acción cambiará el estado a “Cancelada”, liberará el horario
              de {current.time.split(" – ")[0]} y notificará a Centro Vital.
            </p>
            <div className="bg-[#f2f3ee] rounded-[8px] p-4 mt-4">
              <p
                className="text-[#18211e] text-[13px] font-semibold"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                {current.service}
              </p>
              <p
                className="text-[#66716c] text-[12px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {current.date} · {current.time}
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setView("detail")}
                className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
              >
                Conservar reserva
              </button>
              <button
                onClick={cancel}
                className="bg-[#b64135] hover:bg-[#96362d] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

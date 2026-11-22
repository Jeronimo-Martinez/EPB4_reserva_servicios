import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { NavBar } from "@/components/layout"

type Audience = "cliente" | "proveedor"
type Tone = "info" | "success" | "warning" | "danger"

interface Notification {
  id: string
  audience: Audience
  frame: string
  title: string
  message: string
  meta: string
  tone: Tone
  unread: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "reminder",
    audience: "cliente",
    frame: "Recordatorio de cita",
    title: "Tu cita es mañana",
    message: "Te esperamos en Centro Vital para tu masaje relajante.",
    meta: "Miércoles, 23 de julio · 10:00",
    tone: "info",
    unread: true,
  },
  {
    id: "new",
    audience: "proveedor",
    frame: "Nueva reserva",
    title: "Nueva reserva recibida",
    message: "Laura Gómez reservó un masaje relajante.",
    meta: "Miércoles, 23 de julio · 10:00",
    tone: "success",
    unread: true,
  },
  {
    id: "reschedule-customer",
    audience: "cliente",
    frame: "Cita reprogramada",
    title: "Tu reserva fue reprogramada",
    message: "Horario anterior: 23 jul, 10:00 · Nuevo horario: 24 jul, 11:00.",
    meta: "Centro Vital · Masaje relajante",
    tone: "warning",
    unread: true,
  },
  {
    id: "reschedule-provider",
    audience: "proveedor",
    frame: "Cita reprogramada",
    title: "Laura reprogramó su reserva",
    message: "Horario anterior: 23 jul, 10:00 · Nuevo horario: 24 jul, 11:00.",
    meta: "Masaje relajante · R-2048",
    tone: "warning",
    unread: true,
  },
  {
    id: "provider-cancel",
    audience: "cliente",
    frame: "Cancelación de cita",
    title: "Centro Vital canceló tu reserva",
    message: "Motivo: el profesional asignado no estará disponible.",
    meta: "Miércoles, 23 de julio · 10:00",
    tone: "danger",
    unread: false,
  },
  {
    id: "customer-cancel",
    audience: "proveedor",
    frame: "Cancelación de cita",
    title: "Laura canceló su reserva",
    message:
      "El horario quedó libre y vuelve a estar disponible para otros clientes.",
    meta: "Miércoles, 23 de julio · 10:00",
    tone: "danger",
    unread: false,
  },
]

function NotificationIcon({ tone }: { tone: Tone }) {
  const style =
    tone === "danger"
      ? "bg-[#fff0ee] text-[#b64135]"
      : tone === "warning"
        ? "bg-[#fff6e8] text-[#94611c]"
        : "bg-[#e6f0ef] text-[#005146]"
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M13.7 21a2 2 0 01-3.4 0"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    </div>
  )
}

export default function NotificacionesEstadoReservas() {
  const { user } = useAuth();
  const [audience, setAudience] = useState<Audience>(user?.role === "PROVEEDOR" ? "proveedor" : "cliente")
  const [read, setRead] = useState<string[]>([])
  const visible = NOTIFICATIONS.filter(
    (notification) => notification.audience === audience,
  )
  const unread = visible.filter(
    (notification) => notification.unread && !read.includes(notification.id),
  ).length

  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar
        links={
          audience === "cliente"
            ? [{ label: "Descubrir" }, { label: "Mis reservas" }]
            : [
                { label: "Calendario" },
                { label: "Reservas" },
                { label: "Servicios" },
              ]
        }
        avatarInitial={audience === "cliente" ? "M" : "J"}
      />
      <main className="w-full max-w-[940px] mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p
              className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Notificaciones
            </p>
            <h1
              className="text-[#18211e] text-[28px] font-bold mt-1"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              Notificaciones
            </h1>
            <p
              className="text-[#66716c] text-[14px] mt-1"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Novedades importantes sobre reservas y próximas citas.
            </p>
          </div>
          <div
            className="inline-flex bg-[#e5e7e3] rounded-[8px] p-1"
            role="group"
            aria-label="Cambiar destinatario de las notificaciones"
          >
            {(["cliente", "proveedor"] as Audience[]).map((item) => (
              <button
                key={item}
                onClick={() => setAudience(item)}
                aria-pressed={audience === item}
                className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold capitalize ${
                  audience === item
                    ? "bg-[#fcfcf8] text-[#005146] shadow-sm"
                    : "text-[#66716c]"
                }`}
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] overflow-hidden mt-7">
          <div className="px-5 py-4 border-b border-[#d4d9d3] flex items-center justify-between">
            <div>
              <p
                className="text-[#18211e] text-[15px] font-semibold"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Bandeja de {audience}
              </p>
              <p
                className="text-[#66716c] text-[11px] mt-0.5"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {unread
                  ? `${unread} notificaciones sin leer`
                  : "Todo está al día"}
              </p>
            </div>
            <span
              className="bg-[#e6f0ef] text-[#005146] rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Destinatario: {audience}
            </span>
          </div>
          <div className="divide-y divide-[#e2e5df]">
            {visible.map((notification) => {
              const isUnread =
                notification.unread && !read.includes(notification.id)
              return (
                <button
                  key={notification.id}
                  onClick={() =>
                    setRead((items) =>
                      items.includes(notification.id)
                        ? items
                        : [...items, notification.id],
                    )
                  }
                  className={`w-full p-5 text-left flex gap-4 transition-colors ${
                    isUnread
                      ? "bg-[#f8fbf9]"
                      : "bg-[#fcfcf8] hover:bg-[#fafbf7]"
                  }`}
                >
                  <NotificationIcon tone={notification.tone} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className="text-[#005146] text-[9px] font-semibold uppercase tracking-[0.65px]"
                          style={{
                            fontFamily: '"Inter:Semi Bold", sans-serif',
                          }}
                        >
                          {notification.frame}
                        </p>
                        <p
                          className="text-[#18211e] text-[14px] font-semibold mt-1"
                          style={{
                            fontFamily: '"Inter:Semi Bold", sans-serif',
                          }}
                        >
                          {notification.title}
                        </p>
                      </div>
                      {isUnread && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#005146] shrink-0 mt-1"
                          aria-label="Sin leer"
                        />
                      )}
                    </div>
                    <p
                      className="text-[#66716c] text-[13px] leading-[19px] mt-1"
                      style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                    >
                      {notification.message}
                    </p>
                    <p
                      className="text-[#18211e] text-[11px] font-medium mt-2"
                      style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                    >
                      {notification.meta}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        <p
          className="text-[#66716c] text-[11px] leading-[17px] mt-4"
          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
        >
          Selecciona una notificación para marcarla como leída. Esta vista
          representa únicamente el contenido dentro de ProMarket; no introduce
          canales ni preferencias adicionales.
        </p>
      </main>
    </div>
  )
}

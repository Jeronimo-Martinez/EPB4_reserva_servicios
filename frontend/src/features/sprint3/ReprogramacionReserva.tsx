import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { NavBar } from "@/components/layout"
import { SuccessBanner } from "@/components/ui"

type View = "detail" | "select" | "summary" | "confirm" | "success"

const DATES = [
  { day: 24, label: "Jueves, 24 de julio", short: "Jue" },
  { day: 25, label: "Viernes, 25 de julio", short: "Vie" },
  { day: 26, label: "Sábado, 26 de julio", short: "Sáb" },
]

const TIMES: Record<number, string[]> = {
  24: ["09:30", "11:00", "14:00"],
  25: ["08:00", "10:30", "15:30"],
  26: ["09:00", "12:00"],
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[940px] mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-3 border-b border-[#e2e5df] last:border-0">
      <span
        className="text-[#66716c] text-[13px]"
        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
      >
        {label}
      </span>
      <span
        className={`text-[13px] text-right ${
          emphasis
            ? "text-[#005146] font-semibold"
            : "text-[#18211e] font-medium"
        }`}
        style={{
          fontFamily: emphasis
            ? '"Inter:Semi Bold", sans-serif'
            : '"Inter:Medium", sans-serif',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export default function ReprogramacionReserva() {
  const { navigate } = useAuth();
  const [view, setView] = useState<View>("detail")
  const [day, setDay] = useState(24)
  const [time, setTime] = useState("")
  const [conflict, setConflict] = useState(false)
  const [conflictShown, setConflictShown] = useState(false)
  const [conflictSlot, setConflictSlot] = useState("")
  const [conflictDay, setConflictDay] = useState(0)
  const [eligible, setEligible] = useState(true)
  const date = DATES.find((item) => item.day === day) ?? DATES[0]

  function applyChange() {
    if (!conflictShown) {
      setConflictSlot(time)
      setConflictDay(day)
      setConflict(true)
      setConflictShown(true)
      setTime("")
      setView("select")
      return
    }
    setView("success")
  }

  if (view === "select") {
    return (
      <Shell>
        <button
          onClick={() => setView("detail")}
          className="text-[#66716c] hover:text-[#18211e] text-[13px]"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
        >
          ← Volver al detalle
        </button>
        <p
          className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px] mt-6"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Seleccionar nueva fecha y hora
        </p>
        <h1
          className="text-[#18211e] text-[27px] font-bold mt-1"
          style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
        >
          Elige un nuevo horario
        </h1>
        <p
          className="text-[#66716c] text-[14px] mt-1"
          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
        >
          Solo se muestran espacios compatibles con los 60 minutos del servicio.
        </p>
        {conflict && (
          <div
            className="bg-[#fff4f2] border border-[#edc1bb] rounded-[10px] px-5 py-4 mt-5"
            role="alert"
          >
            <p
              className="text-[#b64135] text-[13px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              El horario seleccionado ya no está disponible
            </p>
            <p
              className="text-[#66716c] text-[12px] mt-1"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Otro cliente tomó el horario de las {conflictSlot}. Elige una
              alternativa para continuar.
            </p>
          </div>
        )}
        <div className="grid md:grid-cols-[1fr_280px] gap-5 mt-6">
          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6">
            <p
              className="text-[#18211e] text-[14px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Fechas disponibles
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {DATES.map((item) => (
                <button
                  key={item.day}
                  onClick={() => {
                    setDay(item.day)
                    setTime("")
                    setConflict(false)
                  }}
                  aria-pressed={day === item.day}
                  className={`rounded-[8px] border py-3 text-center ${
                    day === item.day
                      ? "bg-[#005146] border-[#005146] text-white"
                      : "border-[#d4d9d3] text-[#18211e]"
                  }`}
                >
                  <span
                    className="block text-[10px] uppercase"
                    style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                  >
                    {item.short}
                  </span>
                  <span
                    className="block text-[17px] font-semibold mt-1"
                    style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                  >
                    {item.day}
                  </span>
                </button>
              ))}
            </div>
            <p
              className="text-[#18211e] text-[14px] font-semibold mt-6"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Horarios para {date.label.toLowerCase()}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {TIMES[day]
                .filter(
                  (slot) =>
                    !(
                      conflictShown &&
                      day === conflictDay &&
                      slot === conflictSlot
                    ),
                )
                .map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    aria-pressed={time === slot}
                    className={`rounded-[8px] border py-2.5 text-[13px] font-semibold ${
                      time === slot
                        ? "bg-[#e6f0ef] border-[#005146] text-[#005146]"
                        : "border-[#d4d9d3] text-[#18211e]"
                    }`}
                    style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                  >
                    {slot}
                  </button>
                ))}
            </div>
            <div className="bg-[#f2f3ee] rounded-[8px] p-3 mt-5">
              <p
                className="text-[#66716c] text-[11px] leading-[17px]"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Los horarios ocupados o bloqueados por Centro Vital se excluyen
                automáticamente.
              </p>
            </div>
          </section>
          <aside className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 h-fit">
            <p
              className="text-[#18211e] text-[14px] font-semibold pb-3 border-b border-[#d4d9d3]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Nueva cita
            </p>
            <Row label="Fecha" value={date.label} />
            <Row label="Hora" value={time || "Por seleccionar"} />
            <button
              disabled={!time}
              onClick={() => setView("summary")}
              className="w-full bg-[#005146] disabled:opacity-50 text-white rounded-[8px] py-2.5 mt-4 text-[14px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Revisar cambio
            </button>
          </aside>
        </div>
      </Shell>
    )
  }

  if (view === "summary" || view === "confirm") {
    return (
      <Shell>
        <p
          className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          {view === "summary"
            ? "Resumen del cambio"
            : "Confirmar reprogramación"}
        </p>
        <h1
          className="text-[#18211e] text-[27px] font-bold mt-1"
          style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
        >
          {view === "summary"
            ? "Revisa el cambio de horario"
            : "¿Confirmas la reprogramación?"}
        </h1>
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5">
            <p
              className="text-[#66716c] text-[11px] uppercase tracking-[0.7px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Horario anterior
            </p>
            <Row label="Fecha" value="Miércoles, 23 de julio" />
            <Row label="Hora" value="10:00 – 11:00" />
          </section>
          <section className="bg-[#fcfcf8] border border-[#005146] rounded-[12px] p-5">
            <p
              className="text-[#005146] text-[11px] uppercase tracking-[0.7px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Nuevo horario
            </p>
            <Row label="Fecha" value={`${date.label} de 2025`} emphasis />
            <Row
              label="Hora"
              value={`${time} – ${
                time === "09:30"
                  ? "10:30"
                  : time === "11:00"
                    ? "12:00"
                    : "15:00"
              }`}
              emphasis
            />
          </section>
        </div>
        <div className="bg-[#e6f0ef] border border-[#b8d4d1] rounded-[8px] p-4 mt-5">
          <p
            className="text-[#18211e] text-[12px] leading-[18px]"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Al confirmar, el horario anterior se liberará y el nuevo quedará
            reservado. Centro Vital recibirá una notificación con ambos
            horarios.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setView(view === "summary" ? "select" : "summary")}
            className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
          >
            {view === "summary" ? "Cambiar selección" : "Volver"}
          </button>
          <button
            onClick={() => setView(view === "summary" ? "confirm" : "confirm")}
            className={`bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold ${
              view === "confirm" ? "hidden" : ""
            }`}
          >
            Continuar
          </button>
          {view === "confirm" && (
            <button
              onClick={applyChange}
              className="bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
            >
              Sí, reprogramar
            </button>
          )}
        </div>
      </Shell>
    )
  }

  if (view === "success") {
    return (
      <Shell>
        <SuccessBanner
          title="Reserva reprogramada correctamente"
          description="El horario anterior quedó liberado y el negocio recibió la notificación con los detalles."
        />
        <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-7 mt-5">
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Nuevo horario confirmado
          </p>
          <h1
            className="text-[#18211e] text-[25px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Masaje relajante
          </h1>
          <Row label="Fecha" value={`${date.label} de 2025`} emphasis />
          <Row label="Hora" value={time} emphasis />
          <Row label="Estado" value="Confirmada" />
        </section>
      </Shell>
    )
  }

  return (
    <Shell>
      <p
        className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
        style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
      >
        Reprogramación de Cita
      </p>
      <div className="flex items-start justify-between gap-5 mt-1">
        <div>
          <h1
            className="text-[#18211e] text-[27px] font-bold"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Masaje relajante
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Centro Vital · Reserva R-2048
          </p>
        </div>
        <span
          className={`border rounded-full px-3 py-1 text-[11px] font-semibold ${
            eligible
              ? "bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]"
              : "bg-[#f2f3ee] text-[#66716c] border-[#d4d9d3]"
          }`}
        >
          {eligible ? "Confirmada" : "Cancelada"}
        </span>
      </div>
      <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 mt-6">
        <Row label="Fecha" value="Miércoles, 23 de julio de 2025" />
        <Row label="Hora" value="10:00 – 11:00" />
        <Row label="Servicio" value="Masaje relajante · 60 min" />
      </section>
      {eligible ? (
        <button
          onClick={() => setView("select")}
          className="float-right mt-5 bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
        >
          Reprogramar reserva
        </button>
      ) : (
        <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[8px] p-4 mt-5">
          <p className="text-[#18211e] text-[13px] font-semibold">
            Reprogramación no disponible
          </p>
          <p className="text-[#66716c] text-[12px] mt-1">
            Las reservas pasadas o canceladas no pueden reprogramarse.
          </p>
        </div>
      )}
      <button
        onClick={() => setEligible((value) => !value)}
        className="mt-6 text-[#005146] text-[12px] font-semibold underline"
      >
        {eligible ? "Ver caso no permitido" : "Volver a reserva activa"}
      </button>
    </Shell>
  )
}

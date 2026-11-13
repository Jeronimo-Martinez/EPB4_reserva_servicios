import { useState } from "react"
import { NavBar } from "@/components/layout"
import ProviderAside from "@/components/layout/ProviderAside"
import { useAuth } from "@/context/AuthContext"
import { InputField, SuccessBanner } from "@/components/ui"

type Step = "calendar" | "form" | "summary" | "warning"


const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
]

function ProviderShell({ children }: { children: React.ReactNode }) {
  const { navigate } = useAuth()
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Horarios" />
        <section className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => navigate('horarios')}
            className="text-[#66716c] hover:text-[#18211e] text-[13px] font-medium flex items-center gap-1.5 mb-4 cursor-pointer bg-transparent border-none"
            style={{ fontFamily: '"Inter:Medium", sans-serif' }}
          >
            ← Volver a horarios de atención
          </button>
          {children}
        </section>
      </main>
    </div>
  )
}

function Calendar({
  blocked,
  onCreate,
}: {
  blocked: boolean
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {blocked && (
        <SuccessBanner
          title="Bloqueo creado correctamente"
          description="Calendario actualizado. Los clientes ya no podrán reservar en este periodo."
        />
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Gestión de Disponibilidad
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Disponibilidad y bloqueos
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Gestiona los periodos en los que no podrás recibir reservas.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Bloquear periodo
        </button>
      </div>
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#d4d9d3] flex items-center justify-between">
          <h2
            className="text-[#18211e] text-[16px] font-bold"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            14 – 18 de julio de 2025
          </h2>
          <div
            className="flex gap-4 text-[#66716c] text-[10px]"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#e6f0ef] border-l-2 border-[#005146]" />
              Reserva
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#e5e7e3] border border-[#b8bfba]" />
              No disponible
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[64px_repeat(5,minmax(105px,1fr))] bg-[#f8f8f4] border-b border-[#d4d9d3]">
          <div />
          {["Lun 14", "Mar 15", "Mié 16", "Jue 17", "Vie 18"].map((day) => (
            <div
              key={day}
              className="text-center py-3 border-l border-[#e2e5df] text-[#18211e] text-[12px] font-semibold"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              {day}
            </div>
          ))}
        </div>
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[64px_repeat(5,minmax(105px,1fr))] min-h-[58px] border-b border-[#e2e5df] last:border-0"
          >
            <div
              className="bg-[#f8f8f4] text-[#66716c] text-[10px] text-right pr-3 pt-2"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              {hour}
            </div>
            {[0, 1, 2, 3, 4].map((day) => {
              const reservation = day === 2 && hour === "14:00"
              const newBlock =
                blocked && day === 2 && ["13:00", "15:00"].includes(hour)
              return (
                <div key={day} className="border-l border-[#e2e5df] p-1.5">
                  {reservation && (
                    <div className="h-full rounded-[5px] bg-[#e6f0ef] border-l-[3px] border-[#005146] px-2 py-1">
                      <p
                        className="text-[#005146] text-[10px] font-semibold"
                        style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                      >
                        Laura Gómez
                      </p>
                      <p
                        className="text-[#66716c] text-[9px]"
                        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                      >
                        Masaje relajante
                      </p>
                    </div>
                  )}
                  {newBlock && (
                    <div className="h-full rounded-[5px] bg-[#e5e7e3] border border-[#b8bfba] px-2 py-1">
                      <p
                        className="text-[#4d5753] text-[10px] font-semibold"
                        style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                      >
                        No disponible
                      </p>
                      <p
                        className="text-[#66716c] text-[9px]"
                        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                      >
                        Asunto personal
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {blocked && (
        <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[8px] p-4">
          <p
            className="text-[#18211e] text-[13px] font-semibold"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Vista del cliente
          </p>
          <p
            className="text-[#66716c] text-[12px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Los horarios de 13:00 a 16:00 fueron retirados automáticamente de la
            disponibilidad pública.
          </p>
        </div>
      )}
    </div>
  )
}

function Dialog({
  step,
  onClose,
  onNext,
  onConflict,
}: {
  step: Step
  onClose: () => void
  onNext: () => void
  onConflict: () => void
}) {
  const [startDate, setStartDate] = useState("2025-07-16")
  const [endDate, setEndDate] = useState("2025-07-16")
  const [start, setStart] = useState("13:00")
  const [end, setEnd] = useState("16:00")
  const [reason, setReason] = useState("Asunto personal")
  const [error, setError] = useState("")

  function validate() {
    if (!startDate || !endDate || !start || !end)
      return setError("Completa la fecha y el rango de horas.")
    if (start >= end)
      return setError("La hora final debe ser posterior a la hora inicial.")
    setError("")
    onNext()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        className="absolute inset-0 bg-[#18211e]/35"
        onClick={onClose}
        aria-label="Cerrar diálogo"
      />
      <div className="relative bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xl w-full max-w-[540px] p-6">
        {step === "form" && (
          <>
            <p
              className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Paso 1 · Seleccionar fecha y hora
            </p>
            <h2
              className="text-[#18211e] text-[22px] font-bold mt-1"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              Bloquear disponibilidad
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-5">
              <InputField
                label="Fecha inicial"
                type="date"
                value={startDate}
                onChange={setStartDate}
              />
              <InputField
                label="Fecha final"
                type="date"
                value={endDate}
                onChange={setEndDate}
              />
              <InputField
                label="Hora inicial"
                type="time"
                value={start}
                onChange={setStart}
              />
              <InputField
                label="Hora final"
                type="time"
                value={end}
                onChange={setEnd}
              />
            </div>
            <div className="mt-4">
              <InputField
                label="Motivo interno (opcional)"
                value={reason}
                onChange={setReason}
                hint="Los clientes solo verán el periodo como no disponible."
              />
            </div>
            {error && (
              <p
                className="text-[#d94f41] text-[12px] mt-3"
                role="alert"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
              >
                Cancelar
              </button>
              <button
                onClick={validate}
                className="bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
              >
                Continuar
              </button>
            </div>
          </>
        )}
        {step === "summary" && (
          <>
            <p
              className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Confirmar bloqueo de horario
            </p>
            <h2
              className="text-[#18211e] text-[22px] font-bold mt-1"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              Revisa el periodo seleccionado
            </h2>
            <div
              className="bg-[#f2f3ee] rounded-[8px] p-4 mt-5 text-[13px]"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              <p>
                <strong>Fecha:</strong> Miércoles, 16 de julio de 2025
              </p>
              <p className="mt-2">
                <strong>Horario:</strong> 13:00 – 16:00
              </p>
              <p className="mt-2">
                <strong>Motivo:</strong> {reason || "Sin motivo"}
              </p>
            </div>
            <p
              className="text-[#66716c] text-[12px] leading-[18px] mt-4"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Este periodo dejará de aparecer como disponible para los clientes.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
              >
                Volver
              </button>
              <button
                onClick={onConflict}
                className="bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
              >
                Confirmar bloqueo
              </button>
            </div>
          </>
        )}
        {step === "warning" && (
          <>
            <div className="w-11 h-11 rounded-full bg-[#fff0ee] text-[#d94f41] flex items-center justify-center">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5M12 17h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10.3 3.7L2.5 18a2 2 0 001.8 3h15.4a2 2 0 001.8-3L13.7 3.7a2 2 0 00-3.4 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <p
              className="text-[#d94f41] text-[11px] font-semibold uppercase tracking-[0.8px] mt-4"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Advertencia · Conflicto con reservas existentes
            </p>
            <h2
              className="text-[#18211e] text-[22px] font-bold mt-1"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              El bloqueo coincide con una reserva
            </h2>
            <div className="bg-[#fff4f2] border border-[#edc1bb] rounded-[8px] p-4 mt-4">
              <p
                className="text-[#18211e] text-[13px] font-semibold"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Laura Gómez · Masaje relajante
              </p>
              <p
                className="text-[#66716c] text-[12px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Miércoles, 16 de julio · 14:00 – 15:00
              </p>
            </div>
            <p
              className="text-[#66716c] text-[12px] leading-[18px] mt-4"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Para proteger la reserva existente, el bloqueo se aplicará de
              13:00 a 14:00 y de 15:00 a 16:00. La cita no será cancelada.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
              >
                Revisar
              </button>
              <button
                onClick={onNext}
                className="bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
              >
                Aplicar sin afectar la reserva
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function BloqueoFechasHorarios() {
  const [step, setStep] = useState<Step>("calendar")
  const [blocked, setBlocked] = useState(false)
  return (
    <ProviderShell>
      <Calendar blocked={blocked} onCreate={() => setStep("form")} />
      {step !== "calendar" && (
        <Dialog
          step={step}
          onClose={() => setStep("calendar")}
          onNext={() => {
            if (step === "form") setStep("summary")
            else {
              setBlocked(true)
              setStep("calendar")
            }
          }}
          onConflict={() => setStep("warning")}
        />
      )}
    </ProviderShell>
  )
}

import { useState } from "react"
import {
  Period,
  PeriodSelector,
  ReportShell,
} from "./ReporteUsoServicios"

interface AppointmentMetrics {
  scheduled: number
  attended: number
  capacity: number
  cancelled: number
  noShow: number
}

export const APPOINTMENT_DATA: Record<Period, AppointmentMetrics> = {
  día: { scheduled: 10, attended: 7, capacity: 12, cancelled: 2, noShow: 1 },
  semana: {
    scheduled: 50,
    attended: 38,
    capacity: 60,
    cancelled: 7,
    noShow: 5,
  },
  mes: {
    scheduled: 189,
    attended: 143,
    capacity: 240,
    cancelled: 29,
    noShow: 17,
  },
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string
  value: string
  helper: string
  tone?: "default" | "success" | "danger" | "warning"
}) {
  const iconStyle =
    tone === "success"
      ? "bg-[#e6f0ef] text-[#005146]"
      : tone === "danger"
        ? "bg-[#fff0ee] text-[#b64135]"
        : tone === "warning"
          ? "bg-[#fff6e8] text-[#94611c]"
          : "bg-[#f2f3ee] text-[#66716c]"
  return (
    <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 shadow-xs">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${iconStyle}`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 2v4M16 2v4M3 9h18"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      </div>
      <p
        className="text-[#66716c] text-[11px] mt-4"
        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-[#18211e] text-[25px] font-bold mt-1"
        style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
      >
        {value}
      </p>
      <p
        className="text-[#66716c] text-[10px] mt-1"
        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
      >
        {helper}
      </p>
    </div>
  )
}

export function AppointmentReportContent({ period }: { period: Period }) {
  const data = APPOINTMENT_DATA[period]
  const percentage = (value: number) =>
    Math.round((value / data.scheduled) * 100)
  const attended = percentage(data.attended)
  const cancelled = percentage(data.cancelled)
  const noShow = percentage(data.noShow)
  const occupancy = Math.round((data.scheduled / data.capacity) * 100)

  return (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          label="Citas programadas"
          value={String(data.scheduled)}
          helper="Reservas agendadas en el periodo"
        />
        <MetricCard
          label="Capacidad total"
          value={String(data.capacity)}
          helper="Cupos disponibles del negocio"
        />
        <MetricCard
          label="Ocupación de agenda"
          value={`${occupancy}%`}
          helper={`${data.scheduled} de ${data.capacity} cupos reservados`}
        />
        <MetricCard
          label="Citas atendidas"
          value={String(data.attended)}
          helper={`${attended}% de las citas programadas`}
          tone="success"
        />
        <MetricCard
          label="Citas canceladas"
          value={String(data.cancelled)}
          helper={`${cancelled}% de las citas programadas`}
          tone="danger"
        />
        <MetricCard
          label="No asistieron"
          value={String(data.noShow)}
          helper={`${noShow}% de las citas programadas`}
          tone="warning"
        />
      </div>
      <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2
              className="text-[#18211e] text-[16px] font-bold"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              Resultado de las citas
            </h2>
            <p
              className="text-[#66716c] text-[11px] mt-1"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Porcentajes calculados sobre {data.scheduled} citas programadas
            </p>
          </div>
          <div
            className="flex gap-4 text-[10px]"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            <span className="text-[#005146] font-medium">● Atendidas</span>
            <span className="text-[#b64135] font-medium">● Canceladas</span>
            <span className="text-[#94611c] font-medium">● No asistieron</span>
          </div>
        </div>
        <div
          className="flex h-8 rounded-[7px] overflow-hidden mt-5"
          aria-label={`Atendidas ${attended}%, canceladas ${cancelled}%, no asistieron ${noShow}%`}
        >
          <div
            className="bg-[#005146] flex items-center justify-center text-white text-[10px] font-semibold"
            style={{ width: `${attended}%` }}
          >
            {attended}%
          </div>
          <div
            className="bg-[#b64135] flex items-center justify-center text-white text-[10px] font-semibold"
            style={{ width: `${cancelled}%` }}
          >
            {cancelled}%
          </div>
          <div
            className="bg-[#c98a32] flex items-center justify-center text-white text-[10px] font-semibold"
            style={{ width: `${noShow}%` }}
          >
            {noShow}%
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {[
            ["Atendidas", data.attended, attended, "text-[#005146]"],
            ["Canceladas", data.cancelled, cancelled, "text-[#b64135]"],
            ["No asistieron", data.noShow, noShow, "text-[#94611c]"],
          ].map(([label, count, percent, color]) => (
            <div key={String(label)} className="bg-[#f8f8f4] rounded-[8px] p-4">
              <p
                className={`text-[12px] font-semibold ${color}`}
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                {label}
              </p>
              <p
                className="text-[#18211e] text-[19px] font-bold mt-1"
                style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
              >
                {String(count)}{" "}
                <span className="text-[#66716c] text-[11px] font-normal">
                  · {String(percent)}%
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default function ReporteOcupacionCancelaciones() {
  const [period, setPeriod] = useState<Period>("semana")
  return (
    <ReportShell activeTab="ocupacion">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Métricas de Agenda
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Ocupación y cancelaciones
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Comprende el rendimiento de tu agenda, citas atendidas y tasa de cancelaciones.
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      <AppointmentReportContent period={period} />
    </ReportShell>
  )
}

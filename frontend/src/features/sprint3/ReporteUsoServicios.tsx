import { useState } from "react"
import { NavBar } from "@/components/layout"
import ProviderAside from "@/components/layout/ProviderAside"
import { useAuth } from "@/context/AuthContext"

export type Period = "día" | "semana" | "mes"

export interface ServiceUsage {
  name: string
  count: number
  percentage: number
}

export const SERVICE_DATA: Record<Period, ServiceUsage[]> = {
  día: [
    { name: "Masaje relajante", count: 4, percentage: 40 },
    { name: "Fisioterapia", count: 3, percentage: 30 },
    { name: "Consulta nutricional", count: 2, percentage: 20 },
    { name: "Valoración integral", count: 1, percentage: 10 },
  ],
  semana: [
    { name: "Masaje relajante", count: 18, percentage: 36 },
    { name: "Fisioterapia", count: 14, percentage: 28 },
    { name: "Consulta nutricional", count: 11, percentage: 22 },
    { name: "Valoración integral", count: 7, percentage: 14 },
  ],
  mes: [
    { name: "Masaje relajante", count: 72, percentage: 38 },
    { name: "Fisioterapia", count: 51, percentage: 27 },
    { name: "Consulta nutricional", count: 39, percentage: 21 },
    { name: "Valoración integral", count: 27, percentage: 14 },
  ],
}

export function ReportShell({
  activeTab = "servicios",
  children,
}: {
  activeTab?: "servicios" | "ocupacion" | "exportar"
  children: React.ReactNode
}) {
  const { navigate } = useAuth()
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Reportes" />
        <section className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Navegación por pestañas entre reportes */}
          <div className="flex border-b border-[#d4d9d3] gap-2 pb-px overflow-x-auto">
            <button
              type="button"
              onClick={() => navigate("reporte-servicios")}
              className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 ${
                activeTab === "servicios"
                  ? "border-[#005146] text-[#005146]"
                  : "border-transparent text-[#66716c] hover:text-[#18211e]"
              }`}
            >
              Uso de Servicios
            </button>
            <button
              type="button"
              onClick={() => navigate("reporte-ocupacion")}
              className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 ${
                activeTab === "ocupacion"
                  ? "border-[#005146] text-[#005146]"
                  : "border-transparent text-[#66716c] hover:text-[#18211e]"
              }`}
            >
              Ocupación y Cancelaciones
            </button>
            <button
              type="button"
              onClick={() => navigate("reporte-exportar")}
              className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 ${
                activeTab === "exportar"
                  ? "border-[#005146] text-[#005146]"
                  : "border-transparent text-[#66716c] hover:text-[#18211e]"
              }`}
            >
              Exportar en CSV
            </button>
          </div>
          {children}
        </section>
      </main>
    </div>
  )
}

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period
  onChange: (period: Period) => void
}) {
  return (
    <div
      className="inline-flex bg-[#e5e7e3] rounded-[8px] p-1 self-start sm:self-auto"
      role="group"
      aria-label="Seleccionar periodo del reporte"
    >
      {(["día", "semana", "mes"] as Period[]).map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          aria-pressed={value === period}
          className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold capitalize transition-colors cursor-pointer bg-transparent border-none ${
            value === period
              ? "bg-[#fcfcf8] text-[#005146] shadow-sm"
              : "text-[#66716c] hover:text-[#18211e]"
          }`}
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          {period}
        </button>
      ))}
    </div>
  )
}

export function ServiceUsageReport({ period }: { period: Period }) {
  const data = SERVICE_DATA[period]
  const total = data.reduce((sum, service) => sum + service.count, 0)
  return (
    <div className="grid xl:grid-cols-[1fr_360px] gap-5">
      <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#d4d9d3] flex items-center justify-between">
          <div>
            <h2
              className="text-[#18211e] text-[16px] font-bold"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              Demanda por servicio
            </h2>
            <p
              className="text-[#66716c] text-[12px] mt-0.5"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Total de servicios solicitados en el periodo: {total}
            </p>
          </div>
          <span
            className="text-[#005146] bg-[#e6f0ef] text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Mayor a menor demanda
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8f9f5] border-b border-[#d4d9d3] text-[11px] text-[#66716c] uppercase tracking-[0.66px]">
                <th
                  className="py-3 px-5"
                  style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                >
                  Servicio
                </th>
                <th
                  className="py-3 px-5 text-right"
                  style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                >
                  Veces solicitado
                </th>
                <th
                  className="py-3 px-5 text-right"
                  style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                >
                  % del total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ecefe9] text-[14px]">
              {data.map((service) => (
                <tr key={service.name} className="hover:bg-[#fafbf7]">
                  <td
                    className="py-3.5 px-5 font-semibold text-[#18211e]"
                    style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                  >
                    {service.name}
                  </td>
                  <td
                    className="py-3.5 px-5 text-right text-[#18211e]"
                    style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                  >
                    {service.count}
                  </td>
                  <td
                    className="py-3.5 px-5 text-right font-semibold text-[#005146]"
                    style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                  >
                    {service.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3
            className="text-[#18211e] text-[15px] font-bold"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Distribución de la demanda
          </h3>
          <p
            className="text-[#66716c] text-[12px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Comparativa porcentual del periodo seleccionado.
          </p>
        </div>
        <div className="flex flex-col gap-4 my-4">
          {data.map((service) => (
            <div key={service.name}>
              <div
                className="flex justify-between text-[12px] mb-1.5"
                style={{ fontFamily: '"Inter:Medium", sans-serif' }}
              >
                <span className="text-[#18211e] font-medium truncate pr-2">
                  {service.name}
                </span>
                <span className="text-[#005146] font-bold">
                  {service.percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#f2f3ee] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#005146] rounded-full transition-all duration-300"
                  style={{ width: `${service.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[#66716c] text-[11px] border-t border-[#ecefe9] pt-3">
          Datos calculados con base en las citas confirmadas y atendidas.
        </p>
      </aside>
    </div>
  )
}

export default function ReporteUsoServicios() {
  const [period, setPeriod] = useState<Period>("semana")
  return (
    <ReportShell activeTab="servicios">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Métricas de Negocio
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Uso de servicios
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Identifica cuáles de tus servicios tienen mayor demanda y mejor rendimiento.
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      <ServiceUsageReport period={period} />
    </ReportShell>
  )
}

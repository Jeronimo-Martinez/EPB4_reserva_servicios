import { useState } from "react"
import { SuccessBanner } from "@/components/ui"
import {
  Period,
  PeriodSelector,
  ReportShell,
  SERVICE_DATA,
  ServiceUsageReport,
} from "./ReporteUsoServicios"
import {
  APPOINTMENT_DATA,
  AppointmentReportContent,
} from "./ReporteOcupacionCancelaciones"

type ReportType = "servicios" | "citas"

function downloadCsv(type: ReportType, period: Period) {
  const rows =
    type === "servicios"
      ? [
          ["Servicio", "Solicitudes", "Porcentaje"],
          ...SERVICE_DATA[period].map((item) => [
            item.name,
            item.count,
            `${item.percentage}%`,
          ]),
        ]
      : (() => {
          const item = APPOINTMENT_DATA[period]
          const percentage = (value: number) =>
            `${Math.round((value / item.scheduled) * 100)}%`
          return [
            ["Métrica", "Total", "Porcentaje"],
            ["Citas programadas", item.scheduled, "100%"],
            ["Capacidad total", item.capacity, ""],
            ["Citas atendidas", item.attended, percentage(item.attended)],
            ["Citas canceladas", item.cancelled, percentage(item.cancelled)],
            ["No asistieron", item.noShow, percentage(item.noShow)],
          ]
        })()
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n")
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `promarket-${type}-${period}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ExportacionReportesCSV() {
  const [type, setType] = useState<ReportType>("servicios")
  const [period, setPeriod] = useState<Period>("semana")
  const [exported, setExported] = useState(false)

  function exportFile() {
    downloadCsv(type, period)
    setExported(true)
  }

  return (
    <ReportShell activeTab="exportar">
      {exported && (
        <SuccessBanner
          title="Archivo CSV descargado exitosamente"
          description={`Se generó promarket-${type}-${period}.csv. Puedes abrirlo en Microsoft Excel u otro programa de hojas de cálculo.`}
          onDismiss={() => setExported(false)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Descarga de Métricas
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Exportar reportes en CSV
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Selecciona el tipo de reporte y el periodo temporal que deseas exportar para tu negocio.
          </p>
        </div>
        <PeriodSelector
          value={period}
          onChange={(value) => {
            setPeriod(value)
            setExported(false)
          }}
        />
      </div>

      <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 shadow-xs">
        <p
          className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.7px]"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Seleccionar tipo de reporte
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {([
            {
              id: "servicios",
              title: "Uso de servicios",
              description: "Solicitudes y porcentaje de demanda por cada servicio ofrecido.",
            },
            {
              id: "citas",
              title: "Ocupación y citas",
              description:
                "Capacidad total, asistencia, cancelaciones e inasistencias registradas.",
            },
          ] as { id: ReportType; title: string; description: string }[]).map(
            (report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => {
                  setType(report.id)
                  setExported(false)
                }}
                aria-pressed={type === report.id}
                className={`rounded-[10px] border p-4 text-left cursor-pointer transition-colors ${
                  type === report.id
                    ? "bg-[#e6f0ef] border-[#005146]"
                    : "bg-white border-[#d4d9d3] hover:border-[#005146]"
                }`}
              >
                <span
                  className={`block text-[14px] font-semibold ${
                    type === report.id ? "text-[#005146]" : "text-[#18211e]"
                  }`}
                  style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                >
                  {report.title}
                </span>
                <span
                  className="block text-[#66716c] text-[12px] leading-[18px] mt-1"
                  style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                >
                  {report.description}
                </span>
              </button>
            ),
          )}
        </div>
      </section>

      <div className="mt-2">
        <h3
          className="text-[#18211e] text-[16px] font-bold mb-3"
          style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
        >
          Vista previa del reporte: {type === "servicios" ? "Uso de servicios" : "Ocupación y cancelaciones"} ({period})
        </h3>
        {type === "servicios" ? (
          <ServiceUsageReport period={period} />
        ) : (
          <AppointmentReportContent period={period} />
        )}
      </div>

      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <p
            className="text-[#18211e] text-[14px] font-semibold"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Listo para exportar
          </p>
          <p
            className="text-[#66716c] text-[12px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {type === "servicios"
              ? "Reporte de uso de servicios"
              : "Reporte de ocupación y citas"}{" "}
            · Periodo seleccionado: {period}
          </p>
        </div>
        <button
          type="button"
          onClick={exportFile}
          className="bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] px-6 py-3 text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v12M7 10l5 5 5-5M4 20h16"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Exportar archivo CSV
        </button>
      </div>
    </ReportShell>
  )
}

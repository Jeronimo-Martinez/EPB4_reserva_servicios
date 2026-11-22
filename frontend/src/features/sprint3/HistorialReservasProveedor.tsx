import { useMemo, useState } from "react"
import { NavBar } from "@/components/layout"
import ProviderAside from "@/components/layout/ProviderAside"
import { useAuth } from "@/context/AuthContext"

type Status = "Atendida" | "No asistió" | "Cancelada"
type Filter = "Todas" | Status

interface Booking {
  id: string
  date: string
  time: string
  customer: string
  service: string
  status: Status
}

const BOOKINGS: Booking[] = [
  {
    id: "R-1984",
    date: "18 jul 2025",
    time: "10:00",
    customer: "Laura Gómez",
    service: "Masaje relajante",
    status: "Atendida",
  },
  {
    id: "R-1976",
    date: "16 jul 2025",
    time: "14:00",
    customer: "Camilo Ruiz",
    service: "Fisioterapia",
    status: "No asistió",
  },
  {
    id: "R-1969",
    date: "15 jul 2025",
    time: "09:00",
    customer: "Ana Torres",
    service: "Consulta nutricional",
    status: "Cancelada",
  },
  {
    id: "R-1953",
    date: "11 jul 2025",
    time: "11:30",
    customer: "Sofía Martínez",
    service: "Masaje terapéutico",
    status: "Atendida",
  },
  {
    id: "R-1941",
    date: "8 jul 2025",
    time: "16:00",
    customer: "Diego López",
    service: "Valoración integral",
    status: "Cancelada",
  },
]


function StatusBadge({ status }: { status: Status }) {
  const style =
    status === "Atendida"
      ? "bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]"
      : status === "No asistió"
        ? "bg-[#fff6e8] text-[#94611c] border-[#ead2a8]"
        : "bg-[#fff0ee] text-[#b64135] border-[#edc1bb]"
  return (
    <span
      className={`inline-flex items-center border rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}
      style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {status}
    </span>
  )
}

export default function HistorialReservasProveedor() {
  const { navigate } = useAuth()
  const [filter, setFilter] = useState<Filter>("Todas")
  const [showEmpty, setShowEmpty] = useState(false)
  const visible = useMemo(
    () =>
      showEmpty
        ? []
        : filter === "Todas"
          ? BOOKINGS
          : BOOKINGS.filter((booking) => booking.status === filter),
    [filter, showEmpty],
  )

  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Reservas Recibidas" />
        <section className="flex-1 min-w-0">
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Historial de Reservas
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
            <div>
              <h1
                className="text-[#18211e] text-[27px] font-bold"
                style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
              >
                Historial de reservas
              </h1>
              <p
                className="text-[#66716c] text-[14px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Consulta el registro de actividad y gestiona las citas recibidas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('asistencia-reserva')}
              className="bg-[#005146] hover:bg-[#00403b] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Control de asistencia
            </button>
          </div>

          <div
            className="flex flex-wrap items-center gap-2 mt-6"
            role="group"
            aria-label="Filtrar historial por estado"
          >
            {(["Todas", "Atendida", "No asistió", "Cancelada"] as Filter[]).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => {
                    setFilter(item)
                    setShowEmpty(false)
                  }}
                  aria-pressed={filter === item && !showEmpty}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors ${
                    filter === item && !showEmpty
                      ? "bg-[#005146] border-[#005146] text-white"
                      : "bg-[#fcfcf8] border-[#d4d9d3] text-[#66716c] hover:border-[#005146]"
                  }`}
                  style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                >
                  {item}
                </button>
              ),
            )}
            <button
              onClick={() => setShowEmpty(true)}
              className="ml-auto text-[#005146] text-[11px] font-semibold underline"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Ver estado vacío
            </button>
          </div>
          <p
            className="text-[#005146] text-[10px] font-semibold uppercase tracking-[0.7px] mt-3"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Filtro aplicado:{" "}
            {showEmpty ? "Estado vacío" : filter}
          </p>

          {visible.length ? (
            <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead className="bg-[#f8f8f4]">
                    <tr>
                      {["Fecha", "Hora", "Cliente", "Servicio", "Estado"].map(
                        (label) => (
                          <th
                            key={label}
                            className="text-left text-[#66716c] text-[10px] font-semibold uppercase tracking-[0.6px] px-5 py-3 border-b border-[#d4d9d3]"
                            style={{
                              fontFamily: '"Inter:Semi Bold", sans-serif',
                            }}
                          >
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-[#e2e5df] last:border-0 hover:bg-[#fafbf7]"
                      >
                        <td className="px-5 py-4">
                          <p
                            className="text-[#18211e] text-[13px] font-medium"
                            style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                          >
                            {booking.date}
                          </p>
                          <p
                            className="text-[#66716c] text-[10px] mt-0.5"
                            style={{
                              fontFamily: '"Inter:Regular", sans-serif',
                            }}
                          >
                            {booking.id}
                          </p>
                        </td>
                        <td
                          className="px-5 py-4 text-[#18211e] text-[13px]"
                          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                        >
                          {booking.time}
                        </td>
                        <td
                          className="px-5 py-4 text-[#18211e] text-[13px] font-medium"
                          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
                        >
                          {booking.customer}
                        </td>
                        <td
                          className="px-5 py-4 text-[#66716c] text-[13px]"
                          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                        >
                          {booking.service}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                className="px-5 py-3 bg-[#f8f8f4] border-t border-[#d4d9d3] text-[#66716c] text-[11px]"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Mostrando {visible.length} de {BOOKINGS.length} reservas
              </div>
            </div>
          ) : (
            <div className="bg-[#fcfcf8] border border-dashed border-[#c8ceca] rounded-[12px] py-14 px-6 text-center mt-4">
              <div className="w-14 h-14 rounded-full bg-[#f2f3ee] text-[#66716c] flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
                className="text-[#005146] text-[10px] font-semibold uppercase tracking-[0.7px] mt-4"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Sin registros
              </p>
              <h2
                className="text-[#18211e] text-[19px] font-bold mt-1"
                style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
              >
                Aún no hay reservas en el historial
              </h2>
              <p
                className="text-[#66716c] text-[13px] mt-2"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Las reservas atendidas, no asistidas o canceladas aparecerán
                aquí.
              </p>
              <button
                onClick={() => {
                  setFilter("Todas")
                  setShowEmpty(false)
                }}
                className="border border-[#005146] text-[#005146] rounded-[8px] px-5 py-2.5 text-[13px] font-semibold mt-5"
              >
                Volver al historial
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

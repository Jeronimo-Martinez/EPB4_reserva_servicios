import { useState } from "react"
import { NavBar, SideNav } from "@/components/layout"
import { SuccessBanner } from "@/components/ui"

type Status = "Pendiente" | "Atendida" | "No asistió" | "Cancelada"
type View = "history" | "detail"

interface Booking {
  id: string
  customer: string
  service: string
  schedule: string
  status: Status
  eligibility: "past" | "future" | "cancelled"
}

const INITIAL: Booking[] = [
  {
    id: "R-2071",
    customer: "Laura Gómez",
    service: "Masaje relajante",
    schedule: "Hoy · 09:00 – 10:00",
    status: "Pendiente",
    eligibility: "past",
  },
  {
    id: "R-2074",
    customer: "Camilo Ruiz",
    service: "Fisioterapia",
    schedule: "Hoy · 17:00 – 18:00",
    status: "Pendiente",
    eligibility: "future",
  },
  {
    id: "R-2062",
    customer: "Ana Torres",
    service: "Consulta nutricional",
    schedule: "Ayer · 14:00 – 15:00",
    status: "Cancelada",
    eligibility: "cancelled",
  },
]


function Badge({ status }: { status: Status }) {
  const style =
    status === "Pendiente"
      ? "bg-[#eef0ed] text-[#59635f] border-[#d4d9d3]"
      : status === "Atendida"
        ? "bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]"
        : status === "No asistió"
          ? "bg-[#fff6e8] text-[#94611c] border-[#ead2a8]"
          : "bg-[#fff0ee] text-[#b64135] border-[#edc1bb]"
  return (
    <span
      className={`border rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}
      style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
    >
      {status}
    </span>
  )
}

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

export default function RegistroAsistenciaReserva() {
  const [bookings, setBookings] = useState(INITIAL)
  const [selectedId, setSelectedId] = useState(INITIAL[0].id)
  const [view, setView] = useState<View>("history")
  const [choice, setChoice] = useState<"Atendida" | "No asistió">("Atendida")
  const [savedId, setSavedId] = useState("")
  const selected =
    bookings.find((booking) => booking.id === selectedId) ?? bookings[0]

  function save() {
    setBookings((items) =>
      items.map((item) =>
        item.id === selected.id ? { ...item, status: choice } : item,
      ),
    )
    setSavedId(selected.id)
    setView("history")
  }

  if (view === "detail") {
    const editable =
      selected.eligibility === "past" && selected.status !== "Cancelada"
    return (
      <Shell>
        <button
          onClick={() => setView("history")}
          className="text-[#66716c] text-[13px] font-medium"
        >
          ← Volver al historial
        </button>
        <p
          className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px] mt-6"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Actualizar asistencia del cliente
        </p>
        <div className="flex items-start justify-between gap-4 mt-1">
          <div>
            <h1
              className="text-[#18211e] text-[26px] font-bold"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              {selected.customer}
            </h1>
            <p
              className="text-[#66716c] text-[13px] mt-1"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              {selected.service} · {selected.schedule}
            </p>
          </div>
          <Badge status={selected.status} />
        </div>
        <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 mt-6">
          {editable ? (
            <>
              <p
                className="text-[#18211e] text-[15px] font-semibold"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                Selecciona el resultado de la cita
              </p>
              <p
                className="text-[#66716c] text-[12px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                La hora programada ya pasó. Puedes actualizar el estado
                pendiente.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {(["Atendida", "No asistió"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setChoice(status)}
                    aria-pressed={choice === status}
                    className={`border rounded-[10px] p-4 text-left ${
                      choice === status
                        ? "border-[#005146] bg-[#e6f0ef]"
                        : "border-[#d4d9d3] bg-white"
                    }`}
                  >
                    <span
                      className={`block text-[14px] font-semibold ${
                        choice === status ? "text-[#005146]" : "text-[#18211e]"
                      }`}
                      style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                    >
                      {status}
                    </span>
                    <span
                      className="block text-[#66716c] text-[11px] mt-1"
                      style={{ fontFamily: '"Inter:Regular", sans-serif' }}
                    >
                      {status === "Atendida"
                        ? "La cliente recibió el servicio."
                        : "La cliente no se presentó a la cita."}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setView("history")}
                  className="border border-[#d4d9d3] rounded-[8px] px-5 py-2.5 text-[14px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  className="bg-[#005146] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
                >
                  Guardar estado
                </button>
              </div>
            </>
          ) : (
            <div role="status">
              <p
                className="text-[#005146] text-[10px] font-semibold uppercase tracking-[0.7px]"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                {selected.eligibility === "future"
                  ? "Horario aún no cumplido"
                  : "Reserva cancelada"}
              </p>
              <h2
                className="text-[#18211e] text-[19px] font-bold mt-1"
                style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
              >
                {selected.eligibility === "future"
                  ? "La asistencia todavía no puede registrarse"
                  : "El estado no puede modificarse"}
              </h2>
              <p
                className="text-[#66716c] text-[13px] leading-[20px] mt-2"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {selected.eligibility === "future"
                  ? "Podrás marcar esta reserva como atendida o no asistida después de las 18:00."
                  : "Las reservas canceladas conservan su estado y no admiten registro de asistencia."}
              </p>
            </div>
          )}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {savedId && (
        <SuccessBanner
          title="Estado actualizado correctamente"
          description="La reserva ya muestra el nuevo estado en el historial."
          onDismiss={() => setSavedId("")}
        />
      )}
      <p
        className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px] mt-5"
        style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
      >
        Control de Citas
      </p>
      <h1
        className="text-[#18211e] text-[27px] font-bold mt-1"
        style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
      >
        Registro de asistencia
      </h1>
      <p
        className="text-[#66716c] text-[14px] mt-1"
        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
      >
        Actualiza el resultado de las citas después de su horario programado.
      </p>
      <div className="flex flex-col gap-3 mt-6">
        {bookings.map((booking) => (
          <button
            key={booking.id}
            onClick={() => {
              setSelectedId(booking.id)
              setChoice(
                booking.status === "No asistió" ? "No asistió" : "Atendida",
              )
              setView("detail")
            }}
            className="bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146] rounded-[12px] p-5 text-left flex items-center justify-between gap-5"
          >
            <div>
              <p
                className="text-[#18211e] text-[15px] font-semibold"
                style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
              >
                {booking.customer}
              </p>
              <p
                className="text-[#66716c] text-[12px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {booking.service} · {booking.schedule}
              </p>
              <p
                className="text-[#66716c] text-[10px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {booking.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge status={booking.status} />
              <span className="text-[#66716c]">›</span>
            </div>
          </button>
        ))}
      </div>

    </Shell>
  )
}

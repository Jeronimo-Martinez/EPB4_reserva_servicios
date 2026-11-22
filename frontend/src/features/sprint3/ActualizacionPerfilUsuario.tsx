import { useState } from "react"
import { NavBar, SideNav } from "@/components/layout"
import { InputField, SuccessBanner } from "@/components/ui"
import { useAuth } from "@/context/AuthContext"

interface Profile {
  nombre: string
  apellido: string
  correo: string
  telefono: string
}

function Detail({
  label,
  value,
  verified,
}: {
  label: string
  value: string
  verified?: boolean
}) {
  return (
    <div>
      <p
        className="text-[#66716c] text-[11px] font-medium uppercase tracking-[0.66px]"
        style={{ fontFamily: '"Inter:Medium", sans-serif' }}
      >
        {label}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <p
          className="text-[#18211e] text-[15px]"
          style={{ fontFamily: '"Inter:Regular", sans-serif' }}
        >
          {value}
        </p>
        {verified && (
          <span
            className="bg-[#e6f0ef] text-[#005146] border border-[#b8d4d1] rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Verificado
          </span>
        )}
      </div>
    </div>
  )
}

function ProfileView({ data, onEdit }: { data: Profile; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Datos de tu Cuenta
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Información personal
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Consulta y actualiza los datos asociados a tu cuenta.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] rounded-[8px] px-5 py-2.5 text-[14px] font-semibold cursor-pointer transition-colors"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Editar perfil
        </button>
      </div>
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full bg-[#005146] text-white flex items-center justify-center text-[22px] font-bold"
          style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
        >
          {data.nombre ? data.nombre[0].toUpperCase() : 'U'}
          {data.apellido ? data.apellido[0].toUpperCase() : ''}
        </div>
        <div>
          <p
            className="text-[#18211e] text-[20px] font-bold"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            {data.nombre} {data.apellido}
          </p>
          <p
            className="text-[#66716c] text-[13px] mt-0.5"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Cliente en ProMarket
          </p>
        </div>
      </div>
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex flex-col gap-5">
        <h2
          className="text-[#18211e] text-[16px] font-bold"
          style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
        >
          Datos de contacto
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Detail label="Nombre" value={data.nombre} />
          <Detail label="Apellido" value={data.apellido} />
          <Detail label="Correo electrónico" value={data.correo} verified />
          <Detail label="Teléfono" value={data.telefono || 'No registrado'} />
        </div>
      </div>
    </div>
  )
}

function ProfileForm({
  data,
  onCancel,
  onSave,
}: {
  data: Profile
  onCancel: () => void
  onSave: (updated: Profile) => void
}) {
  const [form, setForm] = useState(data)
  const [errors, setErrors] = useState<Partial<Record<keyof Profile, string>>>({})

  const set = (key: keyof Profile) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: Partial<Record<keyof Profile, string>> = {}
    if (!form.nombre.trim()) next.nombre = "Ingresa tu nombre."
    if (!form.apellido.trim()) next.apellido = "Ingresa tu apellido."
    if (!form.telefono.trim()) next.telefono = "Ingresa un número de teléfono."
    else if (!/^\+?[0-9\s-]{7,15}$/.test(form.telefono))
      next.telefono = "Ingresa un teléfono válido (ej: +57 310 123 4567)."
    setErrors(next)
    return !Object.keys(next).length
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Editar Información
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Actualiza tu información
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Los campos marcados son necesarios para mantener tu cuenta al día.
          </p>
        </div>
      </div>
      {!!Object.keys(errors).length && (
        <div className="bg-[#fdf1f0] border border-[#f2bfbb] rounded-[8px] px-4 py-3">
          <p
            className="text-[#d94f41] text-[13px] font-semibold"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Revisa la información marcada en el formulario.
          </p>
        </div>
      )}
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField
            label="Nombre"
            value={form.nombre}
            onChange={set("nombre")}
            error={errors.nombre}
          />
          <InputField
            label="Apellido"
            value={form.apellido}
            onChange={set("apellido")}
            error={errors.apellido}
          />
        </div>
        <InputField
          label="Correo electrónico"
          value={form.correo}
          disabled
          hint="El correo electrónico está vinculado a tu inicio de sesión y no se puede modificar directamente."
        />
        <InputField
          label="Teléfono"
          value={form.telefono}
          onChange={set("telefono")}
          error={errors.telefono}
          placeholder="+57 310 123 4567"
          hint="Usaremos este número para enviarte recordatorios importantes de tus citas."
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#d4d9d3] bg-white text-[#18211e] hover:bg-[#f2f3ee] rounded-[8px] px-5 py-2.5 text-[14px] font-medium cursor-pointer transition-colors"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold cursor-pointer transition-colors"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Guardar cambios
        </button>
      </div>
    </form>
  )
}

export default function ActualizacionPerfilUsuario() {
  const { user, navigate } = useAuth()
  const [data, setData] = useState<Profile>({
    nombre: user?.firstName || "María",
    apellido: user?.lastName || "González",
    correo: user?.email || "maria.gonzalez@ejemplo.com",
    telefono: user?.phone || "+57 310 458 6721",
  })
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const sideNavItems = [
    {
      label: "Mi perfil",
      onClick: () => {
        setEditing(false)
        navigate("perfil-cliente")
      },
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
    {
      label: "Mis reservas",
      onClick: () => navigate("reservas"),
      icon: (
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
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1120px] mx-auto px-6 py-10 flex gap-10">
        <aside className="hidden md:block w-[240px] shrink-0">
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 mb-5 shadow-xs">
            <p
              className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
            >
              Mi cuenta
            </p>
            <p
              className="text-[#18211e] text-[16px] font-bold mt-1"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              {data.nombre} {data.apellido}
            </p>
          </div>
          <SideNav items={sideNavItems} active="Mi perfil" />
        </aside>
        <section className="flex-1 min-w-0 flex flex-col gap-4">
          {saved && (
            <div>
              <SuccessBanner
                title="Perfil actualizado correctamente"
                description="Tus datos fueron guardados correctamente. Las próximas comunicaciones usarán esta información."
                onDismiss={() => setSaved(false)}
              />
            </div>
          )}
          {editing ? (
            <ProfileForm
              data={data}
              onCancel={() => setEditing(false)}
              onSave={(updated) => {
                setData(updated)
                setEditing(false)
                setSaved(true)
              }}
            />
          ) : (
            <ProfileView
              data={data}
              onEdit={() => {
                setEditing(true)
                setSaved(false)
              }}
            />
          )}
        </section>
      </main>
    </div>
  )
}

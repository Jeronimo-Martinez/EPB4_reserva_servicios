import { useState } from "react"
import { NavBar } from "@/components/layout"
import ProviderAside from "@/components/layout/ProviderAside"
import { useAuth } from "@/context/AuthContext"
import {
  InputField,
  SelectField,
  SuccessBanner,
  TextareaField,
} from "@/components/ui"

interface Business {
  nombre: string
  categoria: string
  correo: string
  telefono: string
  descripcion: string
}

const INITIAL: Business = {
  nombre: "Centro Vital",
  categoria: "Belleza y Estilismo",
  correo: "citas@centrovital.co",
  telefono: "+57 601 745 2890",
  descripcion:
    "Especialistas en coloración y cortes de tendencia. Nuestro equipo cuenta con más de 10 años de experiencia y trabaja con productos profesionales.",
}


function PublicPreview({
  data,
  onBack,
}: {
  data: Business
  onBack: () => void
}) {
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1040px] mx-auto px-6 py-10">
        <button
          onClick={onBack}
          className="text-[#66716c] hover:text-[#18211e] text-[13px] font-medium flex items-center gap-2"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
        >
          <span aria-hidden="true">←</span> Volver al espacio del proveedor
        </button>
        <p
          className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px] mt-7"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Vista previa para clientes
        </p>
        <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-8 mt-3">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center shrink-0">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9h18l-2-6H5L3 9zM5 9v12h14V9M9 21v-7h6v7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <span
                className="inline-flex bg-[#e5e8e1] text-[#66716c] text-[11px] font-medium rounded-[4px] px-2 py-1"
                style={{ fontFamily: '"Inter:Medium", sans-serif' }}
              >
                {data.categoria}
              </span>
              <h1
                className="text-[#18211e] text-[30px] font-bold mt-2"
                style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
              >
                {data.nombre}
              </h1>
              <p
                className="text-[#66716c] text-[14px] leading-[21px] mt-3 max-w-[700px]"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {data.descripcion}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mt-7 pt-6 border-t border-[#e2e5df]">
            <div>
              <p
                className="text-[#66716c] text-[11px]"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Teléfono
              </p>
              <p
                className="text-[#18211e] text-[13px] font-medium mt-1"
                style={{ fontFamily: '"Inter:Medium", sans-serif' }}
              >
                {data.telefono}
              </p>
            </div>
            <div>
              <p
                className="text-[#66716c] text-[11px]"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                Correo electrónico
              </p>
              <p
                className="text-[#18211e] text-[13px] font-medium mt-1"
                style={{ fontFamily: '"Inter:Medium", sans-serif' }}
              >
                {data.correo}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function BusinessView({
  data,
  onEdit,
  onPreview,
}: {
  data: Business
  onEdit: () => void
  onPreview: () => void
}) {
  const fields = [
    ["Nombre del negocio", data.nombre],
    ["Categoría", data.categoria],
    ["Correo electrónico", data.correo],
    ["Teléfono", data.telefono],
  ]
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p
            className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Perfil del Negocio
          </p>
          <h1
            className="text-[#18211e] text-[26px] font-bold mt-1"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
          >
            Información del negocio
          </h1>
          <p
            className="text-[#66716c] text-[14px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            Estos datos son visibles para los clientes.
          </p>
        </div>
        <button
          onClick={onEdit}
          className="bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Editar información
        </button>
      </div>
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-[#d4d9d3]">
          <div className="w-14 h-14 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center">
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9h18l-2-6H5L3 9zM5 9v12h14V9"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <div>
            <p
              className="text-[#18211e] text-[20px] font-bold"
              style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
            >
              {data.nombre}
            </p>
            <p
              className="text-[#66716c] text-[13px]"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              {data.categoria}
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 mt-5">
          {fields.map(([label, value]) => (
            <div key={label}>
              <p
                className="text-[#66716c] text-[11px] uppercase tracking-[0.66px]"
                style={{ fontFamily: '"Inter:Medium", sans-serif' }}
              >
                {label}
              </p>
              <p
                className="text-[#18211e] text-[14px] mt-1"
                style={{ fontFamily: '"Inter:Regular", sans-serif' }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-[#f2f3ee]">
          <p
            className="text-[#66716c] text-[11px] uppercase tracking-[0.66px]"
            style={{ fontFamily: '"Inter:Medium", sans-serif' }}
          >
            Descripción
          </p>
          <p
            className="text-[#18211e] text-[14px] leading-[21px] mt-2"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}
          >
            {data.descripcion}
          </p>
        </div>
      </div>
      <button
        onClick={onPreview}
        className="self-start border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
        style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
      >
        Ver perfil público
      </button>
    </div>
  )
}

function BusinessForm({
  data,
  onCancel,
  onSave,
}: {
  data: Business
  onCancel: () => void
  onSave: (data: Business) => void
}) {
  const [form, setForm] = useState(data)
  const [errors, setErrors] = useState<Partial<Record<keyof Business, string>>>(
    {},
  )
  const set = (field: keyof Business) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.nombre.trim())
      next.nombre = "El nombre del negocio es obligatorio."
    if (!form.categoria) next.categoria = "Selecciona una categoría."
    if (!form.correo.trim())
      next.correo = "El correo electrónico es obligatorio."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      next.correo = "Ingresa un correo electrónico válido."
    if (!form.telefono.trim()) next.telefono = "El teléfono es obligatorio."
    else if (!/^[+\d\s()-]{7,20}$/.test(form.telefono))
      next.telefono = "Ingresa un teléfono válido."
    if (!form.descripcion.trim())
      next.descripcion = "La descripción del negocio es obligatoria."
    else if (form.descripcion.trim().length < 30)
      next.descripcion = "Describe el negocio con al menos 30 caracteres."
    setErrors(next)
    if (!Object.keys(next).length) onSave(form)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <p
          className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Editar Información Comercial
        </p>
        <h1
          className="text-[#18211e] text-[26px] font-bold mt-1"
          style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
        >
          Actualiza tu perfil público
        </h1>
      </div>
      {!!Object.keys(errors).length && (
        <div className="bg-[#fdf1f0] border border-[#f2bfbb] rounded-[8px] px-4 py-3">
          <p
            className="text-[#d94f41] text-[13px] font-semibold"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Por favor revisa los campos marcados antes de continuar.
          </p>
        </div>
      )}
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex flex-col gap-5">
        <InputField
          label="Nombre del negocio"
          value={form.nombre}
          onChange={set("nombre")}
          error={errors.nombre}
        />
        <SelectField
          label="Categoría"
          value={form.categoria}
          onChange={set("categoria")}
          error={errors.categoria}
          options={[
            "Belleza y Estilismo",
            "Salud y Bienestar",
            "Servicios profesionales",
          ].map((value) => ({ value, label: value }))}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <InputField
            label="Correo electrónico de contacto"
            type="email"
            value={form.correo}
            onChange={set("correo")}
            error={errors.correo}
          />
          <InputField
            label="Teléfono de contacto"
            type="tel"
            value={form.telefono}
            onChange={set("telefono")}
            error={errors.telefono}
          />
        </div>
        <TextareaField
          label="Descripción del negocio"
          value={form.descripcion}
          onChange={set("descripcion")}
          error={errors.descripcion}
          maxLength={300}
          rows={4}
          hint="Explica qué ofrece tu negocio y qué pueden esperar los clientes."
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#d4d9d3] bg-white text-[#18211e] rounded-[8px] px-5 py-2.5 text-[14px] font-medium"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Guardar cambios
        </button>
      </div>
    </form>
  )
}

export default function ActualizacionPerfilNegocio() {
  const { user } = useAuth()
  const [data, setData] = useState<Business>({
    nombre: user?.businessName || INITIAL.nombre,
    categoria: user?.businessCategory || INITIAL.categoria,
    correo: user?.email || INITIAL.correo,
    telefono: user?.phone || INITIAL.telefono,
    descripcion: INITIAL.descripcion,
  })
  const [mode, setMode] = useState<"view" | "edit" | "public">("view")
  const [saved, setSaved] = useState(false)
  if (mode === "public")
    return <PublicPreview data={data} onBack={() => setMode("view")} />
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Perfil de Negocio" />
        <section className="flex-1 min-w-0 flex flex-col gap-4">
          {saved && (
            <div>
              
              <SuccessBanner
                title="Información del negocio actualizada"
                description="Los cambios ya se reflejan en el perfil público que consultan los clientes."
                onDismiss={() => setSaved(false)}
              />
            </div>
          )}
          {mode === "edit" ? (
            <BusinessForm
              data={data}
              onCancel={() => setMode("view")}
              onSave={(updated) => {
                setData(updated)
                setMode("view")
                setSaved(true)
              }}
            />
          ) : (
            <BusinessView
              data={data}
              onEdit={() => {
                setMode("edit")
                setSaved(false)
              }}
              onPreview={() => setMode("public")}
            />
          )}
        </section>
      </main>
    </div>
  )
}

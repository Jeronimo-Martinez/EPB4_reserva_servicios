import { useState } from "react"
import { NavBar } from "@/components/layout"
import { InputField, PasswordStrength } from "@/components/ui"
import { useAuth } from "@/context/AuthContext"

type Screen = "solicitud" | "enviada" | "restablecer" | "exito"

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const validPassword = (value: string) =>
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value)

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f2f3ee] flex flex-col">
      <NavBar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}

function Header({
  category,
  title,
  description,
}: {
  category?: string
  title: string
  description: string
}) {
  return (
    <div className="mb-7">
      {category && (
        <p
          className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-2"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          {category}
        </p>
      )}
      <h1
        className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.56px]"
        style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}
      >
        {title}
      </h1>
      <p
        className="text-[#66716c] text-[14px] leading-[21px] mt-2"
        style={{ fontFamily: '"Inter:Regular", sans-serif' }}
      >
        {description}
      </p>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[470px] bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-8 md:p-10 shadow-sm animate-fade-in">
      {children}
    </div>
  )
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 text-white text-[14px] font-semibold rounded-[8px] py-3 transition-colors cursor-pointer"
      style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
    >
      {children}
    </button>
  )
}

export default function RecuperacionContrasena() {
  const { navigate } = useAuth()
  const [screen, setScreen] = useState<Screen>("solicitud")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [showPasswords, setShowPasswords] = useState(false)

  function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return setEmailError("Ingresa tu correo electrónico.")
    if (!validEmail(email))
      return setEmailError("Ingresa un correo electrónico válido.")
    setEmailError("")
    setScreen("enviada")
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!password) next.password = "Ingresa una nueva contraseña."
    else if (!validPassword(password))
      next.password = "La contraseña aún no cumple todos los requisitos."
    if (!confirm) next.confirm = "Confirma tu nueva contraseña."
    else if (confirm !== password)
      next.confirm = "Las contraseñas no coinciden."
    setErrors(next)
    if (!Object.keys(next).length) setScreen("exito")
  }

  if (screen === "enviada") {
    return (
      <Shell>
        <Card>
          <div className="w-14 h-14 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center mb-6">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M2 8l10 7 10-7"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>
          <Header
            category="Instrucciones enviadas"
            title="Revisa tu correo"
            description="Si el correo está registrado en la plataforma, recibirás un enlace seguro para crear tu nueva contraseña."
          />
          <div className="bg-[#e6f0ef] border border-[#b8d4d1] rounded-[8px] px-4 py-3 mb-6">
            <p
              className="text-[#18211e] text-[13px] leading-[20px]"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              Enviamos las instrucciones a <strong>{email}</strong>. El enlace tiene una vigencia de 30 minutos por seguridad.
            </p>
          </div>
          <PrimaryButton onClick={() => setScreen("restablecer")}>
            Continuar a restablecer contraseña
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setScreen("solicitud")}
            className="w-full text-[#005146] text-[13px] font-semibold mt-4 hover:underline cursor-pointer bg-transparent border-none"
            style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
          >
            Usar otro correo
          </button>
        </Card>
      </Shell>
    )
  }

  if (screen === "restablecer") {
    return (
      <Shell>
        <Card>
          <Header
            category="Nueva Contraseña"
            title="Crea tu nueva contraseña"
            description="Usa una contraseña segura que no hayas compartido ni utilizado antes."
          />
          <form
            onSubmit={submitPassword}
            noValidate
            className="flex flex-col gap-5"
          >
            <div>
              <InputField
                label="Nueva contraseña"
                type={showPasswords ? "text" : "password"}
                value={password}
                onChange={(value) => {
                  setPassword(value)
                  setErrors((current) => ({ ...current, password: undefined }))
                }}
                placeholder="Ingresa tu nueva contraseña"
                error={errors.password}
              />
              <PasswordStrength password={password} />
            </div>
            <InputField
              label="Confirmar nueva contraseña"
              type={showPasswords ? "text" : "password"}
              value={confirm}
              onChange={(value) => {
                setConfirm(value)
                setErrors((current) => ({ ...current, confirm: undefined }))
              }}
              placeholder="Repite tu nueva contraseña"
              error={errors.confirm}
            />
            <label
              className="flex items-center gap-2 text-[#66716c] text-[13px] cursor-pointer"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}
            >
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="accent-[#005146]"
              />
              Mostrar contraseñas
            </label>
            {(errors.password || errors.confirm) && (
              <div className="bg-[#fdf1f0] border border-[#f2bfbb] rounded-[8px] p-3">
                <p
                  className="text-[#d94f41] text-[12px] font-semibold"
                  style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
                >
                  Por favor revisa los campos marcados antes de continuar.
                </p>
              </div>
            )}
            <PrimaryButton type="submit">Actualizar contraseña</PrimaryButton>
          </form>
        </Card>
      </Shell>
    )
  }

  if (screen === "exito") {
    return (
      <Shell>
        <Card>
          <div className="w-16 h-16 rounded-full bg-[#005146] text-white flex items-center justify-center mb-6 shadow-sm">
            <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l5 5L19 7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Header
            category="Confirmación de Seguridad"
            title="Contraseña actualizada"
            description="Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión en ProMarket con tu nueva clave."
          />
          <PrimaryButton onClick={() => navigate("login")}>
            Ir a Iniciar Sesión
          </PrimaryButton>
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <Card>
        <div className="w-14 h-14 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="11"
              width="18"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M7 11V7a5 5 0 0110 0v4"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        </div>
        <Header
          category="Recuperación de Cuenta"
          title="Recupera tu contraseña"
          description="Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones de restablecimiento."
        />
        <form onSubmit={submitEmail} noValidate className="flex flex-col gap-5">
          <InputField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value)
              setEmailError("")
            }}
            placeholder="tu@correo.com"
            error={emailError}
            hint="Nunca te pediremos tu contraseña por correo ni mensaje."
          />
          <PrimaryButton type="submit">Enviar instrucciones</PrimaryButton>
        </form>
        <button
          type="button"
          onClick={() => navigate("login")}
          className="w-full text-[#005146] text-[13px] font-semibold mt-4 hover:underline cursor-pointer bg-transparent border-none"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}
        >
          Volver al inicio de sesión
        </button>
      </Card>
    </Shell>
  )
}

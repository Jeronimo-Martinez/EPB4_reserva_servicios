import React, { useState } from 'react';
import { NavBar } from '@/components/layout';
import { InputField } from '@/components/ui';
import { ApiError } from '@/api/client';
import { requestPasswordRecoveryApi, resetPasswordApi, verifyRecoveryCodeApi } from '@/api/auth';

/** HU-04 Recuperación de contraseña: solicitar → ingresar código → nueva contraseña → confirmación. */
type Step = 'solicitar' | 'codigo' | 'nueva' | 'exito';

interface Notice {
  tone: 'error' | 'info';
  text: string;
  /** Código vencido o bloqueado: ofrecer pedir uno nuevo. */
  offerNewCode?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Misma regla que el backend (PasswordPolicy).
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// The backend answers in plain ASCII; the UI shows the same messages with accents.
const FRIENDLY: Record<string, string> = {
  'El codigo no es valido': 'El código no es válido. Revisa el correo e inténtalo de nuevo.',
  'Las contrasenas no coinciden': 'Las contraseñas no coinciden.',
  'La nueva contrasena debe ser diferente a la actual': 'La nueva contraseña debe ser diferente a la actual.',
  'La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero':
    'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
};
const EXPIRED = 'El código expiró. Solicita uno nuevo para continuar.';
const BLOCKED =
  'Ingresaste demasiados códigos incorrectos. Por seguridad bloqueamos la recuperación temporalmente; intenta de nuevo más tarde.';

function friendly(err: unknown): string {
  if (err instanceof ApiError) return FRIENDLY[err.message] ?? err.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

const card = 'bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[460px] p-8 md:p-10';
const eyebrow = 'text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2';
const title = 'text-[#18211e] text-[26px] font-bold leading-[34px] tracking-[-0.52px] mb-2';
const subtitle = 'text-[#66716c] text-[14px] leading-[20px] mb-6';
const primaryButton =
  'w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer';
const linkButton =
  'text-[#005146] text-[13px] font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-60';

function IconBadge({ children, solid }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${solid ? 'bg-[#005146]' : 'bg-[#e6f0ef]'}`}>
      {children}
    </div>
  );
}

function NoticeBox({ notice, onNewCode, busy }: { notice: Notice; onNewCode: () => void; busy: boolean }) {
  const error = notice.tone === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`flex gap-3 rounded-[8px] px-4 py-3 mb-5 border text-left
        ${error ? 'bg-[#fdf1f0] border-[#f2bfbb]' : 'bg-[#e6f0ef] border-[#b8d4d1]'}`}
    >
      <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke={error ? '#d94f41' : '#005146'} strokeWidth="1.8" />
        <path d="M12 8v4M12 16h.01" stroke={error ? '#d94f41' : '#005146'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div className="flex-1">
        <p className={`text-[13px] leading-[20px] ${error ? 'text-[#d94f41]' : 'text-[#18211e]'}`}>{notice.text}</p>
        {notice.offerNewCode && (
          <button type="button" onClick={onNewCode} disabled={busy} className={`${linkButton} mt-1 underline`}>
            Solicitar un nuevo código
          </button>
        )}
      </div>
    </div>
  );
}

export default function RecuperarContrasena({
  initialEmail = '',
  onBack,
}: {
  initialEmail?: string;
  /** Vuelve al inicio de sesión; recibe el correo para dejarlo escrito. */
  onBack: (email?: string) => void;
}) {
  const [step, setStep] = useState<Step>('solicitar');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const goTo = (next: Step, nextNotice: Notice | null = null) => {
    setStep(next);
    setNotice(nextNotice);
    setFieldError('');
    setConfirmError('');
  };

  /** Turns the backend's answer into the right screen: expired and blocked codes go back to the code step. */
  const handleCodeError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 410) {
      setCode('');
      goTo('codigo', { tone: 'error', text: EXPIRED, offerNewCode: true });
    } else if (err instanceof ApiError && err.status === 429) {
      setCode('');
      goTo('codigo', { tone: 'error', text: BLOCKED, offerNewCode: true });
    } else if (err instanceof ApiError && err.message === 'El codigo no es valido') {
      if (step === 'codigo') {
        setFieldError(friendly(err));
      } else {
        // The code stopped working while choosing the password (e.g. a newer code was requested).
        setCode('');
        goTo('codigo', { tone: 'error', text: friendly(err), offerNewCode: true });
      }
    } else {
      setNotice({ tone: 'error', text: friendly(err) });
    }
  };

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('Ingresa un correo electrónico válido.');
      return;
    }
    setBusy(true);
    try {
      await requestPasswordRecoveryApi(email);
      setCode('');
      goTo('codigo', {
        tone: 'info',
        text: `Si ${email.trim().toLowerCase()} está registrado, recibirás un código de 6 dígitos. Vence en 10 minutos y solo se puede usar una vez. Revisa también tu carpeta de spam.`,
      });
    } catch (err: unknown) {
      setNotice({ tone: 'error', text: friendly(err) });
    } finally {
      setBusy(false);
    }
  }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setFieldError('El código tiene 6 dígitos.');
      return;
    }
    setBusy(true);
    try {
      await verifyRecoveryCodeApi(email, code);
      goTo('nueva');
    } catch (err: unknown) {
      handleCodeError(err);
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setFieldError('');
    setConfirmError('');
    let ok = true;
    if (!STRONG_PASSWORD.test(password)) {
      setFieldError('Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.');
      ok = false;
    }
    if (password !== confirm) {
      setConfirmError('Las contraseñas no coinciden.');
      ok = false;
    }
    if (!ok) return;
    setBusy(true);
    try {
      await resetPasswordApi({ email, code, newPassword: password, confirmPassword: confirm });
      setPassword('');
      setConfirm('');
      goTo('exito');
    } catch (err: unknown) {
      handleCodeError(err);
    } finally {
      setBusy(false);
    }
  }

  let content: React.ReactNode;

  if (step === 'exito') {
    content = (
      <>
        <IconBadge solid>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBadge>
        <p className={eyebrow}>Recuperación exitosa</p>
        <h1 className={title}>Contraseña actualizada</h1>
        <p className={subtitle}>
          Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con la nueva contraseña. Por seguridad cerramos
          las sesiones abiertas y te enviamos un correo avisando del cambio.
        </p>
        <button type="button" onClick={() => onBack(email)} className={primaryButton}>
          Volver al inicio de sesión
        </button>
      </>
    );
  } else if (step === 'nueva') {
    content = (
      <>
        <p className={eyebrow}>Restablecer contraseña</p>
        <h1 className={title}>Crea una nueva contraseña</h1>
        <p className={subtitle}>Usa una contraseña segura que no hayas compartido ni utilizado antes.</p>
        {notice && <NoticeBox notice={notice} onNewCode={() => sendCode()} busy={busy} />}
        <form onSubmit={updatePassword} noValidate className="flex flex-col gap-4">
          <InputField
            label="Nueva contraseña"
            type={showPasswords ? 'text' : 'password'}
            placeholder="Ingresa tu nueva contraseña"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setFieldError('');
            }}
            error={fieldError}
            hint="Mínimo 8 caracteres, con mayúscula, minúscula y número."
          />
          <InputField
            label="Confirmar nueva contraseña"
            type={showPasswords ? 'text' : 'password'}
            placeholder="Repite tu nueva contraseña"
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              setConfirmError('');
            }}
            error={confirmError}
          />
          <label className="flex items-center gap-2 text-[#66716c] text-[13px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="accent-[#005146] w-4 h-4"
            />
            Mostrar contraseñas
          </label>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </>
    );
  } else if (step === 'codigo') {
    content = (
      <>
        <IconBadge>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="#005146" strokeWidth="1.8" />
            <path d="M2 8l10 7 10-7" stroke="#005146" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </IconBadge>
        <p className={eyebrow}>Revisa tu correo</p>
        <h1 className={title}>Ingresa el código</h1>
        <p className={subtitle}>Escribe el código de verificación que enviamos a tu correo para crear una nueva contraseña.</p>
        {notice && <NoticeBox notice={notice} onNewCode={() => sendCode()} busy={busy} />}
        <form onSubmit={checkCode} noValidate className="flex flex-col gap-4">
          <InputField
            label="Código de verificación"
            placeholder="000000"
            value={code}
            onChange={(v) => {
              setCode(v.replace(/\D/g, '').slice(0, 6));
              setFieldError('');
            }}
            error={fieldError}
            hint="Nunca compartas este código con nadie."
          />
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? 'Verificando...' : 'Verificar código'}
          </button>
          <div className="flex justify-between gap-3">
            <button type="button" onClick={() => sendCode()} disabled={busy} className={linkButton}>
              Reenviar código
            </button>
            <button type="button" onClick={() => goTo('solicitar')} disabled={busy} className={linkButton}>
              Usar otro correo
            </button>
          </div>
        </form>
      </>
    );
  } else {
    content = (
      <>
        <IconBadge>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#005146" strokeWidth="1.8" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#005146" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="#005146" />
          </svg>
        </IconBadge>
        <p className={eyebrow}>Solicitar recuperación</p>
        <h1 className={title}>Recupera tu contraseña</h1>
        <p className={subtitle}>Ingresa el correo asociado a tu cuenta y te enviaremos un código para restablecerla.</p>
        {notice && <NoticeBox notice={notice} onNewCode={() => sendCode()} busy={busy} />}
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-4">
          <InputField
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setFieldError('');
            }}
            error={fieldError}
            hint="Nunca te pediremos tu contraseña actual."
          />
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? 'Enviando...' : 'Enviar instrucciones'}
          </button>
          <button type="button" onClick={() => onBack(email)} className={`${linkButton} self-center`}>
            Volver al inicio de sesión
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className={card}>{content}</div>
      </main>
    </div>
  );
}

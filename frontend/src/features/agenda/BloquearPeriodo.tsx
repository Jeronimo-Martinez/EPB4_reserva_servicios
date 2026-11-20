import { useEffect, useRef, useState } from 'react';
import { InputField, TextareaField } from '@/components/ui';
import { ApiError } from '@/api/client';
import { createBlock } from '@/api/schedule';
import { longDate } from '@/utils/dates';

type Step = 'formulario' | 'confirmacion' | 'advertencia';

interface Form {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const primaryButton =
  'bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-4 py-[10px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
const secondaryButton =
  'border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[14px] px-4 py-[10px] rounded-[8px] transition-colors cursor-pointer';

/** Human summary of the period, as the confirmation shows it. */
function describe(f: Form): [string, string][] {
  const sameDay = f.startDate === f.endDate;
  if (!f.startTime) {
    return sameDay
      ? [['Fecha', longDate(f.startDate)], ['Horario', 'Todo el día']]
      : [['Desde', longDate(f.startDate)], ['Hasta', longDate(f.endDate)], ['Horario', 'Días completos']];
  }
  return sameDay
    ? [['Fecha', longDate(f.startDate)], ['Horario', `${f.startTime} – ${f.endTime}`]]
    : [['Desde', `${longDate(f.startDate)}, ${f.startTime}`], ['Hasta', `${longDate(f.endDate)}, ${f.endTime}`]];
}

/** HU-10: form → review → (warning when the period has reservations) → saved. */
export default function BloquearPeriodo({ initialDate, onClose, onCreated }: {
  initialDate: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<Form>({ startDate: initialDate, endDate: initialDate, startTime: '', endTime: '', reason: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [step, setStep] = useState<Step>('formulario');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // onClose only hides the modal, so the first one stays valid.
  }, []);

  useEffect(() => titleRef.current?.focus(), [step]);

  const set = (field: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.startDate) e.startDate = 'Indica la fecha inicial.';
    if (!form.endDate) e.endDate = 'Indica la fecha final.';
    else if (form.endDate < form.startDate) e.endDate = 'La fecha final no puede ser anterior a la inicial.';
    if (!form.startTime !== !form.endTime) {
      e[form.startTime ? 'endTime' : 'startTime'] = 'Indica ambas horas, o deja las dos vacías para bloquear días completos.';
    } else if (form.startTime && form.startDate === form.endDate && form.endTime <= form.startTime) {
      e.endTime = 'La hora final debe ser posterior a la inicial.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(confirmConflicts: boolean) {
    setBusy(true);
    setError('');
    try {
      await createBlock({
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        reason: form.reason.trim() || null,
        confirmConflicts,
      });
      onCreated();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 428) {
        setWarning(err.message);
        setStep('advertencia');
      } else {
        setError(err instanceof ApiError ? err.message : 'No se pudo guardar el bloqueo.');
      }
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Step, [string, string]> = {
    formulario: ['Bloquear periodo', 'Bloquear disponibilidad'],
    confirmacion: ['Confirmar bloqueo', 'Revisa el periodo seleccionado'],
    advertencia: ['Reservas afectadas', 'Este periodo tiene reservas'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#18211e]/40 animate-modal-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bloqueo-titulo"
        className="relative w-full max-w-[480px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-5 shadow-2xl animate-modal-pop"
      >
        <p className={`text-[11px] font-semibold tracking-[0.88px] uppercase ${step === 'advertencia' ? 'text-[#b23b2e]' : 'text-[#005146]'}`}>
          {titles[step][0]}
        </p>
        <h2 id="bloqueo-titulo" ref={titleRef} tabIndex={-1} className="text-[#18211e] text-[20px] font-bold leading-tight mt-0.5 outline-none">
          {titles[step][1]}
        </h2>

        {step === 'formulario' && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField label="Fecha inicial" type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
              <InputField label="Fecha final" type="date" value={form.endDate} onChange={set('endDate')} error={errors.endDate} />
              <InputField label="Hora inicial" type="time" value={form.startTime} onChange={set('startTime')} error={errors.startTime} />
              <InputField label="Hora final" type="time" value={form.endTime} onChange={set('endTime')} error={errors.endTime} />
            </div>
            <p className="text-[#66716c] text-[12px] -mt-2">Deja las horas vacías para bloquear los días completos.</p>
            <TextareaField
              label="Motivo interno (opcional)"
              value={form.reason}
              onChange={set('reason')}
              placeholder="Ej: Asunto personal"
              maxLength={250}
              rows={2}
              hint="Los clientes solo verán el periodo como no disponible."
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className={secondaryButton}>Cancelar</button>
              <button type="button" onClick={() => validate() && setStep('confirmacion')} className={primaryButton}>Continuar</button>
            </div>
          </div>
        )}

        {step === 'confirmacion' && (
          <div className="mt-4 flex flex-col gap-4">
            <dl className="bg-[#f2f3ee] rounded-[10px] px-4 py-3 flex flex-col gap-1.5 text-[13px]">
              {[...describe(form), ...(form.reason.trim() ? [['Motivo', form.reason.trim()] as [string, string]] : [])].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-[#66716c] w-[64px] shrink-0">{label}:</dt>
                  <dd className="text-[#18211e] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[#66716c] text-[13px]">Este periodo dejará de aparecer como disponible para los clientes.</p>
            {error && <p role="alert" className="rounded-[8px] bg-[#fdf1f0] border border-[#f3c4be] px-3 py-2 text-[13px] text-[#b23b2e]">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setStep('formulario')} disabled={busy} className={secondaryButton}>Volver</button>
              <button type="button" onClick={() => save(false)} disabled={busy} className={primaryButton}>
                {busy ? 'Guardando...' : 'Confirmar bloqueo'}
              </button>
            </div>
          </div>
        )}

        {step === 'advertencia' && (
          <div className="mt-4 flex flex-col gap-4">
            <p role="alert" className="rounded-[10px] bg-[#fdf1f0] border border-[#f3c4be] px-4 py-3 text-[13px] text-[#18211e]">{warning}</p>
            <p className="text-[#66716c] text-[13px]">El bloqueo no se guardará hasta que lo confirmes.</p>
            {error && <p role="alert" className="text-[13px] text-[#b23b2e]">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={onClose} disabled={busy} className={secondaryButton}>No continuar</button>
              <button type="button" onClick={() => save(true)} disabled={busy} className={primaryButton}>
                {busy ? 'Guardando...' : 'Bloquear de todos modos'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

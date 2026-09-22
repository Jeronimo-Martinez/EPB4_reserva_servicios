import { useState } from "react";
import { InputField, SelectField, TextareaField } from "@/components/ui";
import { Toggle } from "@/components/ui";
import {
  Servicio,
  FormServicio as FormServicioType,
  CATEGORIAS_SERVICIO,
  CATEGORIAS_SERVICIO_LABELS,
  DURACIONES_SERVICIO,
  fmtDuracion,
} from "../types";

interface FormServicioProps {
  editing: Servicio | null;
  onSave: (form: FormServicioType, id?: string) => void;
  onCancel: () => void;
}

interface Errors { [key: string]: string }

export default function FormServicio({ editing, onSave, onCancel }: FormServicioProps) {
  const [form, setForm] = useState<FormServicioType>({
    nombre: editing?.nombre ?? "",
    categoria: editing?.categoria ?? "",
    duracion: editing ? String(editing.duracion) : "",
    precio: editing ? String(editing.precio) : "",
    descripcion: editing?.descripcion ?? "",
    activo: editing?.activo ?? true,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (f: keyof FormServicioType) => (v: string | boolean) =>
    setForm((p) => ({ ...p, [f]: v }));

  function validate(): boolean {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = "El nombre del servicio es obligatorio.";
    else if (form.nombre.trim().length < 4) e.nombre = "El nombre debe tener al menos 4 caracteres.";
    if (!form.categoria) e.categoria = "Selecciona una categoría.";
    if (!form.duracion) e.duracion = "Selecciona la duración del servicio.";
    if (!form.precio.trim()) e.precio = "El precio es obligatorio.";
    else {
      const p = parseFloat(form.precio.replace(",", "."));
      if (isNaN(p) || p <= 0) e.precio = "Ingresa un precio válido mayor a cero.";
      else if (p > 9999999) e.precio = "El precio ingresado es demasiado alto.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); onSave(form, editing?.id); }, 800);
  }

  const precioNum = parseFloat(form.precio.replace(",", "."));
  const durMin = parseInt(form.duracion);
  const showPreview = form.duracion || (!isNaN(precioNum) && precioNum > 0);

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#18211e] text-[22px] font-bold leading-[30px] tracking-[-0.44px]"
            style={{ fontFamily: '"DM Sans:Bold", sans-serif', fontVariationSettings: '"opsz" 14' }}>
            {editing ? "Editar servicio" : "Agregar nuevo servicio"}
          </h2>
          <p className="text-[#66716c] text-[14px] leading-[20px] mt-1"
            style={{ fontFamily: '"Inter:Regular", sans-serif' }}>
            {editing ? "Actualiza la información del servicio." : "Completa los datos para registrar el servicio en tu catálogo."}
          </p>
        </div>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 text-[#66716c] text-[14px] font-medium hover:text-[#18211e] transition-colors bg-transparent border-none cursor-pointer"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cancelar
        </button>
      </div>

      {/* Información */}
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex flex-col gap-5">
        <p className="text-[#18211e] text-[15px] font-semibold pb-3 border-b border-[#d4d9d3]"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}>Información del servicio</p>
        <InputField label="Nombre del servicio" value={form.nombre}
          onChange={set("nombre") as (v: string) => void}
          placeholder="Ej: Corte de Cabello Clásico" error={errors.nombre}
          hint="Este nombre aparecerá en el catálogo visible para los clientes." />
        <SelectField label="Categoría" value={form.categoria}
          onChange={set("categoria") as (v: string) => void}
          options={CATEGORIAS_SERVICIO.map((c) => ({ value: c, label: CATEGORIAS_SERVICIO_LABELS[c] || c }))}
          placeholder="Selecciona una categoría..." error={errors.categoria} />
        <TextareaField label="Descripción (opcional)" value={form.descripcion}
          onChange={set("descripcion") as (v: string) => void}
          placeholder="Describe brevemente el servicio..."
          hint="Ayuda a los clientes a entender qué incluye el servicio." maxLength={300} />
      </div>

      {/* Duración y precio */}
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex flex-col gap-5">
        <p className="text-[#18211e] text-[15px] font-semibold pb-3 border-b border-[#d4d9d3]"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}>Duración y precio</p>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Duración" value={form.duracion}
            onChange={set("duracion") as (v: string) => void}
            options={DURACIONES_SERVICIO} placeholder="Selecciona la duración..."
            error={errors.duracion} hint="Define los bloques de horario disponibles." />
          <InputField label="Precio" value={form.precio}
            onChange={set("precio") as (v: string) => void}
            placeholder="0.00" prefix="$" error={errors.precio}
            hint="Precio total en pesos colombianos." />
        </div>
        {showPreview && (
          <div className="flex gap-4 bg-[#f2f3ee] border border-[#d4d9d3] rounded-[8px] px-4 py-3">
            <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#66716c" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="#66716c" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p className="text-[#66716c] text-[13px] leading-[20px]"
              style={{ fontFamily: '"Inter:Regular", sans-serif' }}>
              Vista previa:{" "}
              {form.nombre.trim() && <strong className="text-[#18211e]">{form.nombre.trim()}</strong>}
              {form.duracion && ` · ${fmtDuracion(durMin)}`}
              {!isNaN(precioNum) && precioNum > 0 && ` · $${precioNum.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`}
            </p>
          </div>
        )}
      </div>

      {/* Disponibilidad */}
      <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6">
        <Toggle checked={form.activo} onChange={set("activo") as (v: boolean) => void}
          label="Disponible para clientes"
          description={form.activo
            ? "El servicio será visible en tu catálogo y los clientes podrán reservarlo."
            : "El servicio estará oculto. Puedes activarlo en cualquier momento."} />
      </div>

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] font-medium text-[14px] px-6 py-[10px] rounded-[8px] transition-colors bg-white"
          style={{ fontFamily: '"Inter:Medium", sans-serif' }}>Cancelar</button>
        <button type="submit" disabled={saving}
          className="bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] px-6 py-[10px] rounded-[8px] transition-colors flex items-center gap-2"
          style={{ fontFamily: '"Inter:Semi Bold", sans-serif' }}>
          {saving ? (
            <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
            </svg>Guardando...</>
          ) : (
            <><svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M17 21v-8H7v8M7 3v5h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>{editing ? "Guardar cambios" : "Registrar servicio"}</>
          )}
        </button>
      </div>
    </form>
  );
}

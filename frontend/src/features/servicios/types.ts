export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracion: number;
  precio: number;
  descripcion: string;
  activo: boolean;
}

export interface FormServicio {
  nombre: string;
  categoria: string;
  duracion: string;
  precio: string;
  descripcion: string;
  activo: boolean;
}

export function fmtPrecio(amount: number) {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 2 })}`;
}

export function fmtDuracion(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const CATEGORIAS_SERVICIO_LABELS: Record<string, string> = {
  SALUD_Y_BIENESTAR: "Salud y Bienestar",
  BELLEZA: "Belleza",
  HOGAR: "Hogar",
  EDUCACION: "Educacion",
  TECNOLOGIA: "Tecnologia",
  GASTRONOMIA: "Gastronomia",
  OTROS: "Otros",
};

export const DURACIONES_SERVICIO = [
  { value: "30", label: "30 min" }, { value: "45", label: "45 min" },
  { value: "60", label: "1 hora" }, { value: "90", label: "1 h 30 min" },
  { value: "120", label: "2 horas" }, { value: "150", label: "2 h 30 min" },
  { value: "180", label: "3 horas" },
];

export const categoryLabel = (category: string) => CATEGORIAS_SERVICIO_LABELS[category] || category;

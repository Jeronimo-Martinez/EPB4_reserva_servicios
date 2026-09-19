export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracion: number; // minutos
  precio: number;   // centavos
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

export function fmtPrecio(cents: number) {
  return `$ ${(cents / 100).toLocaleString("es-CO", { minimumFractionDigits: 2 })}`;
}

export function fmtDuracion(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const CATEGORIAS_SERVICIO = [
  "Corte y estilizado", "Coloración", "Tratamiento capilar", "Masaje terapéutico",
  "Masaje descontracturante", "Limpieza facial", "Manicura y pedicura",
  "Depilación", "Consulta nutricional", "Entrenamiento personal", "Otro",
];

export const DURACIONES_SERVICIO = [
  { value: "30", label: "30 min" }, { value: "45", label: "45 min" },
  { value: "60", label: "1 hora" }, { value: "90", label: "1 h 30 min" },
  { value: "120", label: "2 horas" }, { value: "150", label: "2 h 30 min" },
  { value: "180", label: "3 horas" },
];

export const DEMO_SERVICIOS: Servicio[] = [
  { id: "1", nombre: "Corte de Cabello Clásico", categoria: "Corte y estilizado", duracion: 45, precio: 3500, descripcion: "Corte personalizado con lavado y secado incluido.", activo: true },
  { id: "2", nombre: "Masaje Descontracturante", categoria: "Masaje descontracturante", duracion: 60, precio: 8000, descripcion: "Masaje profundo para aliviar tensiones musculares.", activo: true },
  { id: "3", nombre: "Limpieza Facial Profunda", categoria: "Limpieza facial", duracion: 90, precio: 11000, descripcion: "Limpieza y exfoliación facial con productos premium.", activo: false },
];

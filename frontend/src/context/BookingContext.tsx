import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppReservation,
  BusinessDayHours,
  ScheduleBlockout,
  AppNotification,
  BusinessInfo,
  ReservationStatus,
} from '@/types/booking';
import { useAuth } from './AuthContext';
import negocioImage from '@/assets/images/03295ad43b390c2dd1d392172801409465bdc5e6.png';

const DEFAULT_HOURS: BusinessDayHours[] = [
  { id: 'lunes', nombre: 'Lunes', corto: 'L', activo: true, inicio: '08:00', cierre: '18:00' },
  { id: 'martes', nombre: 'Martes', corto: 'M', activo: true, inicio: '08:00', cierre: '18:00' },
  { id: 'miercoles', nombre: 'Miércoles', corto: 'M', activo: true, inicio: '08:00', cierre: '18:00' },
  { id: 'jueves', nombre: 'Jueves', corto: 'J', activo: true, inicio: '08:00', cierre: '18:00' },
  { id: 'viernes', nombre: 'Viernes', corto: 'V', activo: true, inicio: '08:00', cierre: '18:00' },
  { id: 'sabado', nombre: 'Sábado', corto: 'S', activo: true, inicio: '09:00', cierre: '14:00' },
  { id: 'domingo', nombre: 'Domingo', corto: 'D', activo: false, inicio: '09:00', cierre: '13:00' },
];

const DEFAULT_BLOCKOUTS: ScheduleBlockout[] = [
  { id: 'blk-1', fecha: '2026-10-20', horaInicio: '14:00', horaFin: '16:00', motivo: 'Mantenimiento de equipos' },
  { id: 'blk-2', fecha: '2026-10-25', motivo: 'Capacitación del personal' },
];

const INITIAL_RESERVATIONS: AppReservation[] = [
  {
    id: 'R-1842',
    serviceId: 'corte',
    serviceName: 'Corte y estilizado',
    businessId: 'centro-vital',
    businessName: 'Centro Vital',
    businessLocation: 'Calle 93 #14-28, Zona Norte, Bogotá',
    businessPhone: '+57 601 745 2890',
    clientName: 'Laura Gómez',
    clientEmail: 'laura.gomez@email.com',
    clientPhone: '+57 310 458 6721',
    date: '2026-10-24',
    timeSlot: '10:00',
    durationMinutes: 45,
    price: 45000,
    status: 'PENDIENTE',
    createdAt: '2026-10-14T09:00:00Z',
    notes: 'Puntualidad solicitada',
  },
  {
    id: 'R-1845',
    serviceId: 'nutricion',
    serviceName: 'Consulta nutricional',
    businessId: 'centro-vital',
    businessName: 'Centro Vital',
    businessLocation: 'Calle 93 #14-28, Zona Norte, Bogotá',
    businessPhone: '+57 601 745 2890',
    clientName: 'Ana Torres',
    clientEmail: 'ana.torres@email.com',
    clientPhone: '+57 315 820 1146',
    date: '2026-10-25',
    timeSlot: '09:00',
    durationMinutes: 60,
    price: 60000,
    status: 'PENDIENTE',
    createdAt: '2026-10-15T11:00:00Z',
  },
  {
    id: 'R-1848',
    serviceId: 'fisioterapia',
    serviceName: 'Fisioterapia integral',
    businessId: 'centro-vital',
    businessName: 'Centro Vital',
    businessLocation: 'Calle 93 #14-28, Zona Norte, Bogotá',
    businessPhone: '+57 601 745 2890',
    clientName: 'Camilo Ruiz',
    clientEmail: 'camilo.ruiz@email.com',
    clientPhone: '+57 300 761 2938',
    date: '2026-10-26',
    timeSlot: '14:00',
    durationMinutes: 60,
    price: 70000,
    status: 'PENDIENTE',
    createdAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'R-1830',
    serviceId: 'masaje',
    serviceName: 'Masaje relajante',
    businessId: 'centro-vital',
    businessName: 'Centro Vital',
    businessLocation: 'Calle 93 #14-28, Zona Norte, Bogotá',
    businessPhone: '+57 601 745 2890',
    clientName: 'Laura Gómez',
    clientEmail: 'laura.gomez@email.com',
    clientPhone: '+57 310 458 6721',
    date: '2026-10-10',
    timeSlot: '11:00',
    durationMinutes: 60,
    price: 80000,
    status: 'ATENDIDA',
    createdAt: '2026-10-05T10:00:00Z',
  },
  {
    id: 'R-1825',
    serviceId: 'coloracion',
    serviceName: 'Coloración completa',
    businessId: 'centro-vital',
    businessName: 'Centro Vital',
    businessLocation: 'Calle 93 #14-28, Zona Norte, Bogotá',
    businessPhone: '+57 601 745 2890',
    clientName: 'Sofía Martínez',
    clientEmail: 'sofia.martinez@email.com',
    clientPhone: '+57 316 442 9085',
    date: '2026-10-08',
    timeSlot: '15:00',
    durationMinutes: 120,
    price: 135000,
    status: 'NO_ASISTIDA',
    createdAt: '2026-10-02T14:30:00Z',
  },
  {
    id: 'R-1820',
    serviceId: 'tratamiento',
    serviceName: 'Tratamiento capilar',
    businessId: 'centro-vital',
    businessName: 'Centro Vital',
    businessLocation: 'Calle 93 #14-28, Zona Norte, Bogotá',
    businessPhone: '+57 601 745 2890',
    clientName: 'Diego López',
    clientEmail: 'diego.lopez@email.com',
    clientPhone: '+57 301 623 7410',
    date: '2026-10-07',
    timeSlot: '16:00',
    durationMinutes: 60,
    price: 75000,
    status: 'CANCELADA',
    cancelledBy: 'PROVEEDOR',
    cancellationReason: 'Avería imprevista en suministro de agua',
    createdAt: '2026-10-01T16:00:00Z',
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Recordatorio de cita próxima',
    message: 'Recuerda que tienes una cita mañana para Corte y estilizado a las 10:00 AM con Centro Vital.',
    type: 'reminder',
    timestamp: 'Hace 2 horas',
    read: false,
    targetRole: 'CLIENTE',
  },
  {
    id: 'notif-2',
    title: 'Nueva reserva recibida',
    message: 'Ana Torres agendó una Consulta nutricional para el 25 de octubre a las 09:00 AM.',
    type: 'new_booking',
    timestamp: 'Hace 5 horas',
    read: false,
    targetRole: 'PROVEEDOR',
  },
  {
    id: 'notif-3',
    title: 'Reserva cancelada por proveedor',
    message: 'Tu cita del 7 de octubre fue cancelada por Centro Vital. Motivo: Avería imprevista en suministro de agua.',
    type: 'cancelled',
    timestamp: 'Ayer',
    read: true,
    targetRole: 'CLIENTE',
  },
];

export const DEMO_BUSINESSES: BusinessInfo[] = [
  {
    id: 'centro-vital',
    name: 'Centro Vital',
    category: 'Belleza y Estilismo',
    description: 'Especialistas en coloración y cortes de tendencia con más de 10 años de experiencia.',
    location: 'Calle 93 #14-28, Zona Norte, Bogotá',
    phone: '+57 601 745 2890',
    email: 'citas@centrovital.co',
    rating: 4.9,
    reviewCount: 124,
    imageUrl: negocioImage,
  },
  {
    id: 'punto-activo',
    name: 'Punto Activo',
    category: 'Salud y Bienestar',
    description: 'Masajes terapéuticos, fisioterapia y tratamientos corporales integrales.',
    location: 'Carrera 15 #82-45, Chapinero, Bogotá',
    phone: '+57 601 621 9832',
    email: 'contacto@puntoactivo.co',
    rating: 4.8,
    reviewCount: 98,
  },
  {
    id: 'studio-lumina',
    name: 'Studio Lumina',
    category: 'Tecnología y TI',
    description: 'Consultoría técnica, soporte especializado y diseño digital para negocios.',
    location: 'Avenida El Dorado #68C-61, Salitre, Bogotá',
    phone: '+57 601 384 1000',
    email: 'info@studiolumina.co',
    rating: 4.7,
    reviewCount: 65,
  },
];

interface BookingContextType {
  hours: BusinessDayHours[];
  updateHours: (newHours: BusinessDayHours[]) => void;
  blockouts: ScheduleBlockout[];
  addBlockout: (block: Omit<ScheduleBlockout, 'id'>) => { ok: boolean; conflictCount: number };
  removeBlockout: (id: string) => void;
  reservations: AppReservation[];
  createReservation: (booking: Omit<AppReservation, 'id' | 'createdAt' | 'status'>) => AppReservation;
  cancelReservationByClient: (id: string) => void;
  rescheduleReservationByClient: (id: string, newDate: string, newTimeSlot: string) => void;
  cancelReservationByProvider: (id: string, reason: string) => void;
  updateReservationStatus: (id: string, status: 'ATENDIDA' | 'NO_ASISTIDA') => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;
  businesses: BusinessInfo[];
  selectedBusiness: BusinessInfo;
  setSelectedBusiness: (biz: BusinessInfo) => void;
  selectedServiceForBooking: any | null;
  setSelectedServiceForBooking: (srv: any) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, showNotification } = useAuth();

  const [hours, setHours] = useState<BusinessDayHours[]>(() => {
    const saved = localStorage.getItem('promarket_hours');
    return saved ? JSON.parse(saved) : DEFAULT_HOURS;
  });

  const [blockouts, setBlockouts] = useState<ScheduleBlockout[]>(() => {
    const saved = localStorage.getItem('promarket_blockouts');
    return saved ? JSON.parse(saved) : DEFAULT_BLOCKOUTS;
  });

  const [reservations, setReservations] = useState<AppReservation[]>(() => {
    const saved = localStorage.getItem('promarket_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('promarket_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo>(DEMO_BUSINESSES[0]);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem('promarket_hours', JSON.stringify(hours));
  }, [hours]);

  useEffect(() => {
    localStorage.setItem('promarket_blockouts', JSON.stringify(blockouts));
  }, [blockouts]);

  useEffect(() => {
    localStorage.setItem('promarket_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('promarket_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const updateHours = (newHours: BusinessDayHours[]) => {
    setHours(newHours);
    showNotification('success', 'Horario de atención semanal actualizado con éxito.');
  };

  const addBlockout = (block: Omit<ScheduleBlockout, 'id'>) => {
    const newBlockout: ScheduleBlockout = {
      ...block,
      id: `blk-${Date.now()}`,
    };

    // Check if affects any existing reservations
    const conflicts = reservations.filter(
      (r) =>
        r.status === 'PENDIENTE' &&
        r.date === block.fecha &&
        (!block.horaInicio || (r.timeSlot >= block.horaInicio && (!block.horaFin || r.timeSlot < block.horaFin)))
    );

    setBlockouts((prev) => [newBlockout, ...prev]);

    return {
      ok: true,
      conflictCount: conflicts.length,
    };
  };

  const removeBlockout = (id: string) => {
    setBlockouts((prev) => prev.filter((b) => b.id !== id));
    showNotification('info', 'Bloqueo de horario eliminado.');
  };

  const createReservation = (data: Omit<AppReservation, 'id' | 'createdAt' | 'status'>) => {
    const newId = `R-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes: AppReservation = {
      ...data,
      id: newId,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };

    setReservations((prev) => [newRes, ...prev]);

    // Send notification to provider
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: '¡Nueva reserva recibida!',
      message: `${data.clientName} agendó cita para ${data.serviceName} el ${data.date} a las ${data.timeSlot}.`,
      type: 'new_booking',
      timestamp: 'Justo ahora',
      read: false,
      targetRole: 'PROVEEDOR',
    };
    setNotifications((prev) => [notif, ...prev]);

    return newRes;
  };

  const cancelReservationByClient = (id: string) => {
    const target = reservations.find((r) => r.id === id);
    if (!target) return;

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'CANCELADA', cancelledBy: 'CLIENTE', cancellationReason: 'Cancelada por el cliente' }
          : r
      )
    );

    // Notify provider
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Cita cancelada por cliente',
      message: `${target.clientName} ha cancelado su cita de ${target.serviceName} del ${target.date} a las ${target.timeSlot}. El horario ha sido liberado.`,
      type: 'cancelled',
      timestamp: 'Justo ahora',
      read: false,
      targetRole: 'PROVEEDOR',
    };
    setNotifications((prev) => [notif, ...prev]);
    showNotification('info', 'Tu reserva ha sido cancelada y el horario fue liberado.');
  };

  const rescheduleReservationByClient = (id: string, newDate: string, newTimeSlot: string) => {
    const target = reservations.find((r) => r.id === id);
    if (!target) return;

    const oldDate = target.date;
    const oldTime = target.timeSlot;

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              date: newDate,
              timeSlot: newTimeSlot,
              status: 'PENDIENTE',
              rescheduledFrom: { date: oldDate, timeSlot: oldTime },
            }
          : r
      )
    );

    // Notify client and provider
    const notifClient: AppNotification = {
      id: `notif-${Date.now()}-c`,
      title: 'Cita reprogramada con éxito',
      message: `Tu cita de ${target.serviceName} cambió de ${oldDate} ${oldTime} a ${newDate} ${newTimeSlot}.`,
      type: 'rescheduled',
      timestamp: 'Justo ahora',
      read: false,
      targetRole: 'CLIENTE',
    };
    const notifProv: AppNotification = {
      id: `notif-${Date.now()}-p`,
      title: 'Reserva reprogramada por el cliente',
      message: `${target.clientName} cambió su cita de ${target.serviceName} del ${oldDate} ${oldTime} al nuevo horario ${newDate} ${newTimeSlot}.`,
      type: 'rescheduled',
      timestamp: 'Justo ahora',
      read: false,
      targetRole: 'PROVEEDOR',
    };

    setNotifications((prev) => [notifClient, notifProv, ...prev]);
    showNotification('success', `Cita reprogramada para el ${newDate} a las ${newTimeSlot}.`);
  };

  const cancelReservationByProvider = (id: string, reason: string) => {
    const target = reservations.find((r) => r.id === id);
    if (!target) return;

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'CANCELADA',
              cancelledBy: 'PROVEEDOR',
              cancellationReason: reason.trim() || 'Cancelada por el proveedor sin motivo especificado',
            }
          : r
      )
    );

    // Immediate notification to client
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Cita cancelada por el proveedor',
      message: `El negocio ${target.businessName} ha cancelado tu cita de ${target.serviceName} del ${target.date} a las ${target.timeSlot}. Motivo: ${reason || 'Inconveniente de agenda'}.`,
      type: 'cancelled',
      timestamp: 'Justo ahora',
      read: false,
      targetRole: 'CLIENTE',
    };
    setNotifications((prev) => [notif, ...prev]);
    showNotification('info', 'La reserva fue cancelada y se notificó al cliente.');
  };

  const updateReservationStatus = (id: string, status: 'ATENDIDA' | 'NO_ASISTIDA') => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    showNotification(
      'success',
      `El estado de la reserva fue actualizado a ${status === 'ATENDIDA' ? 'Atendida' : 'No asistida'}.`
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const role = user?.role || 'CLIENTE';
  const filteredNotifications = notifications.filter(
    (n) => !n.targetRole || n.targetRole === role
  );
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return (
    <BookingContext.Provider
      value={{
        hours,
        updateHours,
        blockouts,
        addBlockout,
        removeBlockout,
        reservations,
        createReservation,
        cancelReservationByClient,
        rescheduleReservationByClient,
        cancelReservationByProvider,
        updateReservationStatus,
        notifications: filteredNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCount,
        businesses: DEMO_BUSINESSES,
        selectedBusiness,
        setSelectedBusiness,
        selectedServiceForBooking,
        setSelectedServiceForBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking debe usarse dentro de un BookingProvider');
  }
  return context;
};

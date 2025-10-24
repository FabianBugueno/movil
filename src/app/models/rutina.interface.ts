export interface Rutina {
  id: number;
  nombre: string;
  descripcion: string;
  ejercicios: any[];  // TODO: Tiparlo cuando se defina la interfaz de ejercicios
  fechaCreacion: Date;
  usuarioId: string; // ID del usuario al que pertenece la rutina
  // Información opcional del evento de calendario asociado (si se creó)
  calendarEvent?: {
    title: string;
    location?: string | null;
    notes?: string | null;
    startDate: string; // ISO
    endDate: string; // ISO
  } | null;
}

export interface RutinaDto extends Omit<Rutina, 'id'> {
  id?: number;
  usuarioId: string;
}
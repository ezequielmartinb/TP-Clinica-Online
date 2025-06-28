export interface Usuario
{
    id: string;
    nombre: string;
    apellido: string;
    edad: number;
    dni: string;
    mail: string;
    contrasena: string;
    imagen_perfil?: string;
    aprobado: boolean;
}

export interface Paciente extends Usuario 
{
    obra_social?: string;
    imagen_perfil_1?: string;
    imagen_perfil_2?: string;
}

export interface Especialista extends Usuario 
{
    
}

export interface Administrador extends Usuario 
{

}
export interface Especialidades
{
    id: number,
    nombre: string
    imagen_perfil?: string
}
export interface HorarioEspecialista {
    id: string; // UUID
    especialista_id: string; // UUID del especialista (relación con especialistas)
    dia_semana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo'; // Restricción según la base de datos
    hora_inicio: string; // Formato "HH:mm:ss"
    hora_fin: string; // Formato "HH:mm:ss"
  }
  export interface EspecialidadDeEspecialista {
    id: string; // UUID generado automáticamente
    id_especialista: string; // UUID de la tabla especialistas
    id_especialidad: number; // ID entero de la tabla especialidades
  }
  export interface Turno {
    id: string;
    id_paciente: string;
    id_especialista: string;
    especialidad_id: number;
    fecha: string; // o Date si lo parseás luego
    hora: string;  // formato 'HH:mm:ss'
    estado: 'pendiente' | 'aceptado' | 'cancelado' | 'rechazado' | 'finalizado';
    resena?: string;
  }
  export interface Encuesta {
    atencion: 'excelente' | 'buena' | 'regular' | 'mala' | '';
    instalaciones: 'excelente' | 'buena' | 'regular' | 'mala' | '';
    fecha_respuesta?: string; // ISO string opcional, si querés manejarla desde el frontend
  } 
  export interface DatoExtra {
    clave: string
    valor: string | number
  }
  
  export interface HistoriaClinica {
    id?: number // autogenerado por la DB
    id_turno: string // UUID del turno asociado
    fecha?: string // formato ISO, default generado por la DB
    altura: number // en metros (entre 1.0 y 2.5)
    peso: number // en kilogramos (30 a 250)
    temperatura: number // °C (34 a 43)
    presion: string // formato '120/80'
    datos_extra?: DatoExtra[] // hasta 3 campos JSONB definidos por el especialista
  }
  
export interface TurnoEnriquecido {
  fecha: string;
  hora: string;
  resena?: string;
  especialista: string;
  especialidad: string;
}

  
  
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
  
  

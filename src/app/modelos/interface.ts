export interface Usuario
{
    id: string;
    nombre: string;
    apellido: string;
    edad: number;
    dni: string;
    mail: string;
    contraseña: string;
    imagen_perfil?: string;
}

export interface Paciente extends Usuario 
{
    obra_social?: string;
    imagen_perfil_1?: string;
    imagen_perfil_2?: string;
}

export interface Especialista extends Usuario 
{
    especialidad: string;
}

export interface Administrador extends Usuario 
{

}

# 🏥 TP - Clínica Online

Aplicación web desarrollada con Angular y Firebase para la gestión integral de una clínica médica. Permite a pacientes, especialistas y administradores interactuar con el sistema de forma segura y eficiente.

## 🌐 Demo en producción
![Acceder a la app](https://tp-clinica-online-8e6c9.web.app/home)

## 🔑 Roles y funcionalidades

### 👤 Paciente
- Registro con validación de email.
- Solicitud y cancelación de turnos.
- Visualización de historia clínica.

![Registro de pacientes](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//registro-paciente.png)
![Turnos de pacientes](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//solicitar-turno.png)

### 🧑‍⚕️ Especialista
- Registro con validación y aprobación por parte del administrador.
- Gestión de disponibilidad horaria.
- Carga de historia clínica por paciente.

![Registro de especialistas](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//registro-especialista.png)
![Turnos especialistas](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//turnos-especialista.png)

### 🛠️ Administrador
- Aprobación de especialistas.
- Gestión de usuarios.
- Visualización de estadísticas.

![Gestion de usuarios](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//gestion-usuarios.png)
![Gestion de turnos](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//gestion-turnos.png)

## 🧾 Historia Clínica
- Registro de datos clínicos por consulta: altura, peso, temperatura, presión, y campos dinámicos personalizados.
- Visualización por parte del paciente y el especialista.

![Historia clinica](https://lzvrwsqlfgdedhxagipk.supabase.co/storage/v1/object/public/fotospagina//historia-clinica.png)

## 🛠️ Tecnologías utilizadas
- **Angular 19.2.6**
- **Firebase** (Auth, Firestore, Hosting)
- **Bootstrap** para diseño responsivo

## 📁 Estructura del proyecto
src/ ├── app/ │   ├── components/ │   ├── pages/ │   ├── services/ │   └── models/ ├── assets/ └── environments/

## ▶️ Cómo ejecutar el proyecto localmente

```bash
git clone https://github.com/ezequielmartinb/TP-Clinica-Online.git
cd TP-Clinica-Online
npm install
ng serve
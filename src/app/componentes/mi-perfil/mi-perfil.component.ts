import { Component } from '@angular/core';
import { Administrador, DatoExtra, Especialidades, Especialista, HistoriaClinica, Paciente } from '../../modelos/interface';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DniPipe } from "../../pipes/dni.pipe";
import * as moment from 'moment-timezone';
import { validarFranjaHoraria } from '../validadores/tiempo.validator';
import { OrdenarPipe } from '../../pipes/ordenar.pipe';
import { OrdenarPorDiaPipe } from '../../pipes/ordenar-por-dia.pipe';
import { jsPDF } from 'jspdf';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-mi-perfil',
  imports: [FormsModule, CommonModule, DniPipe, ReactiveFormsModule, OrdenarPorDiaPipe],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent {
  paciente: Paciente | null = null;
  especialista: Especialista | null = null;
  administrador: Administrador | null = null;
  mail: string | null = '';
  rol: string | null = '';
  horarios: { dia: string; horaInicio: string; horaFin: string }[] = [];
  horarioForm!: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  especialistaId!: string;
  mostrarFormulario = false;
  isLoading:boolean = false;
  especialidades_de_especialistas: string[] = [];
  cargandoHorario:boolean = false;
  horarioGuardadoConExito:boolean = false;
  mostrarHistoria = false;
  historiaClinica: HistoriaClinica[] = [];


  constructor(private fb: FormBuilder)
  {
    
  }
  
  
  async ngOnInit() 
  {
    this.isLoading = true;    
    this.rol = localStorage.getItem('rol');
    this.mail = localStorage.getItem('mail');
    this.horarioForm = this.fb.group({
      diaSemana: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required]
    }, { validators: validarFranjaHoraria() });
    

    console.log("mail: " + this.mail);    

    if (this.mail) {
      const rol = localStorage.getItem('rol');
      if(rol == 'administrador')
      {
        const { data, error } = await supabase
          .from('administradores')
          .select('*')
          .eq('mail', this.mail)
          .single();

        if (error) 
        {
          console.error('Error obteniendo perfil:', error.message);
        }
        this.administrador = (data as Administrador);
      }
      else
      {
        const tabla = rol === 'paciente' ? 'pacientes' : 'especialistas';

        const { data, error } = await supabase
          .from(tabla)
          .select('*')
          .eq('mail', this.mail)
          .single();

        if (error) 
        {
          console.error('Error obteniendo perfil:', error.message);
        }
        if(this.rol === 'paciente')
        {
          this.paciente = (data as Paciente);
        }
        else
        {
          this.especialista = (data as Especialista);
          this.especialistaId = String(this.especialista.id);       
          const { data: horarios, error: errorHorarios } = await supabase
          .from('horarios_especialistas')
          .select('*')
          .eq('especialista_id', this.especialistaId);
          if (horarios) {
            this.horarios = horarios.map(h => ({
              dia: h.dia_semana,
              horaInicio: h.hora_inicio.slice(0, 5),
              horaFin: h.hora_fin.slice(0, 5)
            }));
          }        
          const { data: especialidadesDeEspecialistas, error: errorEspecialidadesDeEspecialistas } = await supabase
          .from('especialidades_de_especialistas')
          .select('especialidades (nombre)')
          .eq('id_especialista', this.especialista.id);   
          if(especialidadesDeEspecialistas)
          {
            this.especialidades_de_especialistas = (especialidadesDeEspecialistas || [])
            .map((e: any) => e.especialidades?.nombre)
            .filter((nombre): nombre is string => typeof nombre === 'string');
          }        
        }  
      }          
    }
    await this.cargarHistoriaClinica();
    this.isLoading = false;
    console.log("El paciente es: ", this.paciente);    
    console.log("El especialista es: ", this.especialista);    
    console.log("Horarios del especialista: ", this.horarios);    
    console.log("Especialidades: ", this.especialidades_de_especialistas);    
    console.log("Historia clinica: ", this.historiaClinica);
    
  }
  toggleFormulario() 
  {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (this.mostrarFormulario) {
      this.horarioGuardadoConExito = false;
    }
  
  }

  async guardarHorario() 
  {
    if (this.horarioForm.invalid) 
    {
      console.error("Formulario inválido.");
      return;
    }
    this.cargandoHorario = true;
    
    const horario = 
    {
      especialista_id: this.especialistaId,
      dia_semana: this.horarioForm.value.diaSemana,
      hora_inicio: moment.tz(this.horarioForm.value.horaInicio, "HH:mm", "America/Argentina/Buenos_Aires").format("HH:mm"),
      hora_fin: moment.tz(this.horarioForm.value.horaFin, "HH:mm", "America/Argentina/Buenos_Aires").format("HH:mm")
    };

    // Verificar si ya existe un horario para ese día
    const diaSeleccionado = this.horarioForm.value.diaSemana;
    const yaExiste = this.horarios.some(h => h.dia === diaSeleccionado);

    if (yaExiste) {
      this.horarioForm.setErrors({ ...this.horarioForm.errors, diaRepetido: true });
      this.cargandoHorario = false;
      return;
    }

    const { error } = await supabase
      .from('horarios_especialistas')
      .insert([horario]);

    if (error) 
    {
      console.error("Error al guardar el horario:", error.message);
    } 
    else 
    {
      console.log("Horario guardado correctamente.");
      this.horarioGuardadoConExito = true;
      await this.cargarHorariosDelEspecialista();
      this.horarioForm.reset();
      this.mostrarFormulario = false; // Oculta el formulario después de guardar
    }
    this.cargandoHorario = false;
  }  
  async cargarHorariosDelEspecialista() {
    const { data: horarios, error } = await supabase
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', this.especialistaId);
  
    if (error) {
      console.error('Error al obtener horarios:', error.message);
      return;
    }
  
    if (horarios) {
      this.horarios = horarios.map(h => ({
        dia: h.dia_semana,
        horaInicio: h.hora_inicio,
        horaFin: h.hora_fin
      }));
    }
  }  
  async cargarHistoriaClinica() {
    this.mostrarHistoria = !this.mostrarHistoria;
  
    if (this.mostrarHistoria && this.historiaClinica.length === 0 && this.paciente != null) {
      // 1. Buscar turnos del paciente
      const { data: turnos, error: errorTurnos } = await supabase
        .from('turnos')
        .select('id')
        .eq('id_paciente', this.paciente.id);
  
      if (errorTurnos) {
        console.error('Error al obtener turnos:', errorTurnos.message);
        return;
      }
  
      const idsTurnos = turnos.map(t => t.id);
  
      if (idsTurnos.length === 0) {
        this.historiaClinica = [];
        return;
      }
  
      // 2. Buscar historia clínica para esos turnos
      const { data: historias, error: errorHistorias } = await supabase
        .from('historia_clinica')
        .select('fecha, altura, peso, temperatura, presion, datos_extra')
        .in('id_turno', idsTurnos)
        .order('fecha', { ascending: false });
  
      if (errorHistorias) {
        console.error('Error al obtener historias clínicas:', errorHistorias.message);
        return;
      }
  
      this.historiaClinica = historias as HistoriaClinica[];
    }
  } 
  
  async descargarHistoriaClinicaPDF() {
    try {
      // Obtener los turnos del paciente
      const { data: turnos, error: errorTurnos } = await supabase
        .from('turnos')
        .select('id')
        .eq('id_paciente', this.paciente!.id)
  
      if (errorTurnos) {
        console.error('Error al obtener turnos:', errorTurnos)
        return
      }
  
      const idsTurno = turnos.map(t => t.id)
  
      // Obtener historias clínicas asociadas
      const { data: historias, error: errorHistorias } = await supabase
        .from('historia_clinica')
        .select('*')
        .in('id_turno', idsTurno)
  
      if (errorHistorias || !historias?.length) {
        console.error('Error al obtener historias clínicas:', errorHistorias)
        return
      }
  
      await this.generarPDF(historias as HistoriaClinica[])
    } catch (err) {
      console.error('Error inesperado:', err)
    }
  }
  async generarPDF(historias: HistoriaClinica[]) {
    const doc = new jsPDF()
  
    const { data: logoData } = supabase
      .storage
      .from('imagenes')
      .getPublicUrl('logo.png')
    const logoBase64 = await this.convertirABase64(logoData.publicUrl)
  
    for (let i = 0; i < historias.length; i++) {
      const historia = historias[i]
  
      const { data: turnoData, error } = await supabase
        .from('turnos')
        .select(`
          pacientes (
            nombre,
            apellido
          ),
          especialistas (
            nombre,
            apellido
          )
        `)
        .eq('id', historia.id_turno)
        .single()
  
      if (error || !turnoData) {
        console.error(`Error al obtener turno ${historia.id_turno}:`, error)
        continue
      }
  
      const paciente = Array.isArray(turnoData.pacientes)
        ? turnoData.pacientes[0]
        : turnoData.pacientes
      const especialista = Array.isArray(turnoData.especialistas)
        ? turnoData.especialistas[0]
        : turnoData.especialistas
  
      if (i > 0) doc.addPage()
  
      doc.addImage(logoBase64, 'PNG', 160, 10, 30, 15)
      doc.setFontSize(18)
      doc.text('Historia Clínica del Paciente', 20, 25)
  
      doc.setFontSize(12)
      let y = 40
  
      doc.setFont('bold')
      doc.text(`Paciente: ${paciente.nombre} ${paciente.apellido}`, 20, y)
      y += 10
      doc.text(`Especialista: ${especialista.nombre} ${especialista.apellido}`, 20, y)
      y += 10
      doc.setFont('normal')
  
      doc.text(`Fecha: ${new Date(historia.fecha!).toLocaleString()}`, 20, y)
      y += 10
      doc.text(`Altura: ${historia.altura} m`, 20, y)
      y += 10
      doc.text(`Peso: ${historia.peso} kg`, 20, y)
      y += 10
      doc.text(`Temperatura: ${historia.temperatura} °C`, 20, y)
      y += 10
      doc.text(`Presión arterial: ${historia.presion}`, 20, y)
      y += 15
  
      if (historia.datos_extra?.length) {
        doc.setFont('bold')
        doc.text('Datos adicionales:', 20, y)
        doc.setFont('normal')
        y += 8
  
        historia.datos_extra.forEach((d: DatoExtra) => {
          doc.text(`• ${d.clave}: ${d.valor}`, 25, y)
          y += 8
        })
      }
  
      const fechaEmision = new Date().toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      
  
      doc.setDrawColor(150)
      doc.line(20, 280, 190, 280)
      doc.setFontSize(10)
      doc.text(`ID Turno: ${historia.id_turno}`, 20, 285)
      doc.text(`Emitido el: ${fechaEmision}`, 20, 292)
    }
  
    doc.save('historia_clinica.pdf')
  }
  async convertirABase64(url: string): Promise<string> {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  
  
}

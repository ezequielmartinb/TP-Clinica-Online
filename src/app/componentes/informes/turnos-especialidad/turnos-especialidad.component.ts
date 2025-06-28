import { Component, ElementRef, ViewChild } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { ChartData, ChartOptions } from 'chart.js';
import { environment } from '../../../../environments/environment';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import { RouterLink } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-turnos-especialidad',
  imports: [CommonModule, BaseChartDirective, RouterLink],
  templateUrl: './turnos-especialidad.component.html',
  styleUrl: './turnos-especialidad.component.css'
})
export class TurnosEspecialidadComponent 
{
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef;
  informeTexto: string = '';
  
  datosTabla: { nombre: string; cantidad: number }[] = [];
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Cantidad de turnos',
        data: [],
        backgroundColor: '#4e73df'
      }
    ]
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  

  async ngOnInit() {
    try {
      // 1. Obtener especialidades
      const { data: especialidades, error: errorEsp } = await supabase
        .from('especialidades')
        .select('id, nombre');

      if (errorEsp) {
        console.error('Error al obtener especialidades:', errorEsp.message);
        return;
      }

      const mapaEspecialidades = Object.fromEntries(
        especialidades.map(e => [e.id, e.nombre])
      );

      // 2. Obtener turnos
      const { data: turnos, error: errorTurnos } = await supabase
        .from('turnos')
        .select('especialidad_id');

      if (errorTurnos) {
        console.error('Error al obtener turnos:', errorTurnos.message);
        return;
      }

      // 3. Agrupar turnos por especialidad
      const conteoPorEspecialidad: Record<string, number> = {};

      turnos.forEach(turno => {
        const nombre = mapaEspecialidades[turno.especialidad_id] ?? `ID ${turno.especialidad_id}`;
        conteoPorEspecialidad[nombre] = (conteoPorEspecialidad[nombre] || 0) + 1;
      });

      // 4. Ordenar y preparar datos para tabla
      this.datosTabla = Object.entries(conteoPorEspecialidad)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      // 5. Cargar gráfico con colores únicos
      this.barChartData.labels = this.datosTabla.map(d => d.nombre);
      this.barChartData.datasets[0].data = this.datosTabla.map(d => d.cantidad);
      this.barChartData.datasets[0].backgroundColor = this.datosTabla.map((_, i) => this.generarColor(i));
      this.chart?.update();
      console.log(this.barChartData);
      console.log(this.barChartOptions);
      
    } catch (e) {
      console.error('Error inesperado:', e);
    }    
  }
  
  generarColor(index: number): string {
    const colores = [
      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
      '#e74a3b', '#858796', '#20c9a6', '#fd7e14'
    ];
    return colores[index % colores.length];
  }
  generarInformeEspecialidades(): string {
    if (this.datosTabla.length === 0) return 'No hay turnos registrados.';
  
    const total = this.datosTabla.reduce((sum, d) => sum + d.cantidad, 0);
    const primera = this.datosTabla[0];
  
    let informe = `En total se registraron ${total} turnos asignados a distintas especialidades. `;
    informe += `La especialidad más solicitada fue ${primera.nombre} con ${primera.cantidad} turnos.`;
  
    if (this.datosTabla.length > 1) {
      const segunda = this.datosTabla[1];
      const diferencia = primera.cantidad - segunda.cantidad;
      informe += ` Le sigue ${segunda.nombre} con ${segunda.cantidad} turnos (${diferencia} menos).`;
    }
  
    return informe;
  }
  descargarPDF() {
    const canvas: HTMLCanvasElement = this.chartCanvas.nativeElement;
    const imgData = canvas.toDataURL('image/png');
  
    // Generar texto de informe si no está precargado
    if (!this.informeTexto) {
      const total = this.datosTabla.reduce((acc, d) => acc + d.cantidad, 0);
      const top = this.datosTabla[0];
      const segundo = this.datosTabla[1];
  
      let informe = `Total de turnos registrados: ${total}.\n`;
      informe += `Especialidad más solicitada: ${top.nombre} con ${top.cantidad} turnos.\n`;
  
      if (segundo) {
        const diff = top.cantidad - segundo.cantidad;
        informe += `Le sigue ${segundo.nombre} con ${segundo.cantidad} turnos (${diff} menos).\n`;
      }
  
      this.informeTexto = informe;
    }
  
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height + 140]
    });
  
    // Agregar imagen del gráfico
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  
    // Agregar texto del informe
    const startY = canvas.height + 20;
    const lineas = this.informeTexto.split('\n');
  
    pdf.setFontSize(12);
    lineas.forEach((linea, i) => {
      pdf.text(linea.trim(), 40, startY + i * 20);
    });
  
    // Guardar el archivo
    pdf.save('informe-especialidades.pdf');
  }
  
}

import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChartOptions, ChartType, ChartData } from 'chart.js';
import { environment } from '../../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import { Turno, TurnoEnriquecido } from '../../../modelos/interface';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-turnos-por-estado-por-medico-lapso-tiempo',
  imports: [CommonModule, BaseChartDirective, FormsModule, RouterLink],
  templateUrl: './turnos-por-estado-por-medico-lapso-tiempo.component.html',
  styleUrl: './turnos-por-estado-por-medico-lapso-tiempo.component.css'
})
export class TurnosPorEstadoPorMedicoLapsoTiempoComponent {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef;

  estadoSeleccionado: Turno['estado'] = 'pendiente';
  fechaDesde: string = '2025-06-01';
  fechaHasta: string = '2025-06-30';
  especialistas: { id: string; nombre: string }[] = [];
  especialistaSeleccionado: string = 'todos';

  informeTexto: string = '';
  datosTabla: { nombre: string; cantidad: number }[] = [];

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Turnos por especialista',
      data: [],
      backgroundColor: '#36b9cc'
    }]
  };

  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { beginAtZero: true }
    }
  };
  constructor(public router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const rutaActual = this.router.url;
  
    if (rutaActual.includes('turnos-solicitados-por-medico-en-lapso')) {
      this.estadoSeleccionado = 'aceptado';
    }
  
    if (rutaActual.includes('turnos-finalizado-por-medico-en-lapso')) {
      this.estadoSeleccionado = 'finalizado';
    }
  
    this.cargarEspecialistas();
    this.cargarTurnos();
  }

  async cargarEspecialistas() {
    const { data, error } = await supabase
      .from('especialistas')
      .select('id, nombre, apellido');

    if (error) {
      console.error('Error al obtener especialistas:', error.message);
      return;
    }

    this.especialistas = (data ?? []).map(e => ({
      id: e.id,
      nombre: `${e.nombre} ${e.apellido}`.trim()
    }));
  }

  async cargarTurnos() {
    try {
      let query = supabase
        .from('turnos')
        .select(`
          fecha, hora, estado, resena, id_especialista,
          especialistas ( nombre, apellido ),
          especialidades ( nombre )
        `)
        .eq('estado', this.estadoSeleccionado)
        .gte('fecha', this.fechaDesde)
        .lte('fecha', this.fechaHasta);

      if (this.especialistaSeleccionado !== 'todos') {
        query = query.eq('id_especialista', this.especialistaSeleccionado);
      }

      const { data: turnos, error } = await query.order('fecha');

      if (error) {
        console.error('Error al obtener turnos:', error.message);
        return;
      }

      const turnosProcesados: TurnoEnriquecido[] = (turnos ?? []).map((t: any) => ({
        fecha: t.fecha,
        hora: t.hora,
        estado: t.estado,
        resena: t.resena,
        especialista: `${t.especialistas?.nombre ?? 'N/D'} ${t.especialistas?.apellido ?? ''}`.trim(),
        especialidad: t.especialidades?.nombre ?? 'N/D'
      }));

      const agrupados: Record<string, number> = {};

      // Agrupar por especialista
      turnosProcesados.forEach(turno => {
        const clave = turno.especialista;
        agrupados[clave] = (agrupados[clave] || 0) + 1;
      });

      this.datosTabla = Object.entries(agrupados)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

      this.barChartData.labels = this.datosTabla.map(d => d.nombre);
      this.barChartData.datasets[0].data = this.datosTabla.map(d => d.cantidad);
      this.barChartData.datasets[0].backgroundColor = this.datosTabla.map((_, i) => this.generarColor(i));
      this.chart?.update();
    } catch (e) {
      console.error('Error inesperado:', e);
    }
  }

  generarColor(index: number): string {
    const colores = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
    return colores[index % colores.length];
  }

  generarInforme(): string {
    if (this.datosTabla.length === 0) return 'No hay turnos registrados.';
    const total = this.datosTabla.reduce((sum, d) => sum + d.cantidad, 0);
    const top = this.datosTabla[0];
    let info = `Del ${this.fechaDesde} al ${this.fechaHasta} se registraron ${total} turnos con estado "${this.estadoSeleccionado}". `;
    info += `El especialista con más turnos fue ${top.nombre} con ${top.cantidad}.`;
    return info;
  }

  descargarPDF() {
    const canvas: HTMLCanvasElement = this.chartCanvas.nativeElement;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height + 100] });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const texto = this.generarInforme();
    pdf.setFontSize(12);
    pdf.text(texto, 40, canvas.height + 40);
    pdf.save('reporte-turnos-especialistas.pdf');
  }

}

import { Component, ElementRef, ViewChild } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { ChartOptions, ChartType, ChartData } from 'chart.js';
import jsPDF from 'jspdf';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { RouterLink } from '@angular/router';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)


@Component({
  selector: 'app-logs',
  imports: [CommonModule, BaseChartDirective, RouterLink],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.css'
})
export class LogsComponent 
{
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  logs: any[] = [];
  loading = false;
  errorMsg: string | null = null;

  barChartData: ChartData<'bar'> = {
    labels: ['Administradores', 'Especialistas', 'Pacientes'],
    datasets: [
      {
        label: 'Cantidad de ingresos',
        data: [0, 0, 0],
        backgroundColor: ['#4e73df', '#1cc88a', '#f6c23e']
      }
    ]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Ingresos por tipo de usuario' }
    }
  };

  async ngOnInit() {
    this.loading = true;
    try {
      const { data, error } = await supabase
        .from('vw_usuarios_logueados')
        .select('*')
        .order('fecha_ingreso', { ascending: false });

      if (error) throw error;

      this.logs = data;
      this.actualizarGrafico();
    } catch (err: any) {
      console.error('Error al obtener logs:', err.message || err);
      this.errorMsg = 'No se pudieron cargar los logs.';
    } finally {
      this.loading = false;
    }
  }

  actualizarGrafico() {
    const conteo: Record<'administrador' | 'especialista' | 'paciente', number> = {
      administrador: 0,
      especialista: 0,
      paciente: 0
    };

    for (const log of this.logs) {
      const tipo = log.tipo_usuario as keyof typeof conteo;
      if (tipo in conteo) {
        conteo[tipo]++;
      }
    }

    this.barChartData.datasets[0].data = [
      conteo.administrador,
      conteo.especialista,
      conteo.paciente
    ];
  }
  
  descargarPDF() {
    const canvas = this.chartCanvas.nativeElement;
    const imgData = canvas.toDataURL('image/png');
  
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height + 180] // más alto para el texto
    });
  
    // Agrega el gráfico
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  
    // Agrega el texto debajo
    const lineas = this.informeTexto.split('\n');
    const startY = canvas.height + 20;
    lineas.forEach((linea, i) => {
      pdf.text(linea.trim(), 40, startY + i * 20);
    });
  
    pdf.save('informe-ingresos.pdf');
  }
  
  get informeTexto(): string {
    const data = this.barChartData.datasets[0]?.data ?? [];
  
    const admins = Number(data[0] ?? 0);
    const especialistas = Number(data[1] ?? 0);
    const pacientes = Number(data[2] ?? 0);
  
    const total = admins + especialistas + pacientes;
  
    if (total === 0) {
      return 'No se registraron ingresos durante el período analizado.';
    }
  
    return `
  Durante el período analizado se registraron un total de ${total} ingresos de usuarios.
  
  Distribución por tipo:
  - Administradores: ${admins} ingreso${admins === 1 ? '' : 's'} (${((admins / total) * 100).toFixed(1)}%)
  - Especialistas: ${especialistas} ingreso${especialistas === 1 ? '' : 's'} (${((especialistas / total) * 100).toFixed(1)}%)
  - Pacientes: ${pacientes} ingreso${pacientes === 1 ? '' : 's'} (${((pacientes / total) * 100).toFixed(1)}%)
  
  Los pacientes representan la mayor actividad del sistema, lo cual es consistente con un uso orientado a turnos, consultas u operaciones de autogestión.
    `.trim();
  }

}

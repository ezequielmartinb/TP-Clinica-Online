import { Component, ElementRef, ViewChild } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { ChartData, ChartOptions } from 'chart.js';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import jsPDF from 'jspdf';

const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-turnos-dia',
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './turnos-dia.component.html',
  styleUrl: './turnos-dia.component.css'
})
export class TurnosDiaComponent {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  datosTabla: { fecha: string; cantidad: number }[] = [];

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Cantidad de turnos por día',
        data: [],
        backgroundColor: []
      }
    ]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  async ngOnInit() {
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('fecha');

    if (error) {
      console.error('Error al obtener turnos:', error.message);
      return;
    }

    const conteoPorFecha: Record<string, number> = {};

    turnos.forEach(turno => {
      const fechaFormateada = this.formatearFecha(turno.fecha);
      conteoPorFecha[fechaFormateada] = (conteoPorFecha[fechaFormateada] || 0) + 1;
    });

    this.datosTabla = Object.entries(conteoPorFecha)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => this.parseFecha(a.fecha) - this.parseFecha(b.fecha));

    this.barChartData = {
      labels: this.datosTabla.map(d => d.fecha),
      datasets: [
        {
          label: 'Cantidad de turnos por día',
          data: this.datosTabla.map(d => d.cantidad),
          backgroundColor: this.datosTabla.map((_, i) => this.generarColor(i))
        }
      ]
    };
  }

  formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  parseFecha(formateada: string): number {
    const [dia, mes, anio] = formateada.split('/');
    return new Date(`${anio}-${mes}-${dia}`).getTime();
  }

  generarColor(index: number): string {
    const colores = [
      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
      '#e74a3b', '#858796', '#20c9a6', '#fd7e14'
    ];
    return colores[index % colores.length];
  }
  generarInformeTurnosPorDia(): string {
    if (this.datosTabla.length === 0) return 'No hay turnos registrados.';
  
    const total = this.datosTabla.reduce((acc, d) => acc + d.cantidad, 0);
    const diaMax = this.datosTabla[0]; // ya vienen ordenados
    const diaMin = this.datosTabla.reduce((min, d) => d.cantidad < min.cantidad ? d : min, this.datosTabla[0]);
  
    let informe = `Durante el periodo analizado, se registraron los siguientes datos:\n\n`;
    informe += `- Total de turnos registrados: ${total}\n`;
    informe += `- Día con más turnos: ${diaMax.fecha} (${diaMax.cantidad} turnos)\n`;
    informe += `- Día con menos turnos: ${diaMin.fecha} (${diaMin.cantidad} turnos)\n\n`;
    informe += `Evolución diaria:\n`;
  
    this.datosTabla.forEach(dato => {
      informe += `• ${dato.fecha}: ${dato.cantidad} turno${dato.cantidad !== 1 ? 's' : ''}\n`;
    });
  
    return informe;
  }
  descargarPDF() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) {
      console.error('Canvas no disponible');
      return;
    }
  
    const imgData = canvas.toDataURL('image/png');
    const informe = this.generarInformeTurnosPorDia();
    const lineas = informe.split('\n');
  
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
  
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
  
    // Escalar imagen del gráfico
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
    // Agregar texto debajo del gráfico o en nueva página si no entra
    const startY = imgHeight + 10;
    const lineHeight = 7;
    const espacioDisponible = pageHeight - startY - 10;
    const lineasPorPagina = Math.floor(espacioDisponible / lineHeight);
  
    pdf.setFontSize(12);
  
    if (lineas.length <= lineasPorPagina) {
      // En la misma página
      lineas.forEach((linea, i) => {
        pdf.text(linea.trim(), 10, startY + i * lineHeight);
      });
    } else {
      // Parte en la primera página
      lineas.slice(0, lineasPorPagina).forEach((linea, i) => {
        pdf.text(linea.trim(), 10, startY + i * lineHeight);
      });
  
      // Resto en páginas nuevas
      let pagina = 1;
      for (let i = lineasPorPagina; i < lineas.length; i += lineasPorPagina) {
        pdf.addPage();
        pdf.setFontSize(12);
        const chunk = lineas.slice(i, i + lineasPorPagina);
        chunk.forEach((linea, j) => {
          pdf.text(linea.trim(), 10, 20 + j * lineHeight);
        });
        pagina++;
      }
    }
  
    pdf.save('informe-turnos-dia.pdf');
  }

}

import { Component, ElementRef, ViewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType, ChartData } from 'chart.js';
import jsPDF from 'jspdf';
import { RouterLink, RouterLinkActive } from '@angular/router';


const supabase = createClient(environment.apiUrl, environment.publicAnonKey)

@Component({
  selector: 'app-informes',
  imports: [CommonModule, RouterLinkActive, RouterLink],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.css'
})
export class InformesComponent 
{
  
}

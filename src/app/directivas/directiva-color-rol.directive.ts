import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDirectivaColorRol]'
})
export class DirectivaColorRolDirective {

  @Input('appDirectivaColorRol') rol!: string;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (this.rol === 'paciente') {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', '#ADD8E6'); 
    } else if (this.rol === 'especialista') {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', '#FFB6C1');
    }
    else
    {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', 'yellow');
    }
  }

}

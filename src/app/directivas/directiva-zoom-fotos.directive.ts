import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDirectivaZoomFotos]'
})
export class DirectivaZoomFotosDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.5)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.3s');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
  }

}

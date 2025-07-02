import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHoverSombra]'
})
export class HoverSombraDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter')

  onMouseEnter() 
  {
    this.renderer.setStyle(this.el.nativeElement, 'boxShadow', '0 12px 24px rgba(0, 0, 0, 0.3)');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.03)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease');
  }

  @HostListener('mouseleave')
  
  onMouseLeave() 
  {
    this.renderer.removeStyle(this.el.nativeElement, 'boxShadow');
    this.renderer.removeStyle(this.el.nativeElement, 'transform');
  }
}

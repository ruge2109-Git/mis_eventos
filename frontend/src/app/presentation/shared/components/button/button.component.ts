import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<'primary' | 'outline' | 'ghost'>('primary');
  size = input<'sm' | 'md' | 'lg' | 'icon'>('md');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  customClass = input<string>('');
  
  clicked = output<MouseEvent>();

  buttonClasses() {
    const base = 'rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
    
    const sizes = {
      'sm': 'px-3 py-1.5 text-xs',
      'md': 'px-6 py-2.5 text-sm',
      'lg': 'px-8 py-3 text-base',
      'icon': 'w-10 h-10'
    };

    const variants = {
      'primary': 'bg-accent-cyan hover:bg-accent-cyan/80 text-primary shadow-[0_0_15px_rgba(0,201,255,0.3)]',
      'outline': 'bg-transparent border border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/10',
      'ghost': 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
    };

    const selectedSize = sizes[this.size()];
    const selectedVariant = variants[this.variant()];

    return `${base} ${selectedSize} ${selectedVariant} ${this.customClass()}`;
  }
}

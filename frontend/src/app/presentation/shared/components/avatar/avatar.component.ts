import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent {
  imageUrl = input<string | null>(null);
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  sizeClasses() {
    const sizes = {
      'sm': 'w-8 h-8',
      'md': 'w-10 h-10',
      'lg': 'w-12 h-12',
      'xl': 'w-20 h-20'
    };
    return sizes[this.size()];
  }

  iconSize() {
    const iconSizes = {
      'sm': '16px',
      'md': '20px',
      'lg': '24px',
      'xl': '40px'
    };
    return iconSizes[this.size()];
  }
}

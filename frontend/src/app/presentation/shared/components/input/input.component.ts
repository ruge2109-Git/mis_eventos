import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent {
  id = input<string>(`input-${Math.random().toString(36).substring(2, 9)}`);
  label = input<string | null>(null);
  type = input<string>('text');
  placeholder = input<string>('');
  icon = input<string | null>(null);
  customClass = input<string>('');
  control = input<FormControl>(new FormControl());
}

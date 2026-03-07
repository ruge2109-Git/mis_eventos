import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  message = input<string>('');
  confirmLabel = input<string>('');
  cancelLabel = input<string>('');
  confirmVariant = input<'danger' | 'primary'>('primary');
  confirm = output<void>();
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayClick(): void {
    this.cancel.emit();
  }
}

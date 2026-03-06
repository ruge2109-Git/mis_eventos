import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private state = signal<ToastState>({
    message: null,
    type: 'info',
    visible: false,
  });

  readonly message = computed(() => this.state().message);
  readonly type = computed(() => this.state().type);
  readonly visible = computed(() => this.state().visible);

  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly autoHideMs = 4000;

  show(message: string, type: ToastType = 'info'): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.state.set({ message, type, visible: true });
    this.hideTimeout = setTimeout(() => {
      this.dismiss();
      this.hideTimeout = null;
    }, this.autoHideMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.state.update((s) => ({ ...s, visible: false }));
  }
}

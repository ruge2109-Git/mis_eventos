import { Injectable, signal, computed, Signal } from '@angular/core';

export interface ContextState {
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingContextService {
  private state = signal<Record<string, ContextState>>({});
  private loadingCache = new Map<string, Signal<boolean>>();
  private errorCache = new Map<string, Signal<string | null>>();

  setLoading(context: string, value: boolean): void {
    this.state.update(s => ({
      ...s,
      [context]: { ...(s[context] ?? { loading: false, error: null }), loading: value }
    }));
  }

  setError(context: string, message: string | null): void {
    this.state.update(s => ({
      ...s,
      [context]: { ...(s[context] ?? { loading: false, error: null }), error: message }
    }));
  }

  loadingFor(context: string): Signal<boolean> {
    if (!this.loadingCache.has(context)) {
      this.loadingCache.set(context, computed(() => this.state()[context]?.loading ?? false));
    }
    return this.loadingCache.get(context)!;
  }

  errorFor(context: string): Signal<string | null> {
    if (!this.errorCache.has(context)) {
      this.errorCache.set(context, computed(() => this.state()[context]?.error ?? null));
    }
    return this.errorCache.get(context)!;
  }
}

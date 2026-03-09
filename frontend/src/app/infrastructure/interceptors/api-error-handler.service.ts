import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { EventStore } from '@core/application/store/event.store';
import { AuthStore } from '@core/application/store/auth.store';
import { LoadingContextService } from '@core/application/services/loading-context.service';
import { getMessageForStatus, ERROR_KEYS } from './error-handler.registry';

const EVENTS_CONTEXT = 'events';
const EVENTS_LOAD_ERROR_KEY = 'events.loadError';

function isEventsRequestUrl(url: string): boolean {
  return url.includes('event');
}

const AUTH_DETAIL_TO_I18N_KEY: Record<string, string> = {
  'Invalid credentials': 'errors.auth.invalidCredentials',
  'Could not validate credentials': 'errors.auth.couldNotValidate',
  'The email': 'errors.auth.emailAlreadyRegistered',
  'Registration as Administrator is not allowed through this endpoint.': 'errors.auth.adminRegistrationNotAllowed',
  'Password must contain at least one uppercase letter': 'errors.auth.passwordUppercase',
  'Password must contain at least one lowercase letter': 'errors.auth.passwordLowercase',
  'Password must contain at least one number': 'errors.auth.passwordNumber',
  'Password must contain at least one special character': 'errors.auth.passwordSpecial',
};

function normalizeApiDetail(detail: unknown): string | null {
  if (detail == null) return null;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    return typeof first === 'object' && first !== null && 'msg' in first
      ? String((first as { msg: string }).msg)
      : String(first);
  }
  return null;
}

function authDetailToI18nKey(apiDetail: string): string | null {
  for (const [en, key] of Object.entries(AUTH_DETAIL_TO_I18N_KEY)) {
    if (apiDetail.startsWith(en) || apiDetail === en) return key;
  }
  if (apiDetail.includes('already registered')) return 'errors.auth.emailAlreadyRegistered';
  return null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiErrorHandlerService {
  private eventStore = inject(EventStore);
  private authStore = inject(AuthStore);
  private loadingContext = inject(LoadingContextService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  private translate(keyOrMessage: string): string {
    if (keyOrMessage.startsWith('errors.')) {
      const t = this.transloco.translate(keyOrMessage);
      return t !== keyOrMessage ? t : keyOrMessage;
    }
    return keyOrMessage;
  }

  handle(error: HttpErrorResponse, isAuthRequest: boolean, requestUrl?: string): string {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      const msg = error.error.message?.trim() || '';
      if (!msg || msg === 'Unknown Error' || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        errorMessage = this.translate(ERROR_KEYS.NETWORK);
      } else {
        errorMessage = msg;
      }
    } else {
      const apiDetail = normalizeApiDetail(error.error?.detail);
      if (isAuthRequest && apiDetail) {
        const i18nKey = authDetailToI18nKey(apiDetail);
        errorMessage = i18nKey ? this.translate(i18nKey) : apiDetail;
      } else {
        if (error.status === 401) {
          const raw = apiDetail ? (authDetailToI18nKey(apiDetail) ?? apiDetail) : getMessageForStatus(401, null, error);
          errorMessage = raw.startsWith('errors.') ? this.translate(raw) : raw;
          if (!isAuthRequest) {
            this.eventStore.setError(null);
            this.authStore.logout();
            this.authStore.setError(errorMessage);
            this.router.navigate(['/auth/login'], { queryParams: { expired: '1' } });
          }
        } else {
          const raw = getMessageForStatus(error.status ?? 0, apiDetail || error.error?.message || null, error);
          errorMessage = raw.startsWith('errors.') ? this.translate(raw) : raw;
        }
      }
    }

    if (!isAuthRequest && error.status !== 401) {
      if (requestUrl && isEventsRequestUrl(requestUrl)) {
        this.loadingContext.setError(EVENTS_CONTEXT, EVENTS_LOAD_ERROR_KEY);
      } else {
        this.eventStore.setError(errorMessage);
      }
    }
    return errorMessage;
  }
}

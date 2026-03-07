import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { EventStore } from '@core/application/store/event.store';
import { AuthStore } from '@core/application/store/auth.store';

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

const AUTH_ERROR_MESSAGES_ES: Record<string, string> = {
  'Invalid credentials': 'Credenciales inválidas.',
  'Could not validate credentials': 'Sesión expirada o token inválido. Inicia sesión de nuevo.',
  'The email': 'Este correo ya está registrado.',
  'Registration as Administrator is not allowed through this endpoint.': 'No se permite el registro como administrador.',
  'Password must contain at least one uppercase letter': 'La contraseña debe incluir al menos una mayúscula.',
  'Password must contain at least one lowercase letter': 'La contraseña debe incluir al menos una minúscula.',
  'Password must contain at least one number': 'La contraseña debe incluir al menos un número.',
  'Password must contain at least one special character': 'La contraseña debe incluir al menos un carácter especial.',
};

function toAuthMessageEnEs(apiDetail: string): string {
  for (const [en, es] of Object.entries(AUTH_ERROR_MESSAGES_ES)) {
    if (apiDetail.startsWith(en) || apiDetail === en) return es;
  }
  if (apiDetail.includes('already registered')) return 'Este correo ya está registrado.';
  return apiDetail;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const eventStore = inject(EventStore);
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const isAuthRequest = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        const msg = error.error.message?.trim() || '';
        if (!msg || msg === 'Unknown Error' || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
          errorMessage = 'No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.';
        } else {
          errorMessage = msg;
        }
      } else {
        const apiDetail = normalizeApiDetail(error.error?.detail);
        if (isAuthRequest && apiDetail) {
          errorMessage = toAuthMessageEnEs(apiDetail);
        } else {
          switch (error.status) {
            case 0:
              errorMessage = 'No se pudo conectar con el servidor. Comprueba tu conexión a internet o que el servicio esté en marcha.';
              break;
            case 400:
            case 422:
              errorMessage = apiDetail || error.error?.message || 'Solicitud incorrecta';
              break;
            case 401: {
              errorMessage = apiDetail ? toAuthMessageEnEs(apiDetail) : 'Sesión expirada. Por favor, inicia sesión de nuevo';
              if (!isAuthRequest) {
                eventStore.setError(null);
                authStore.logout();
                authStore.setError(errorMessage);
                router.navigate(['/auth/login'], { queryParams: { expired: '1' } });
              }
              break;
            }
            case 404:
              errorMessage = 'El recurso solicitado no existe';
              break;
            case 409:
              errorMessage = apiDetail || 'Conflicto: El recurso ya existe o hay un solapamiento';
              break;
            case 500:
              errorMessage = 'Error interno del servidor. Por favor, inténtalo más tarde';
              break;
            default:
              errorMessage = apiDetail || (error.status ? `Error ${error.status}: ${error.statusText}` : 'No se pudo conectar con el servidor. Comprueba tu conexión.');
          }
        }
      }

      if (!isAuthRequest && error.status !== 401) {
        eventStore.setError(errorMessage);
      }
      return throwError(() => ({ ...error, message: errorMessage }));
    })
  );
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { EventStore } from '../../core/application/store/event.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const eventStore = inject(EventStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Solicitud incorrecta';
            break;
          case 401:
            errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo';
            break;
          case 404:
            errorMessage = 'El recurso solicitado no existe';
            break;
          case 409:
            errorMessage = 'Conflicto: El recurso ya existe o hay un solapamiento';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Por favor, inténtalo más tarde';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      }

      eventStore.setError(errorMessage);
      return throwError(() => new Error(errorMessage));
    })
  );
};

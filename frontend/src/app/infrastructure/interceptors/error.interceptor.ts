import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorHandlerService } from './api-error-handler.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ApiErrorHandlerService);
  const isAuthRequest = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const errorMessage = errorHandler.handle(error, isAuthRequest, req.url);
      return throwError(() => ({ ...error, message: errorMessage }));
    })
  );
};

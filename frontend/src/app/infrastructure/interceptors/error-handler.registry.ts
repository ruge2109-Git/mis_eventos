import { HttpErrorResponse } from '@angular/common/http';

export type StatusCodeHandler = (
  apiDetail: string | null,
  error: HttpErrorResponse
) => string;

export const ERROR_KEYS = {
  NETWORK: 'errors.network',
  UNEXPECTED: 'errors.unexpected',
  HTTP_400: 'errors.http.400',
  HTTP_401: 'errors.http.401',
  HTTP_404: 'errors.http.404',
  HTTP_409: 'errors.http.409',
  HTTP_422: 'errors.http.422',
  HTTP_500: 'errors.http.500'
} as const;

export const HTTP_STATUS_HANDLERS: Record<number, StatusCodeHandler> = {
  0: () => ERROR_KEYS.NETWORK,
  400: (detail) => detail || ERROR_KEYS.HTTP_400,
  401: (detail) => detail || ERROR_KEYS.HTTP_401,
  404: () => ERROR_KEYS.HTTP_404,
  409: (detail) => detail || ERROR_KEYS.HTTP_409,
  422: (detail) => detail || ERROR_KEYS.HTTP_422,
  500: () => ERROR_KEYS.HTTP_500
};

export function getMessageForStatus(
  status: number,
  apiDetail: string | null,
  error: HttpErrorResponse
): string {
  const handler = HTTP_STATUS_HANDLERS[status];
  if (handler) {
    return handler(apiDetail, error);
  }
  return apiDetail || (status ? `Error ${status}: ${error.statusText}` : ERROR_KEYS.NETWORK) || ERROR_KEYS.UNEXPECTED;
}

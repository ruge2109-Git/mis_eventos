import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutos

interface CacheEntry {
  url: string;
  response: HttpResponse<unknown>;
  entryTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();

  get(req: HttpRequest<unknown>): HttpResponse<unknown> | null {
    const url = req.urlWithParams;
    const cached = this.cache.get(url);

    if (!cached) {
      return null;
    }

    const isExpired = cached.entryTime <= (Date.now() - CACHE_LIFETIME);
    if (isExpired) {
      this.cache.delete(url);
      return null;
    }

    return cached.response;
  }

  put(req: HttpRequest<unknown>, response: HttpResponse<unknown>): void {
    const url = req.urlWithParams;
    const entry: CacheEntry = { url, response, entryTime: Date.now() };
    this.cache.set(url, entry);
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  // Solo cachear peticiones GET
  if (req.method !== 'GET') {
    return next(req);
  }

  // No cachear peticiones con header 'reset-cache' o x-no-cache
  if (req.headers.has('x-no-cache') || req.headers.has('reset-cache')) {
    return next(req);
  }

  const cachedResponse = cacheService.get(req);
  if (cachedResponse) {
    return of(cachedResponse.clone());
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cacheService.put(req, event.clone());
      }
    })
  );
};

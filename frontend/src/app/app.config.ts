import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { API_BASE_URL } from './core/application/tokens/api-base-url.token';
import { environment } from '@environments/environment';
import { EventRepository } from './core/domain/ports/event.repository';
import { EventReader } from './core/domain/ports/event-reader';
import { EventApiRepository } from './infrastructure/api/event-api.repository';
import { AuthRepository } from './core/domain/ports/auth.repository';
import { AuthStorage } from './core/domain/ports/auth-storage';
import { AuthApiRepository } from './infrastructure/api/auth-api.repository';
import { LocalStorageAuthStorage } from './infrastructure/storage/local-storage-auth.storage';
import { SessionRepository } from './core/domain/ports/session.repository';
import { SessionApiRepository } from './infrastructure/api/session-api.repository';
import { provideTransloco } from '@jsverse/transloco';
import { isDevMode } from '@angular/core';
import { TranslocoHttpLoader } from './transloco-loader';
import { authInterceptor } from './infrastructure/interceptors/auth.interceptor';
import { loadingInterceptor } from './infrastructure/interceptors/loading.interceptor';
import { errorInterceptor } from './infrastructure/interceptors/error.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])
    ),
    { provide: EventReader, useClass: EventApiRepository },
    { provide: EventRepository, useClass: EventApiRepository },
    { provide: AuthRepository, useClass: AuthApiRepository },
    { provide: AuthStorage, useClass: LocalStorageAuthStorage },
    { provide: SessionRepository, useClass: SessionApiRepository },
    provideTransloco({
        config: { 
          availableLangs: ['es', 'en'],
          defaultLang: 'es',
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
        },
        loader: TranslocoHttpLoader
      })
  ]
};

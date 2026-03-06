import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { EventRepository } from './core/domain/ports/event.repository';
import { EventApiRepository } from './infrastructure/api/event-api.repository';
import { AuthRepository } from './core/domain/ports/auth.repository';
import { AuthApiRepository } from './infrastructure/api/auth-api.repository';
import { provideTransloco } from '@jsverse/transloco';
import { isDevMode } from '@angular/core';
import { TranslocoHttpLoader } from './transloco-loader';
import { loadingInterceptor } from './infrastructure/interceptors/loading.interceptor';
import { errorInterceptor } from './infrastructure/interceptors/error.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, errorInterceptor])
    ),
    { provide: EventRepository, useClass: EventApiRepository },
    { provide: AuthRepository, useClass: AuthApiRepository },
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

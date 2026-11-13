import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        // Permite que `:id` de la ruta llegue al componente como input.
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withFetch()),
    ],
};

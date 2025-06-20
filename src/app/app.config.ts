import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), {provide: LOCALE_ID, useValue: 'es'}, { provide: RECAPTCHA_V3_SITE_KEY, useValue: '6LcvzmcrAAAAAF26lQp528Opb_oMpunpoYB7qGMW' }]
};

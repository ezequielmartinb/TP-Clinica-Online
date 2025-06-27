import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideAnimations(),{provide: LOCALE_ID, useValue: 'es'}, 
    { provide: RECAPTCHA_V3_SITE_KEY, useValue: '6LcvzmcrAAAAAF26lQp528Opb_oMpunpoYB7qGMW' }, 
    provideCharts(withDefaultRegisterables())]
};

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hu', 'ro'],
  defaultLocale: 'en'
});

export type AppLocale = (typeof routing.locales)[number];

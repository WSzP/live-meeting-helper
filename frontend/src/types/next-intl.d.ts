import type en from '../../messages/en.json';
import type { routing } from '@/i18n/routing';

type Messages = typeof en;

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}

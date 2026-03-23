/**
 * Типы для системы локализации
 */

export type Locale = 'ru' | 'en';
export type ObjectTranslationType = Record<string, string>;

export interface ITranslation {
  [key: string]: string | ObjectTranslationType;
}

export interface ILocaleConfig {
  locale: Locale;
  fallbackLocale: Locale;
  supportedLocales: Locale[];
}

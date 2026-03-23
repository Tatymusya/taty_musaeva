import type { Locale, ITranslation, ILocaleConfig } from '@core/i18n/types';
import { ru } from '@core/i18n/locales/ru';
import { en } from '@core/i18n/locales/en';

function getValueByPath<T>(obj: T, path: string): unknown {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (
      result !== null &&
      typeof result === 'object' &&
      key in result
    ) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return result;
}

/**
 * Система локализации (i18n)
 * Поддерживает динамическое переключение языков ru/en
 */
class I18nClass {
  private translations: Record<Locale, ITranslation> = { ru, en };
  
  private config: ILocaleConfig = {
    locale: 'ru',
    fallbackLocale: 'en',
    supportedLocales: ['ru', 'en'],
  };

  private storageKey = 'portfolio_locale';
  private listeners: Set<(locale: Locale) => void> = new Set();

  // Кэш: "ru:header.title" → "Главная"
  private cache: Map<string, string> = new Map();

  constructor() {
    this.loadSavedLocale();
    this.updateDocument(); // Обновляем DOM при инициализации
  }

  /**
   * Получить текущий язык
   */
  getLocale(): Locale {
    return this.config.locale;
  }

  /**
   * Установить язык
   */
  setLocale(locale: Locale): void {
    if (!this.isSupported(locale)) {
      console.warn(`Locale "${locale}" is not supported, using fallback`);
      locale = this.config.fallbackLocale;
    }

    // Очищаем кэш при смене языка (можно и не очищать — но лучше для предсказуемости)
    this.clearCache();

    this.config.locale = locale;
    this.saveLocale();
    this.notifyListeners();
    this.updateDocument();
  }

  /**
   * Переключить язык на противоположный
   */
  toggleLocale(): void {
    const newLocale: Locale = this.config.locale === 'ru' ? 'en' : 'ru'
    this.setLocale(newLocale)
  }

  /**
   * Получить перевод по ключу
   */
  t(key: string): string {
    const cacheKey = `${this.config.locale}:${key}`;

    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let value = getValueByPath(this.translations[this.config.locale], key)

    if (!value) {
      value = getValueByPath(this.translations[this.config.fallbackLocale], key)
    }

    const result = typeof value === 'string' ? value : key

    // Сохраняем в кэш
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Очистить кэш (полезно при динамической загрузке переводов)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Получить все переводы текущего языка
   */
  getTranslations(): ITranslation {
    return this.translations[this.config.locale]
  }

  /**
   * Подписаться на изменение языка
   */
  subscribe(callback: (locale: Locale) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Проверка поддержки языка
   */
  isSupported(locale: string): locale is Locale {
    return this.config.supportedLocales.includes(locale as Locale);
  }

  /**
   * Получить список поддерживаемых языков
   */
  getSupportedLocales(): Locale[] {
    return [...this.config.supportedLocales];
  }

  /**
   * Загрузить сохранённый язык
   */
  private loadSavedLocale(): void {
    try {
      const saved = localStorage.getItem(this.storageKey) as Locale | null;
      if (saved && this.isSupported(saved)) {
        this.config.locale = saved;
      } else {
        // Автоопределение языка браузера
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('ru')) {
          this.config.locale = 'ru';
        } else if (browserLang.startsWith('en')) {
          this.config.locale = 'en';
        }
      }
    } catch {
      console.warn('localStorage is unavailable')
    }
  }

  /**
   * Сохранить язык
   */
  private saveLocale(): void {
    try {
      localStorage.setItem(this.storageKey, this.config.locale);
    } catch {
      console.warn('localStorage is unavailable')
    }
  }

  /**
   * Уведомить слушателей об изменении
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.config.locale));
  }

  /**
   * Обновить DOM элементы с data-i18n атрибутом
   */
  private updateDocument(): void {
    // Обновляем элементы с data-i18n
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach((element) => {
      const key = element.getAttribute('data-i18n');

      if (!key) return;

      const translation = this.t(key);

      if (!translation) return;

      if (typeof translation === 'string') {
        const placeholderAttr = element.getAttribute('data-i18n-placeholder');

        if (placeholderAttr) {
          const input = element as HTMLInputElement;

          if (!input || !('placeholder' in input)) return;

          input.placeholder = this.t(placeholderAttr) as string;
        } else {
          element.textContent = translation;
        }
      }
    });

    // Обновляем элементы только с data-i18n-placeholder (без data-i18n)
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]:not([data-i18n])');

    placeholderElements.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');

      if (!key) return;

      const translation = this.t(key);

      if (translation && typeof translation === 'string') {
        const input = element as HTMLInputElement;

        if (input && 'placeholder' in input) {
          input.placeholder = translation;
        }
      }
    });

    // Обновление lang атрибута
    document.documentElement.lang = this.config.locale;
  }
}

// Экспорт singleton экземпляра
export const I18n = new I18nClass();

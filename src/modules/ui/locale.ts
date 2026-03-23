import { BaseModule } from '../base-module';
import { I18n } from '@core/i18n';
import type { Locale } from '@core/i18n';

/**
 * Модуль переключения языка
 * Добавляет UI для выбора языка и обновляет контент
 */
export class LocaleModule extends BaseModule {
  private toggleButton: HTMLElement | null = null;
  private localeDisplay: HTMLElement | null = null;

  constructor() {
    super('Locale');
  }

  init(): void {
    if (this.initialized) return;

    this.createLocaleSwitcher();
    this.setupEventListeners();
    this.updateContent();
    
    // Подписка на изменения языка
    I18n.subscribe(() => this.updateContent());
    
    this.initialized = true;
    this.debug('Initialized');
  }

  /**
   * Создать переключатель языков
   */
  private createLocaleSwitcher(): void {
    // Создаём кнопку в навигации
    const navbar = document.querySelector('.nav-links');
    
    if (navbar) {
      const localeItem = document.createElement('li');
      localeItem.className = 'locale-item';
      
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = 'locale-toggle';
      this.toggleButton.setAttribute('aria-label', 'Switch language');
      
      // Иконка глобуса
      this.toggleButton.innerHTML = `
        <svg class="locale-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span class="locale-text">${I18n.getLocale().toUpperCase()}</span>
      `;
      
      this.localeDisplay = this.toggleButton.querySelector('.locale-text');
      
      localeItem.appendChild(this.toggleButton);
      navbar.appendChild(localeItem);
    }
  }

  /**
   * Настроить обработчики событий
   */
  private setupEventListeners(): void {
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        I18n.toggleLocale();
      });
    }
  }

  /**
   * Обновить весь контент на странице
   */
  private updateContent(): void {
    const locale = I18n.getLocale();

    // Обновление текста кнопки
    if (this.localeDisplay) {
      this.localeDisplay.textContent = locale.toUpperCase();
    }

    // Делегируем обновление DOM методу I18n
    // Он обрабатывает и data-i18n, и data-i18n-placeholder

    // Обновление title
    const titleElement = document.querySelector('title');
    if (titleElement && locale === 'en') {
      titleElement.textContent = 'Developer Portfolio | Tanya Musaeva';
    } else if (titleElement) {
      titleElement.textContent = 'Портфолио разработчика | Таня Мусаева';
    }

    // Обновление meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      if (locale === 'en') {
        metaDescription.setAttribute('content', 'Full-Stack Developer Portfolio. Building modern web applications with React, Vue, Node.js');
      } else {
        metaDescription.setAttribute('content', 'Портфолио Full-Stack разработчика. Создание современных веб-приложений на React, Vue, Node.js');
      }
    }

    // Сохранение в URL (опционально)
    this.updateUrlLocale(locale);
  }

  /**
   * Обновить locale в URL
   */
  private updateUrlLocale(locale: Locale): void {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', locale);
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Загрузить locale из URL
   */
  loadLocaleFromUrl(): void {
    const url = new URL(window.location.href);
    const lang = url.searchParams.get('lang') as Locale | null;
    
    if (lang && I18n.isSupported(lang)) {
      I18n.setLocale(lang);
    }
  }

  destroy(): void {
    if (this.toggleButton) {
      this.toggleButton.remove();
    }
    super.destroy();
  }
}

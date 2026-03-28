import { BaseModule } from '../base-module';
import { FormSubmitChecker } from '@core/utils/formsubmit-checker';
import { I18n } from '@core/i18n';

/**
 * Модуль форм
 * Обрабатывает отправку и валидацию форм
 */
export class FormModule extends BaseModule {
  private forms: Map<string, HTMLFormElement> = new Map();
  private readonly RECIPIENT_EMAIL = 'tatykolcova1234@yandex.ru';
  private isFormSubmitAvailable = true;

  constructor() {
    super('Form');
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Проверяем доступность FormSubmit при инициализации
    await this.checkFormSubmitAvailability();

    this.setupForms();

    // Подписка на изменение языка для обновления текстов
    I18n.subscribe(() => this.updateMessagesTranslations());

    this.initialized = true;
    this.debug('Initialized');
  }

  /**
   * Обновить переводы в сообщениях формы
   */
  private updateMessagesTranslations(): void {
    // Обновляем сообщение о недоступности сервиса
    const unavailableMessage = document.querySelector(
      '.service-unavailable-message'
    );
    if (unavailableMessage) {
      unavailableMessage.innerHTML = `
        <p>⚠️ ${I18n.t('contact.unavailableTitle')}</p>
        <p>${I18n.t('contact.unavailableText')} <a href="mailto:${this.RECIPIENT_EMAIL}">${this.RECIPIENT_EMAIL}</a></p>
        <p class="unavailable-reason">${I18n.t('contact.unavailableReason')}</p>
      `;
    }

    // Обновляем ошибки валидации
    document.querySelectorAll('.field-error').forEach(el => {
      const input = el.previousElementSibling as
        | HTMLInputElement
        | HTMLTextAreaElement;
      if (input?.required && !input.value.trim()) {
        el.textContent = I18n.t('contact.fieldRequired');
      } else if (input?.type === 'email') {
        el.textContent = I18n.t('contact.fieldEmailInvalid');
      }
    });

    // Обновляем текст кнопки отправки
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      const submitBtn = contactForm.querySelector(
        'button[type="submit"]'
      ) as HTMLButtonElement;
      if (
        submitBtn &&
        !submitBtn.disabled &&
        !submitBtn.classList.contains('button--success')
      ) {
        submitBtn.textContent = I18n.t('contact.formSubmit');
      }
    }
  }

  /**
   * Проверка доступности FormSubmit.co
   */
  private async checkFormSubmitAvailability(): Promise<void> {
    this.isFormSubmitAvailable = await FormSubmitChecker.checkAvailability();

    if (!this.isFormSubmitAvailable) {
      console.warn(
        '[FormModule] FormSubmit.co недоступен. Показываем уведомление.'
      );
      this.showServiceUnavailableMessage();
    }
  }

  /**
   * Показать сообщение о недоступности сервиса
   */
  private showServiceUnavailableMessage(): void {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const submitBtn = contactForm.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (!submitBtn) return;

    // Блокируем кнопку отправки
    submitBtn.disabled = true;
    submitBtn.textContent = I18n.t('contact.serviceUnavailable');
    submitBtn.classList.add('button--unavailable');

    // Добавляем сообщение под формой
    const existingMessage = contactForm.querySelector(
      '.service-unavailable-message'
    );
    if (existingMessage) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'service-unavailable-message';
    messageDiv.innerHTML = `
      <p>⚠️ ${I18n.t('contact.unavailableTitle')}</p>
      <p>${I18n.t('contact.unavailableText')} <a href="mailto:${this.RECIPIENT_EMAIL}">${this.RECIPIENT_EMAIL}</a></p>
      <p class="unavailable-reason">${I18n.t('contact.unavailableReason')}</p>
    `;

    contactForm.appendChild(messageDiv);
  }

  private setupForms(): void {
    // Находим все формы с атрибутом data-form
    const formElements =
      document.querySelectorAll<HTMLFormElement>('form[data-form]');

    formElements.forEach(form => {
      const formName =
        form.getAttribute('data-form') || `form-${this.forms.size}`;
      this.forms.set(formName, form);
      this.setupFormHandler(form);
    });

    // Контактная форма (по ID)
    const contactForm = document.getElementById(
      'contact-form'
    ) as HTMLFormElement;
    if (contactForm) {
      this.forms.set('contact', contactForm);
      this.setupFormHandler(contactForm);
    }
  }

  private setupFormHandler(form: HTMLFormElement): void {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Валидация
      const isValid = this.validateForm(form);
      if (!isValid) return;

      // Отправка
      try {
        await this.submitForm(form, data);
      } catch (error) {
        console.error('[FormModule] Submit error:', error);
      }
    });

    // Валидация в реальном времени
    const inputs = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });
  }

  private validateForm(form: HTMLFormElement): boolean {
    let isValid = true;
    const inputs = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('input, textarea');

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  private validateField(
    input: HTMLInputElement | HTMLTextAreaElement
  ): boolean {
    const value = input.value.trim();
    const type = input.type;

    // Очистка предыдущих ошибок
    this.clearFieldError(input);

    // Required проверка
    if (input.required && !value) {
      this.showFieldError(input, I18n.t('contact.fieldRequired'));
      return false;
    }

    // Email проверка
    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(input, I18n.t('contact.fieldEmailInvalid'));
        return false;
      }
    }

    // Минимальная длина
    if (input.minLength && value.length < input.minLength) {
      const message = I18n.t('contact.fieldMinLength').replace(
        '{min}',
        String(input.minLength)
      );
      this.showFieldError(input, message);
      return false;
    }

    return true;
  }

  private showFieldError(
    input: HTMLInputElement | HTMLTextAreaElement,
    message: string
  ): void {
    input.classList.add('error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;

    input.parentNode?.appendChild(errorDiv);
  }

  private clearFieldError(input: HTMLInputElement | HTMLTextAreaElement): void {
    input.classList.remove('error');

    const errorDiv = input.parentNode?.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  private async submitForm(
    form: HTMLFormElement,
    data: Record<string, unknown>
  ): Promise<void> {
    const submitBtn = form.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    const originalText = submitBtn.textContent;

    // Проверяем доступность FormSubmit
    if (!this.isFormSubmitAvailable) {
      this.showFieldError(
        form.querySelector('input[type="email"]') as HTMLInputElement,
        I18n.t('contact.submitUnavailable')
      );
      return;
    }

    // Блокируем кнопку
    submitBtn.disabled = true;
    submitBtn.textContent = I18n.t('contact.sending');

    try {
      // Отправка через FormSubmit.co AJAX API
      const response = await fetch(
        FormSubmitChecker.getSubmitUrl(this.RECIPIENT_EMAIL),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_name: data.name as string,
            from_email: data.email as string,
            message: data.message as string,
            // Скрытые поля для настройки
            _subject: 'Новое сообщение с портфолио!',
            _captcha: 'false', // Отключаем капчу
            _template: 'table', // Красивый шаблон письма
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка отправки');
      }

      // Успех
      submitBtn.textContent = I18n.t('contact.formSuccess') + ' ✓';
      submitBtn.classList.add('button--success');

      console.log('[FormModule] Form submitted successfully:', data);

      // Сброс через 3 секунды
      setTimeout(() => {
        submitBtn.textContent = originalText || I18n.t('contact.formSubmit');
        submitBtn.disabled = false;
        submitBtn.classList.remove('button--success');
        form.reset();
      }, 3000);
    } catch (error) {
      console.error('[FormModule] Submit error:', error);

      submitBtn.textContent = I18n.t('contact.formError');
      submitBtn.classList.add('button--error');

      // Показываем сообщение об ошибке
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-submit-error';
      errorDiv.innerHTML = `
        <p>⚠️ ${I18n.t('contact.unavailableTitle')}</p>
        <p>${I18n.t('contact.unavailableText')} <a href="mailto:${this.RECIPIENT_EMAIL}">${this.RECIPIENT_EMAIL}</a></p>
      `;

      // Удаляем предыдущие ошибки
      const existingError = form.querySelector('.form-submit-error');
      if (existingError) existingError.remove();

      form.appendChild(errorDiv);

      // Сброс кнопки через 3 секунды
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('button--error');
      }, 3000);
    }
  }

  /**
   * Зарегистрировать форму
   */
  registerForm(name: string, form: HTMLFormElement): void {
    this.forms.set(name, form);
    this.setupFormHandler(form);
  }

  /**
   * Получить форму по имени
   */
  getForm(name: string): HTMLFormElement | undefined {
    return this.forms.get(name);
  }

  destroy(): void {
    this.forms.clear();
    super.destroy();
  }
}

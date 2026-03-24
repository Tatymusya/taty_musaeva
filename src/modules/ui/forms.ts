import { BaseModule } from '../base-module';
import { FormSubmitChecker } from '@core/utils/formsubmit-checker';

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

    this.initialized = true;
    this.debug('Initialized');
  }

  /**
   * Проверка доступности FormSubmit.co
   */
  private async checkFormSubmitAvailability(): Promise<void> {
    this.isFormSubmitAvailable = await FormSubmitChecker.checkAvailability();

    if (!this.isFormSubmitAvailable) {
      console.warn('[FormModule] FormSubmit.co недоступен. Показываем уведомление.');
      this.showServiceUnavailableMessage();
    }
  }

  /**
   * Показать сообщение о недоступности сервиса
   */
  private showServiceUnavailableMessage(): void {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const submitBtn = contactForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (!submitBtn) return;

    // Блокируем кнопку отправки
    submitBtn.disabled = true;
    submitBtn.textContent = 'Сервис недоступен';
    submitBtn.classList.add('unavailable');

    // Добавляем сообщение под формой
    const existingMessage = contactForm.querySelector('.service-unavailable-message');
    if (existingMessage) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'service-unavailable-message';
    messageDiv.innerHTML = `
      <p>⚠️ Сервис отправки писем временно недоступен.</p>
      <p>Вы можете написать мне напрямую: <a href="mailto:${this.RECIPIENT_EMAIL}">${this.RECIPIENT_EMAIL}</a></p>
      <p class="unavailable-reason">Возможно, сервис заблокирован в вашем регионе или требуется VPN.</p>
    `;

    contactForm.appendChild(messageDiv);
  }

  private setupForms(): void {
    // Находим все формы с атрибутом data-form
    const formElements = document.querySelectorAll<HTMLFormElement>('form[data-form]');

    formElements.forEach((form) => {
      const formName = form.getAttribute('data-form') || `form-${this.forms.size}`;
      this.forms.set(formName, form);
      this.setupFormHandler(form);
    });

    // Контактная форма (по ID)
    const contactForm = document.getElementById('contact-form') as HTMLFormElement;
    if (contactForm) {
      this.forms.set('contact', contactForm);
      this.setupFormHandler(contactForm);
    }
  }

  private setupFormHandler(form: HTMLFormElement): void {
    form.addEventListener('submit', async (e) => {
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
    const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    inputs.forEach((input) => {
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
    const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');

    inputs.forEach((input) => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  private validateField(input: HTMLInputElement | HTMLTextAreaElement): boolean {
    const value = input.value.trim();
    const type = input.type;

    // Очистка предыдущих ошибок
    this.clearFieldError(input);

    // Required проверка
    if (input.required && !value) {
      this.showFieldError(input, 'Это поле обязательно для заполнения');
      return false;
    }

    // Email проверка
    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(input, 'Введите корректный email');
        return false;
      }
    }

    // Минимальная длина
    if (input.minLength && value.length < input.minLength) {
      this.showFieldError(input, `Минимальная длина: ${input.minLength} символов`);
      return false;
    }

    return true;
  }

  private showFieldError(input: HTMLInputElement | HTMLTextAreaElement, message: string): void {
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

  private async submitForm(form: HTMLFormElement, data: Record<string, unknown>): Promise<void> {
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitBtn.textContent;

    // Проверяем доступность FormSubmit
    if (!this.isFormSubmitAvailable) {
      this.showFieldError(
        form.querySelector('input[type="email"]') as HTMLInputElement,
        'Сервис отправки временно недоступен. Напишите мне напрямую на почту.'
      );
      return;
    }

    // Блокируем кнопку
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
      // Отправка через FormSubmit.co AJAX API
      const response = await fetch(FormSubmitChecker.getSubmitUrl(this.RECIPIENT_EMAIL), {
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
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка отправки');
      }

      // Успех
      submitBtn.textContent = 'Отправлено! ✓';
      submitBtn.classList.add('success');

      console.log('[FormModule] Form submitted successfully:', data);

      // Сброс через 3 секунды
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('success');
        form.reset();
      }, 3000);
    } catch (error) {
      console.error('[FormModule] Submit error:', error);

      submitBtn.textContent = 'Ошибка ✗';
      submitBtn.classList.add('error');

      // Показываем сообщение об ошибке
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-submit-error';
      errorDiv.innerHTML = `
        <p>⚠️ Не удалось отправить форму.</p>
        <p>Вы можете написать мне напрямую: <a href="mailto:${this.RECIPIENT_EMAIL}">${this.RECIPIENT_EMAIL}</a></p>
      `;

      // Удаляем предыдущие ошибки
      const existingError = form.querySelector('.form-submit-error');
      if (existingError) existingError.remove();

      form.appendChild(errorDiv);

      // Сброс кнопки через 3 секунды
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('error');
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

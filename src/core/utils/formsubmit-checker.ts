/**
 * Проверка доступности FormSubmit.co
 * Работает в РФ без VPN
 */

export interface FormSubmitStatus {
  available: boolean;
  checked: boolean;
  checking: boolean;
}

class FormSubmitCheckerClass {
  private status: FormSubmitStatus = {
    available: true,
    checked: false,
    checking: false,
  };

  private readonly TEST_URL = 'https://formsubmit.co/ajax/test';
  private readonly CHECK_TIMEOUT = 5000; // 5 секунд

  /**
   * Проверить доступность FormSubmit
   */
  async checkAvailability(): Promise<boolean> {
    // Если уже проверяли, возвращаем кэш
    if (this.status.checked) {
      return this.status.available;
    }

    // Если уже идёт проверка, ждём её
    if (this.status.checking) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.status.checked) {
            clearInterval(checkInterval);
            resolve(this.status.available);
          }
        }, 100);
      });
    }

    this.status.checking = true;

    try {
      // Пробуем сделать тестовый запрос
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.CHECK_TIMEOUT);

      const response = await fetch(this.TEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'test',
          from_name: 'test',
          from_email: 'test@test.com',
          message: 'test',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // FormSubmit возвращает 400 для тестового ключа, но это нормально
      // Главное — что сервер ответил
      this.status.available = response.status !== 503;
      this.status.checked = true;

      console.log(
        '[FormSubmit] Availability:',
        this.status.available ? '✅ Available' : '❌ Unavailable'
      );
      return this.status.available;
    } catch (error) {
      // Сеть недоступна или заблокирована
      console.warn('[FormSubmit] Check failed:', error);
      this.status.available = false;
      this.status.checked = true;
      return false;
    } finally {
      this.status.checking = false;
    }
  }

  /**
   * Получить текущий статус
   */
  getStatus(): FormSubmitStatus {
    return { ...this.status };
  }

  /**
   * Сбросить кэш (для повторной проверки)
   */
  reset(): void {
    this.status = {
      available: true,
      checked: false,
      checking: false,
    };
  }

  /**
   * URL для отправки формы
   */
  getSubmitUrl(email: string): string {
    return `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
  }
}

export const FormSubmitChecker = new FormSubmitCheckerClass();

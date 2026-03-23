import type { Module } from '@core/types';

/**
 * Базовый класс для всех модулей
 * Предоставляет общую функциональность и жизненный цикл
 */
export abstract class BaseModule implements Module {
  public readonly name: string;
  protected initialized: boolean = false;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Инициализация модуля
   */
  abstract init(): void;

  /**
   * Очистка ресурсов модуля
   */
  destroy(): void {
    this.initialized = false;
    console.log(`[Module:${this.name}] Destroyed`);
  }

  /**
   * Проверка инициализации
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Module "${this.name}" is not initialized`);
    }
  }

  /**
   * Логирование в режиме отладки
   */
  protected debug(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(`[Module:${this.name}]`, ...args);
    }
  }
}

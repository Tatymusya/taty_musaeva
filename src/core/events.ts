import type { CustomEventMap, EventType } from '@core/types';

/**
 * Менеджер событий
 * Централизованная система публикации/подписки на события
 */
class EventManagerClass {
  private listeners: Map<EventType, Set<(...args: unknown[]) => void>> =
    new Map();

  /**
   * Подписаться на событие
   */
  on<T extends EventType>(
    event: T,
    callback: (data: CustomEventMap[T]) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (...args: unknown[]) => void);
  }

  /**
   * Отписаться от события
   */
  off<T extends EventType>(
    event: T,
    callback: (...args: unknown[]) => void
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Опубликовать событие
   */
  emit<T extends EventType>(event: T, data: CustomEventMap[T]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data as unknown));
    }
  }

  /**
   * Подписаться один раз
   */
  once<T extends EventType>(
    event: T,
    callback: (data: CustomEventMap[T]) => void
  ): void {
    const onceWrapper = (data: CustomEventMap[T]): void => {
      callback(data);
      this.off(event, onceWrapper as (...args: unknown[]) => void);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Очистить все слушатели события
   */
  clear(event: EventType): void {
    this.listeners.delete(event);
  }

  /**
   * Очистить все события
   */
  clearAll(): void {
    this.listeners.clear();
  }

  /**
   * Получить количество слушателей события
   */
  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size || 0;
  }
}

export const EventManager = new EventManagerClass();

/**
 * Module Loader с отслеживанием прогресса и событиями
 * Позволяет отображать имена инициализируемых модулей в preloader
 */

export interface ModuleInfo {
  name: string;
  init(): Promise<void> | void;
  destroy?(): void;
}

export interface LoadProgress {
  current: number;
  total: number;
  percent: number;
  currentModule: string | null;
  completedModules: string[];
}

export type ModuleLoaderEvent =
  | 'module:start'
  | 'module:complete'
  | 'module:error'
  | 'progress'
  | 'complete';

export interface ModuleLoaderEvents {
  'module:start': { name: string };
  'module:complete': { name: string };
  'module:error': { name: string; error: unknown };
  progress: LoadProgress;
  complete: { modules: string[] };
}

class ModuleLoaderClass {
  private listeners: Map<ModuleLoaderEvent, Set<(...args: unknown[]) => void>> = new Map();
  private completedModules: string[] = [];
  private totalModules = 0;

  /**
   * Подписаться на событие
   */
  on<T extends ModuleLoaderEvent>(event: T, callback: (data: ModuleLoaderEvents[T]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (...args: unknown[]) => void);
  }

  /**
   * Отписаться от события
   */
  off<T extends ModuleLoaderEvent>(event: T, callback: (...args: unknown[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Опубликовать событие
   */
  private emit<T extends ModuleLoaderEvent>(event: T, data: ModuleLoaderEvents[T]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data as unknown));
    }
  }

  /**
   * Подписаться один раз
   */
  once<T extends ModuleLoaderEvent>(
    event: T,
    callback: (data: ModuleLoaderEvents[T]) => void
  ): void {
    const onceWrapper = (data: ModuleLoaderEvents[T]): void => {
      callback(data);
      this.off(event, onceWrapper as (...args: unknown[]) => void);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Загрузить все модули с отслеживанием прогресса
   */
  async loadAll(modules: ModuleInfo[]): Promise<void> {
    this.totalModules = modules.length;
    this.completedModules = [];

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];

      // Отправляем событие начала модуля с прогрессом
      this.emit('module:start', { name: module.name });
      this.emit('progress', this.getProgress(module.name));

      try {
        await module.init();
        this.completedModules.push(module.name);
        this.emit('module:complete', { name: module.name });
        this.emit('progress', this.getProgress());

        // Минимальная задержка между модулями для обновления UI
        if (i < modules.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } catch (error) {
        this.emit('module:error', { name: module.name, error });
        throw error;
      }
    }

    this.emit('complete', { modules: [...this.completedModules] });
  }

  /**
   * Получить текущий прогресс
   */
  private getProgress(currentModule: string | null = null): LoadProgress {
    const current = this.completedModules.length;
    return {
      current,
      total: this.totalModules,
      percent: Math.round((current / this.totalModules) * 100),
      currentModule,
      completedModules: [...this.completedModules],
    };
  }

  /**
   * Получить количество слушателей события
   */
  getListenerCount(event: ModuleLoaderEvent): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * Очистить все слушатели
   */
  clearAll(): void {
    this.listeners.clear();
  }
}

export const ModuleLoader = new ModuleLoaderClass();

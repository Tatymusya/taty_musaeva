import { BaseModule } from '../base-module';
import { EventManager } from '../../core/events';
import type { MousePosition, ScrollState } from '../../core/types';

/**
 * Модуль взаимодействия
 * Обрабатывает ввод пользователя: мышь, скролл, клавиатура
 */
export class InteractionModule extends BaseModule {
  private mouse: MousePosition = { x: 0, y: 0, normalizedX: 0, normalizedY: 0 };
  private scrollState: ScrollState = { y: 0, progress: 0, direction: 'down' };
  private lastScrollY: number = 0;
  private mouseTimeout: ReturnType<typeof setTimeout> | null = null;
  private _onMouseMove: ((event: MouseEvent) => void) | null = null;
  private _onScroll: (() => void) | null = null;
  private _onKeyDown: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super('Interaction');
  }

  init(): void {
    if (this.initialized) return;

    this.setupMouseMove();
    this.setupScroll();
    this.setupKeyboard();

    this.initialized = true;
    this.debug('Initialized');
  }

  private setupMouseMove(): void {
    const onMouseMove = (event: MouseEvent): void => {
      // Нормализованные координаты (-1 до 1)
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      this.mouse.normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;

      // Эмитим событие
      EventManager.emit('mouse:move', { ...this.mouse });

      // Сброс таймера неактивности
      if (this.mouseTimeout) {
        clearTimeout(this.mouseTimeout);
      }

      this.mouseTimeout = setTimeout(() => {
        EventManager.emit('mouse:move', {
          ...this.mouse,
          normalizedX: 0,
          normalizedY: 0,
        });
      }, 1000);
    };

    window.addEventListener('mousemove', onMouseMove);
    this._onMouseMove = onMouseMove;
  }

  private setupScroll(): void {
    let ticking = false;

    const onScroll = (): void => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateScrollState();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this._onScroll = onScroll;
  }

  private updateScrollState(): void {
    const scrollY = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollY / docHeight : 0;
    const direction = scrollY > this.lastScrollY ? 'down' : 'up';

    this.scrollState = {
      y: scrollY,
      progress,
      direction,
    };

    EventManager.emit('scroll', this.scrollState);
    this.lastScrollY = scrollY;
  }

  private setupKeyboard(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      EventManager.emit('keydown', { key: event.key, code: event.code });
    };

    window.addEventListener('keydown', onKeyDown);
    this._onKeyDown = onKeyDown;
  }

  /**
   * Получить текущую позицию мыши
   */
  getMousePosition(): MousePosition {
    return { ...this.mouse };
  }

  /**
   * Получить состояние скролла
   */
  getScrollState(): ScrollState {
    return { ...this.scrollState };
  }

  destroy(): void {
    if (this._onMouseMove) {
      window.removeEventListener('mousemove', this._onMouseMove);
    }

    if (this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
    }

    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
    }

    if (this.mouseTimeout) {
      clearTimeout(this.mouseTimeout);
    }

    super.destroy();
  }
}

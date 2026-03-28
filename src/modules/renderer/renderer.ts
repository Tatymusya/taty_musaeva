import * as THREE from 'three';
import { BaseModule } from '@modules/base-module';
import { getConfig } from '@core/config';
import { EventManager } from '@core/events';
import { DeviceCheck } from '@core/device-check';

/**
 * Модуль рендеринга
 * Отвечает за создание и управление WebGL рендерером, камерой
 */
export class RendererModule extends BaseModule {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private width: number = 0;
  private height: number = 0;
  private animationFrameId: number | null = null;
  private callbacks: Set<() => void> = new Set();
  private _onResize: (() => void) | null = null;
  // добавлены
  private lastTime = 0;
  private readonly targetFps = 30; // Можно вынести в config
  private readonly frameTime = 1000 / this.targetFps;
  private ticking = false;

  // Флаги состояния
  private isFallbackMode = false;
  private webglSupported = true;

  constructor(canvasSelector: string = '#webgl-canvas') {
    super('Renderer');
    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element "${canvasSelector}" not found`);
    }
    this.canvas = canvas;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const capabilities = await DeviceCheck.getCapabilities();
    console.log('Device capabilities:', capabilities);

    // Публикуем событие с возможностями устройства
    EventManager.emit('device:capabilities', capabilities);

    // Проверка на WebGL и слабые устройства
    if (!capabilities.webgl) {
      this.webglSupported = false;
      this.handleWebGLError('WebGL not supported');
      this.initialized = true;
      return;
    }

    if (capabilities.lowEndDevice) {
      this.webglSupported = false;
      this.handleWebGLError('Low-end device detected');
      this.initialized = true;
      return;
    }

    await this.setupRenderer();
    this.setupCamera();
    this.setupResizeHandler();

    this.initialized = true;
    this.debug('Initialized');
  }

  private async setupRenderer(): Promise<void> {
    const config = getConfig('three');

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.updateSize();
    this.renderer.setClearColor(config.bgColor, 1);

    this.debug('WebGL renderer initialized');
  }

  /**
   * Установка размеров
   */
  private updateSize(): void {
    const canvas = this.renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    this.width = Math.floor(canvas.clientWidth * pixelRatio);
    this.height = Math.floor(canvas.clientHeight * pixelRatio);
    const needResize =
      canvas.width !== this.width || canvas.height !== this.height;
    if (needResize) {
      this.renderer.setSize(this.width, this.height, false);
    }
  }

  /**
   * Установка размеров при ресайзе
   */
  private setupResizeHandler(): void {
    const onResize = (): void => {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();

      this.updateSize();

      EventManager.emit('resize', { width: this.width, height: this.height });
    };

    window.addEventListener('resize', onResize);
    this._onResize = onResize;
  }

  /**
   * Обработка ошибки WebGL
   */
  private handleWebGLError(reason: string): void {
    this.isFallbackMode = true;
    this.debug(`WebGL fallback mode: ${reason}`);

    // Уведомляем приложение
    EventManager.emit('webgl:not-supported', { reason });

    // Скрываем canvas
    this.canvas.style.display = 'none';

    // Показываем fallback-изображение
    this.showFallbackImage();

    console.warn(`⚠️ 3D rendering disabled: ${reason}. Using fallback image.`);
  }

  /**
   * Показать fallback-изображение
   */
  private showFallbackImage(): void {
    // Проверяем, не добавлено ли уже fallback-изображение
    if (document.querySelector('.fallback-image')) return;

    const img = document.createElement('img');
    img.src = './images/fallback.svg'; // путь к SVG изображению
    img.alt = '3D background not available';
    img.className = 'fallback-image';

    // Добавляем стили явно через JS для надёжности
    img.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: -1;
      pointer-events: none;
    `;

    // Добавляем в body, а не в родителя canvas
    document.body.appendChild(img);

    // Добавляем класс на body для дополнительных стилей
    document.body.classList.add('fallback-mode');
  }

  /**
   * Проверка, работает ли модуль в режиме fallback
   */
  isFallback(): boolean {
    return this.isFallbackMode;
  }

  /**
   * Проверка поддержки WebGL
   */
  isWebGLSupported(): boolean {
    return this.webglSupported;
  }

  private setupCamera(): void {
    const aspect = this.width / this.height;

    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 50;
  }

  /**
   * Добавить callback в анимационный цикл
   */
  addRenderCallback(callback: () => void): void {
    this.callbacks.add(callback);
  }

  /**
   * Удалить callback из анимационного цикла
   */
  removeRenderCallback(callback: () => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * Запустить анимационный цикл
   */
  startAnimationLoop(): void {
    if (this.animationFrameId !== null) return;

    const animate = (time: number): void => {
      this.animationFrameId = requestAnimationFrame(animate);
      // Пропускаем кадр, если ещё не прошло достаточно времени
      if (!this.ticking && time - this.lastTime >= this.frameTime) {
        this.ticking = true;
        this.lastTime = time;

        // Выполняем все callback'и (например, обновление сцены)
        this.callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Render callback error:', error);
          }
        });

        // Сигнал "тик" приложения
        EventManager.emit('tick', {
          delta: this.frameTime / 1000,
          time: performance.now() / 1000,
        });

        this.ticking = false;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
    this.debug('Controlled animation loop started (FPS: %d)', this.targetFps);
  }

  /**
   * Остановить анимационный цикл
   */
  stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Рендерить сцену
   */
  render(scene: THREE.Scene, camera?: THREE.Camera): void {
    this.renderer.render(scene, camera || this.camera);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  destroy(): void {
    this.stopAnimationLoop();
    this.callbacks.clear();

    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }

    this.renderer.dispose();
    super.destroy();
  }
}

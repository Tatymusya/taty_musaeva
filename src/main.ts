/**
 * Portfolio Application
 * Модульная архитектура с разделением ответственности
 */
import './styles.css';

// SVG изображение разработчика вместо фото
import developerSvg from '@/assets/images/developer.svg';

// Создаём изображение для секции About
const img = document.createElement('img');
img.src = developerSvg;
img.alt = 'Full-Stack Разработчик';
img.className = 'about__profile-image';
img.style.width = '100%';
img.style.height = '100%';
img.style.objectFit = 'contain';

document
  .querySelector('.about__image .about__image-placeholder')
  ?.replaceWith(img);

// Импорт модулей через алиасы
import { RendererModule } from '@modules/renderer/renderer';
import { SceneModule } from '@modules/scene/scene'; // работающий код
import { InteractionModule } from '@modules/interaction/interaction';
import { NavigationModule } from '@modules/ui/navigation';
import { FormModule } from '@modules/ui/forms';
import { AnimationModule } from '@modules/ui/animations';
import { LocaleModule } from '@modules/ui/locale';
import { EventManager } from '@core/events';
import { ModuleLoader } from '@core/module-loader';
import { getConfig } from '@core/config';
import { createSvgSprite } from '@core/utils/svg-icons';
import { initProjectImages, initHeroImage } from '@modules/ui/project-images';
import { DeviceCheck } from '@core/device-check';
import type { IRendererModule, ISceneModule, Module } from '@core/types';

/**
 * Главный класс приложения
 * Инициализирует и управляет всеми модулями
 */
class Application {
  private modules: Map<string, Module> = new Map();
  private isRunning: boolean = false;
  private preloader: HTMLElement | null = null;
  private preloaderText: HTMLElement | null = null;
  private isFallbackMode = false; // Флаг fallback режима

  constructor() {
    if (!this.preloader) {
      this.preloader = document.getElementById('preloader');
      this.preloaderText = document.getElementById('module-name');
    }
  }
  /**
   * Инициализация приложения
   */
  async init(): Promise<void> {
    console.log(`🚀 ${getConfig('app.name')} v${getConfig('app.version')}`);
    console.log(`🔧 Debug mode: ${getConfig('app.debug') ? 'ON' : 'OFF'}`);

    // Подписка на события загрузки модулей для обновления preloader
    ModuleLoader.on(
      'progress',
      ({ percent, currentModule, completedModules }) => {
        const moduleName =
          currentModule || completedModules[completedModules.length - 1];
        if (moduleName) {
          this.updatePreloaderText(moduleName);
        }
        console.log(
          `📊 Прогресс: ${percent}% - ${currentModule || 'завершено'}`
        );
      }
    );

    // Подписка на событие WebGL не поддерживается
    EventManager.on('webgl:not-supported', data => {
      this.isFallbackMode = true;
      console.warn('⚠️ WebGL not supported, running in fallback mode:', data);
    });

    try {
      // 0. Инициализация SVG спрайта
      await createSvgSprite();

      // 0.1 Инициализация изображений проектов
      initProjectImages();

      // 0.2 Инициализация hero изображения
      initHeroImage();

      // 1. Проверка возможностей устройства
      const capabilities = await DeviceCheck.getCapabilities();
      console.log('📱 Device capabilities:', capabilities);

      if (!capabilities.webgl) {
        console.warn('⚠️ WebGL not supported');
        this.isFallbackMode = true;
      } else if (capabilities.lowEndDevice) {
        console.warn('⚠️ Low-end device detected');
        this.isFallbackMode = true;
      }

      // Создаём массив модулей для загрузки
      const modules = [
        {
          name: 'Renderer',
          init: async () => {
            const renderer = new RendererModule();
            await renderer.init();
            this.modules.set('renderer', renderer);

            // Проверяем, работает ли renderer в fallback режиме
            if (renderer.isFallback()) {
              this.isFallbackMode = true;
            }
          },
        },
        // Scene и Interaction не загружаются в fallback режиме
        ...(this.isFallbackMode
          ? []
          : [
              {
                name: 'Scene',
                init: () => {
                  const renderer = this.modules.get('renderer') as
                    | IRendererModule
                    | undefined;
                  if (!renderer) throw new Error('Renderer not initialized');
                  const scene = new SceneModule(
                    renderer.getCamera(),
                    renderer.getRenderer()
                  );
                  scene.init();
                  this.modules.set('scene', scene);
                },
              },
              {
                name: 'Interaction',
                init: () => {
                  const interaction = new InteractionModule();
                  interaction.init();
                  this.modules.set('interaction', interaction);
                },
              },
            ]),
        // Остальные модули загружаются всегда
        {
          name: 'Navigation',
          init: () => {
            const navigation = new NavigationModule();
            navigation.init();
            this.modules.set('navigation', navigation);
          },
        },
        {
          name: 'Forms',
          init: () => {
            const forms = new FormModule();
            forms.init();
            this.modules.set('forms', forms);
          },
        },
        {
          name: 'Animations',
          init: () => {
            const animations = new AnimationModule();
            animations.init();
            this.modules.set('animations', animations);
          },
        },
        {
          name: 'Locale',
          init: () => {
            const locale = new LocaleModule();
            locale.init();
            this.modules.set('locale', locale);
          },
        },
      ];

      // Загрузка всех модулей с отслеживанием прогресса
      await ModuleLoader.loadAll(modules);

      // 5. Запуск анимационного цикла (только если не fallback)
      if (!this.isFallbackMode) {
        const renderer = this.modules.get('renderer') as
          | IRendererModule
          | undefined;
        if (renderer) {
          renderer.addRenderCallback(() => {
            const scene = this.modules.get('scene') as ISceneModule | undefined;
            if (scene) scene.render();
          });
          renderer.startAnimationLoop();
        }
      }

      this.isRunning = true;
      console.log(
        this.isFallbackMode
          ? '⚠️ Running in fallback mode'
          : '✅ Все модули инициализированы'
      );
      this.logModuleStats();

      // Даём время на первый рендер Three.js
      console.log('🕒 Waiting for first render...');
      setTimeout(() => {
        console.log('👋 Hiding preloader');
        this.hidePreloader();
      }, 800);
    } catch (error) {
      setTimeout(() => this.hidePreloader(), 800);
      console.error('❌ Ошибка инициализации приложения:', error);
      this.destroy();
    }
  }

  /**
   * Обновление текста preloader (имя модуля вместо процентов)
   */
  private updatePreloaderText(moduleName: string): void {
    if (this.preloaderText) {
      this.preloaderText.textContent = moduleName;
    }
  }

  /**
   * Скрыть прелоадер с анимацией
   */
  private hidePreloader(): void {
    if (!this.preloader) return;

    this.preloader.classList.add('fade-out');
    setTimeout(() => {
      if (this.preloader && this.preloader.parentElement) {
        this.preloader.parentElement.removeChild(this.preloader);
      }
    }, 400);
  }

  /**
   * Остановка и очистка приложения
   */
  destroy(): void {
    console.log('🛑 Остановка приложения...');

    // Останавливаем модули в обратном порядке
    const moduleNames = Array.from(this.modules.keys()).reverse();

    moduleNames.forEach(name => {
      const module = this.modules.get(name);
      if (module?.destroy) {
        try {
          module.destroy();
          console.log(`  ✓ Модуль "${name}" остановлен`);
        } catch (error) {
          console.error(`  ✗ Ошибка остановки модуля "${name}":`, error);
        }
      }
    });

    // Очищаем события
    EventManager.clearAll();

    this.modules.clear();
    this.isRunning = false;

    console.log('👋 Приложение остановлено');
  }

  /**
   * Получить модуль по имени
   */
  getModule<T extends { init(): void }>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined;
  }

  /**
   * Статус приложения
   */
  getStatus(): { isRunning: boolean; moduleCount: number; modules: string[] } {
    return {
      isRunning: this.isRunning,
      moduleCount: this.modules.size,
      modules: Array.from(this.modules.keys()),
    };
  }

  /**
   * Логирование статистики модулей
   */
  private logModuleStats(): void {
    console.log('\n📊 Статистика модулей:');
    console.table(
      Array.from(this.modules.keys()).map(name => ({
        Модуль: name,
        Статус: '✓ Активен',
      }))
    );
  }
}

// ==========================================
// Точка входа
// ==========================================
const app = new Application();

async function loadFonts(): Promise<void> {
  if ('fonts' in document) {
    try {
      await document.fonts.load('1em Inter');
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading failed, continuing anyway', e);
    }
  }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
  await loadFonts();

  app.init();
});

// Очистка при выгрузке страницы
window.addEventListener('beforeunload', () => {
  app.destroy();
});

// Экспорт для отладки
if (import.meta.env.DEV) {
  (window as unknown as { app: Application }).app = app;
  console.log('💡 Для отладки: window.app.getStatus()');
}

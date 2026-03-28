import type { AppConfig } from './types';

/**
 * Конфигурация приложения
 * Централизованное хранилище всех настроек
 */
export const config: AppConfig = {
  app: {
    name: 'Portfolio',
    version: '1.0.0',
    debug: import.meta.env.DEV,
  },
  three: {
    particleCount: 150,
    particleSize: 2,
    particleColor: 0x64ffda,
    connectionDistance: 15,
    mouseInteractionRadius: 20,
    rotationSpeed: 0.001,
    bgColor: 0x0a192f,
    fogDensity: 0.03,
  },
  ui: {
    scrollSensitivity: 1,
    animationDuration: 300,
    mobileBreakpoint: 768,
  },
};

/**
 * Получить значение конфигурации по пути
 * @example getConfig('three.particleCount')
 */
export function getConfig<T extends keyof AppConfig | string>(
  path: T
): T extends keyof AppConfig ? AppConfig[T] : unknown {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = config;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      throw new Error(`Config path "${path}" not found`);
    }
  }

  return result;
}

/**
 * Обновить конфигурацию
 */
export function setConfig<T extends keyof AppConfig>(
  path: T,
  value: AppConfig[T]
): void {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let target: any = config;

  for (let i = 0; i < keys.length - 1; i++) {
    target = target[keys[i]];
  }

  target[keys[keys.length - 1]] = value;

  if (config.app.debug) {
    console.log(`[Config] ${path} updated:`, value);
  }
}

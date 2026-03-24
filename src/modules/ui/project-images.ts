/**
 * Модуль для загрузки изображений проектов и других изображений
 * Использует vite-imagetools для оптимизации
 */
// @ts-ignore
import viteSvg from '@core/assets/images/vite.svg';
// @ts-ignore
import heroPng from '@core/assets/images/hero.png?w=600&format=webp';

/**
 * Инициализация изображений проектов
 */
export function initProjectImages(): void {
  const containers = document.querySelectorAll('[data-project-image]');

  containers.forEach((container) => {
    const placeholder = container.querySelector('.project-image-placeholder');
    if (placeholder) {
      const img = document.createElement('img');
      img.src = viteSvg;
      img.alt = 'E-commerce Platform';
      img.loading = 'lazy';
      placeholder.replaceWith(img);
    }
  });
}

/**
 * Инициализация hero изображения (если есть placeholder)
 */
export function initHeroImage(): void {
  const placeholder = document.querySelector('[data-hero-image]');

  if (placeholder) {
    const img = document.createElement('img');
    img.src = heroPng;
    img.alt = 'Hero';
    img.loading = 'eager';
    placeholder.replaceWith(img);
  }
}

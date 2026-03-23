/**
 * SVG иконки как спрайт
 * Импортируем SVG файлы и создаём спрайт в DOM
 */

// Импортируем все SVG иконки как URL
// @ts-ignore
import githubIcon from '@core/assets/icons/github.svg';
// @ts-ignore
import linkedinIcon from '@core/assets/icons/linkedin.svg';
// @ts-ignore
import telegramIcon from '@core/assets/icons/telegram.svg';
// @ts-ignore
import emailIcon from '@core/assets/icons/email.svg';
// @ts-ignore
import externalLinkIcon from '@core/assets/icons/external-link.svg';

/**
 * Карта иконок: имя → URL
 */
export const iconUrls: Record<string, string> = {
  'github-icon': githubIcon,
  'linkedin-icon': linkedinIcon,
  'telegram-icon': telegramIcon,
  'email-icon': emailIcon,
  'external-link-icon': externalLinkIcon,
};

/**
 * Создать SVG спрайт в DOM
 * Вызывать один раз при инициализации приложения
 */
export async function createSvgSprite(): Promise<void> {
  // Проверяем, есть ли уже спрайт
  if (document.getElementById('svg-sprite')) return;

  const sprite = document.createElement('div');
  sprite.id = 'svg-sprite';
  sprite.style.display = 'none';

  // Загружаем содержимое всех иконок
  const iconContents = await Promise.all(
    Object.entries(iconUrls).map(async ([name, url]) => {
      try {
        const response = await fetch(url);
        const text = await response.text();
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
        if (match) {
          return `<symbol id="${name}" viewBox="0 0 24 24">${match[1]}</symbol>`;
        }
      } catch (e) {
        console.error(`Failed to load icon ${name}:`, e);
      }
      return '';
    })
  );

  sprite.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${iconContents.join('')}</svg>`;
  document.body.insertBefore(sprite, document.body.firstChild);
}

/**
 * Получить URL иконки по имени
 */
export function getIconUrl(name: string): string | undefined {
  return iconUrls[name];
}

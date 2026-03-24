// src/declaration.d.ts

/**
 * Поддержка изображений с query-параметрами от vite-imagetools
 * Примеры:
 *   '@/assets/photo.jpg'
 *   '@/assets/photo.jpg?w=800'
 *   '@/assets/photo.jpg?w=800&format=webp'
 *   '@/assets/photo.jpg?w=32&blur=2&format=jpeg'
 */

// Базовые форматы (без параметров)
declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.avif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

// SVG как raw строка
declare module '*.svg?raw' {
  const src: string;
  export default src;
}

// 🔥 Ключевое: поддержка query-параметров
// Такой синтаксис работает лучше, чем '*.*?*'
declare module '*.jpg?*' {
  const src: string;
  export default src;
}

declare module '*.jpeg?*' {
  const src: string;
  export default src;
}

declare module '*.png?*' {
  const src: string;
  export default src;
}

declare module '*.webp?*' {
  const src: string;
  export default src;
}

declare module '*.avif?*' {
  const src: string;
  export default src;
}

// Для других расширений при необходимости
declare module '*.svg?*' {
  const src: string;
  export default src;
}

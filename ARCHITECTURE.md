# Модульная архитектура сайта-портфолио

## 📁 Структура проекта

```
src/
├── core/                    # Ядро приложения
│   ├── index.ts            # Экспорты ядра
│   ├── config.ts           # Конфигурация приложения
│   ├── types.ts            # TypeScript типы и интерфейсы
│   ├── utils.ts            # Утилиты (математика, easing)
│   └── events.ts           # Менеджер событий (EventBus)
│
├── modules/                 # Основные модули
│   ├── index.ts            # Экспорты модулей
│   ├── base-module.ts      # Базовый класс для всех модулей
│   │
│   ├── renderer/           # Модуль рендеринга
│   │   └── renderer.ts     # WebGL рендерер, камера
│   │
│   ├── scene/              # Модуль 3D сцены
│   │   └── scene.ts        # Частицы, объекты, линии
│   │
│   ├── interaction/        # Модуль взаимодействия
│   │   └── interaction.ts  # Мышь, скролл, клавиатура
│   │
│   └── ui/                 # UI модули
│       ├── index.ts        # Экспорты UI
│       ├── navigation.ts   # Навигация, меню
│       ├── forms.ts        # Валидация и отправка форм
│       └── animations.ts   # Scroll-анимации, параллакс
│
├── main.ts                  # Точка входа, инициализация
└── style.css                # Глобальные стили
```

## 🏗 Архитектурные принципы

### 1. Разделение ответственности
Каждый модуль отвечает за свою область:
- **RendererModule** — WebGL контекст, камера, анимационный цикл
- **SceneModule** — 3D объекты, частицы, освещение
- **InteractionModule** — ввод пользователя (мышь, скролл, клавиатура)
- **NavigationModule** — навигационная панель, активные ссылки
- **FormModule** — валидация и отправка форм
- **AnimationModule** — DOM-анимации, появление элементов

### 2. Единая шина событий
Все модули общаются через `EventManager`:
```typescript
// Публикация
EventManager.emit('mouse:move', { x, y, normalizedX, normalizedY });

// Подписка
EventManager.on('scroll', (data) => {
  console.log('Scroll progress:', data.progress);
});
```

### 3. Жизненный цикл модулей
```typescript
interface Module {
  name: string;
  init(): void;      // Инициализация
  destroy?(): void;  // Очистка ресурсов
}
```

### 4. Базовый класс модуля
```typescript
abstract class BaseModule implements Module {
  protected initialized: boolean = false;
  
  abstract init(): void;
  
  destroy(): void {
    this.initialized = false;
  }
  
  protected debug(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(`[Module:${this.name}]`, ...args);
    }
  }
}
```

## 📦 Описание модулей

### Core Module

#### `config.ts`
Централизованная конфигурация:
```typescript
export const config: AppConfig = {
  app: { name: 'Portfolio', version: '1.0.0', debug: true },
  three: {
    particleCount: 150,
    particleColor: 0x64ffda,
    // ...
  },
  ui: { /* ... */ }
};

// Использование
import { getConfig, setConfig } from './config';
const count = getConfig('three.particleCount');
```

#### `types.ts`
Общие типы:
- `AppConfig`, `ThreeConfig`, `UIConfig`
- `MousePosition`, `ScrollState`, `Vector3`
- `EventType`, `CustomEventMap`
- `Module`, `RendererModule`, `SceneModule`

#### `utils.ts`
Утилиты:
- Математика: `lerp`, `clamp`, `distance`, `mapRange`
- Easing: `easeInQuad`, `easeOutCubic`, `easeInOutQuart`, и др.
- Векторы: `createVector3`, `normalizeVector3`

#### `events.ts`
EventBus с типами:
```typescript
type EventType = 'mouse:move' | 'scroll' | 'resize' | 'tick' | 'keydown';

interface CustomEventMap {
  'mouse:move': MousePosition;
  'scroll': ScrollState;
  'resize': { width: number; height: number };
  'tick': { delta: number; time: number };
  'keydown': { key: string; code: string };
}
```

### RendererModule

**Ответственность:** Создание и управление WebGL рендерером

```typescript
const renderer = new RendererModule('#webgl-canvas');
renderer.init();

// Добавление callback в анимационный цикл
renderer.addRenderCallback(() => {
  // Вызывается каждый кадр
});

// Доступ к API Three.js
const camera = renderer.getCamera();
const glRenderer = renderer.getRenderer();
```

### SceneModule

**Ответственность:** 3D сцена, объекты, анимации

```typescript
const scene = new SceneModule(camera, renderer);
scene.init();

// Рендер сцены
scene.render();

// Доступ к сцене
const threeScene = scene.getScene();
```

**Компоненты сцены:**
- Система частиц (150 частиц в сфере)
- Соединительные линии (между близкими частицами)
- Центральный объект (икосаэдр)
- Освещение (ambient + 2 point lights)

### InteractionModule

**Ответственность:** Обработка ввода пользователя

```typescript
const interaction = new InteractionModule();
interaction.init();

// Получение состояния
const mouse = interaction.getMousePosition();
const scroll = interaction.getScrollState();
```

**События:**
- Движение мыши → `mouse:move`
- Скролл → `scroll`
- Клавиши → `keydown`

### NavigationModule

**Ответственность:** Навигационная панель

**Функции:**
- Подсветка активной секции
- Плавный скролл к якорям
- Мобильное меню (бургер)
- Скрытие/показ при скролле

### FormModule

**Ответственность:** Управление формами

**Функции:**
- Автоматическая валидация
- Отображение ошибок
- Обратная связь при отправке

```typescript
// Валидация в реальном времени
input.addEventListener('blur', () => {
  formModule.validateField(input);
});
```

### AnimationModule

**Ответственность:** DOM-анимации

**Функции:**
- Scroll-анимации (IntersectionObserver)
- Параллакс эффекты
- Анимация счётчиков
- Плавный скролл

## 🔄 Поток данных

```
┌─────────────────────────────────────────────────────────┐
│                    Application (main.ts)                │
│  Инициализирует все модулей, управляет жизненным циклом │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌───────────────┐
│   Renderer    │  │  Interaction   │  │   UI Modules  │
│   Module      │  │   Module       │  │   (Nav, Form, │
│               │  │                │  │    Animation) │
└───────┬───────┘  └───────┬────────┘  └───────┬───────┘
        │                  │                   │
        └──────────────────┼───────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  EventManager  │
                  │  (EventBus)    │
                  └────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   Scene        │
                  │   Module       │
                  └────────────────┘
```

## 🚀 Использование

### Инициализация приложения
```typescript
// main.ts
const app = new Application();
app.init();
```

### Доступ к модулям
```typescript
const renderer = app.getModule<RendererModule>('renderer');
const scene = app.getModule<SceneModule>('scene');
```

### Отладка (в DEV режиме)
```typescript
// В консоли браузера
window.app.getStatus();
window.app.getModule('scene');
```

## 🎨 Добавление нового модуля

1. Создайте файл модуля:
```typescript
// modules/custom/custom-module.ts
import { BaseModule } from '../base-module';

export class CustomModule extends BaseModule {
  constructor() {
    super('Custom');
  }

  init(): void {
    if (this.initialized) return;
    // Инициализация
    this.initialized = true;
    this.debug('Initialized');
  }

  destroy(): void {
    // Очистка ресурсов
    super.destroy();
  }
}
```

2. Добавьте экспорт в `modules/index.ts`

3. Зарегистрируйте в `main.ts`:
```typescript
const custom = new CustomModule();
custom.init();
this.modules.set('custom', custom);
```

## 📝 Конфигурация

Изменение настроек:
```typescript
import { getConfig, setConfig } from './core/config';

// Получить
const count = getConfig('three.particleCount');

// Изменить
setConfig('three.particleCount', 200);
```

## 🛡 Безопасность и производительность

- **Cleanup:** Все модули освобождают ресурсы при `destroy()`
- **Passive listeners:** Скролл-обработчики с `{ passive: true }`
- **RequestAnimationFrame:** Анимации через RAF
- **Debounce/Throttle:** Частые события ограничены
- **IntersectionObserver:** Эффективное отслеживание видимости

---

## 🐳 Docker

### Структура Docker файлов

```
├── Dockerfile           # Multi-stage сборка
├── .dockerignore        # Исключения для Docker
├── nginx.conf           # Конфигурация nginx
└── docker-compose.yml   # Оркестрация контейнеров
```

### Стадии сборки

1. **builder** — сборка приложения на Node.js 20 Alpine
2. **production** — nginx:alpine со сжатыми статическими файлами
3. **development** — режим разработки с hot-reload

### Использование

#### Production сборка

```bash
# Сборка образа
docker build -t portfolio:latest .

# Запуск контейнера
docker run -d -p 8080:80 --name portfolio portfolio:latest

# Просмотр логов
docker logs -f portfolio

# Остановка
docker stop portfolio && docker rm portfolio
```

#### Development режим

```bash
# Запуск в режиме разработки
docker compose up dev

# С пересборкой
docker compose up dev --build
```

#### Production через docker compose

```bash
# Запуск production контейнера
docker compose up portfolio -d

# Просмотр статуса
docker compose ps

# Логи
docker compose logs -f portfolio
```

### Команды

```bash
# Сборка всех образов
docker compose build

# Запуск всех сервисов
docker compose up -d

# Остановка
docker compose down

# Пересборка и перезапуск
docker compose up -d --build

# Очистка (образы + контейнеры + volumes)
docker compose down --rmi all --volumes --remove-orphans
```

### Конфигурация nginx

- **Gzip сжатие** для JS, CSS, изображений
- **Кэширование** статических файлов (1 год)
- **SPA роутинг** — все запросы на `index.html`
- **Заголовки безопасности** (X-Frame-Options, X-Content-Type-Options)
- **Health check** — проверка доступности каждые 30с

### Переменные окружения

Создайте `.env` файл для конфигурации:

```env
NODE_ENV=production
PORT=8080
```

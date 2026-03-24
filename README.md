# Портфолио разработчика | Таня Мусаева

Интерактивное веб-портфолио с 3D-графикой на Three.js, построенное на Vue + TypeScript.

## 🚀 Технологии

- **Frontend:** TypeScript, Vite, Three.js, Postprocessing
- **Сборка:** Vite, Rollup
- **Контейнеризация:** Docker, Docker Compose
- **Деплой:** GitHub Pages, GitHub Actions

---

## 📋 Требования

- **Node.js** версии 20.x или выше
- **npm** версии 10.x или выше
- **Docker** и **Docker Compose** (для запуска в контейнере)

---

## 🔧 Локальный запуск

### 1. Установка зависимостей

```bash
npm ci
```

### 2. Запуск в режиме разработки

```bash
npm run dev
```

Проект откроется по адресу: **http://localhost:5173**

### 3. Сборка для продакшена

```bash
npm run build
```

Собранный проект появится в папке `dist/`.

### 4. Предварительный просмотр продакшен-сборки

```bash
npm run preview
```

---

## 🐳 Запуск в Docker

### Вариант 1: Production сборка (рекомендуется)

Запускает готовое приложение через nginx:

```bash
docker compose up portfolio --build
```

**Порт:** http://localhost:8080

### Вариант 2: Development режим

Запускает Vite dev-сервер с горячей перезагрузкой:

```bash
docker compose up dev --build
```

**Порт:** http://localhost:5173

Изменения в исходном коде автоматически применяются благодаря volume-монтированию.

### Остановка контейнеров

```bash
docker compose down
```

### Доступные сервисы

| Сервис      | Описание                  | Порт     |
|-------------|---------------------------|----------|
| `portfolio` | Production (nginx)        | 8080:80  |
| `dev`       | Development (Vite)        | 5173:5173|

---

## 📦 Скрипты

| Команда              | Описание                                    |
|----------------------|---------------------------------------------|
| `npm run dev`        | Запуск dev-сервера (Vite)                   |
| `npm run build`      | Сборка для продакшена                       |
| `npm run preview`    | Предпросмотр продакшен-сборки               |
| `npm run deploy`     | Сборка + деплой на GitHub Pages             |
| `npm run lint`       | Проверка и авто-исправление ESLint          |
| `npm run lint:check` | Проверка ESLint без исправлений             |
| `npm run format`     | Форматирование кода через Prettier          |
| `npm run format:check` | Проверка форматирования без изменений     |

---

## 🌐 Деплой на GitHub Pages

Автоматический деплой при пуше в ветку `main`:

```bash
git push origin main
```

Или ручной запуск через GitHub Actions → **Deploy to GitHub Pages** → **Run workflow**.

---

## 📁 Структура проекта

```
my-vue-app/
├── src/
│   ├── core/           # Базовые утилиты, конфиги, i18n
│   ├── modules/        # Модули приложения (сцена, рендерер, UI)
│   ├── assets/         # Статические ресурсы
│   ├── main.ts         # Точка входа
│   └── styles.css      # Глобальные стили
├── .github/workflows/  # GitHub Actions CI/CD
├── docker-compose.yml  # Docker Compose конфигурация
├── Dockerfile          # Multi-stage Docker сборка
├── nginx.conf          # Конфигурация nginx
├── vite.config.ts      # Конфигурация Vite
└── package.json        # Зависимости и скрипты
```

---

## 🔍 Проверка кода

### Линтинг

```bash
npm run lint:check    # Проверка
npm run lint          # Проверка + авто-исправление
```

### Форматирование

```bash
npm run format:check  # Проверка
npm run format        # Форматирование
```

---

## 📝 Лицензия

© 2026 Таня Мусаева. Все права защищены.

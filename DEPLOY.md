# 🚀 Деплой на GitHub Pages

## Способы деплоя

### Способ 1: Автоматический деплой через GitHub Actions (рекомендуется)

При пуше в ветку `main` проект автоматически деплоится на GitHub Pages.

**Настройка:**

1. В репозитории перейдите в **Settings** → **Pages**
2. В разделе **Build and deployment**:
   - **Source**: Выберите `GitHub Actions`
3. Сделайте пуш в ветку `main`
4. Workflow автоматически запустится и задеплоит проект

**URL после деплоя:**

```
https://<username>.github.io/<repository-name>/
```

### Способ 2: Ручной деплой через `gh-pages`

```bash
# Установка зависимостей
npm install

# Деплой одной командой
npm run deploy
```

Эта команда:

1. Соберёт проект (`npm run build`)
2. Опубликует папку `dist` в ветку `gh-pages`

**Настройка репозитория:**

1. Перейдите в **Settings** → **Pages**
2. В разделе **Source** выберите ветку `gh-pages`
3. Нажмите **Save**

## ⚙️ Конфигурация

### vite.config.ts

Измените базовый путь на имя вашего репозитория:

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/my-vue-app/' : '/',
  // ...
});
```

Замените `my-vue-app` на имя вашего репозитория.

### package.json

Скрипт для деплоя:

```json
{
  "scripts": {
    "deploy": "npm run build && npx gh-pages -d dist"
  }
}
```

## 📋 Чек-лист перед деплоем

- [ ] Измените `base` в `vite.config.ts` на имя репозитория
- [ ] Проверьте, что все пути к ассетам работают с `/` в начале
- [ ] Протестируйте сборку локально: `npm run build && npm run preview`
- [ ] Закоммитьте все изменения

## 🔍 Локальное тестирование перед деплоем

```bash
# Сборка проекта
npm run build

# Предпросмотр production сборки
npm run preview
```

Откройте `http://localhost:4173` и проверьте работу сайта.

## 🐛 Возможные проблемы

### 404 при загрузке страницы

**Причина:** Неправильный `base` в `vite.config.ts`

**Решение:** Установите правильное значение:

```typescript
base: '/<имя-репозитория>/',
```

### Не загружаются ассеты (CSS, JS, изображения)

**Причина:** Относительные пути вместо абсолютных

**Решение:** Vite автоматически обрабатывает пути при сборке. Убедитесь, что:

- Используете `import` для импортов в коде
- Пути в HTML начинаются с `/` или используют Vite алиасы

### Белый экран после деплоя

**Причина:** JavaScript ошибки в консоли

**Решение:**

1. Откройте консоль браузера (F12)
2. Проверьте ошибки
3. Убедитесь, что все импорты работают корректно

## 🔄 Обновление деплоя

После внесения изменений:

```bash
# Коммит и пуш изменений
git add .
git commit -m "Update: описание изменений"
git push origin main

# GitHub Actions автоматически задеплоит изменения
```

## 📊 Структура workflow

```
.github/workflows/deploy.yml
├── on: push to main        # Триггер
├── jobs:
│   ├── build              # Сборка
│   └── deploy             # Деплой
```

Workflow:

1. Проверяет код из репозитория
2. Устанавливает Node.js 20
3. Устанавливает зависимости
4. Собирает проект
5. Загружает артефакт
6. Деплоит на GitHub Pages

## 🎯 Быстрый старт

```bash
# 1. Инициализация репозитория
git init
git add .
git commit -m "Initial commit"

# 2. Создание удалённого репозитория
# Создайте репозиторий на GitHub и добавьте remote
git remote add origin https://github.com/<username>/<repo>.git

# 3. Изменение base пути
# Откройте vite.config.ts и замените 'my-vue-app' на имя репозитория

# 4. Пуш в main
git branch -M main
git push -u origin main

# 5. Включаем GitHub Pages в Settings → Pages → GitHub Actions
```

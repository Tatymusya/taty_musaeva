# ESLint + Prettier

Настроенная конфигурация для TypeScript и CSS.

## 📦 Установленные пакеты

- **ESLint 10** - статический анализ кода
- **Prettier 3** - форматирование кода
- **typescript-eslint** - правила для TypeScript
- **eslint-config-prettier** - отключение конфликтов между ESLint и Prettier

## 🚀 Команды

```bash
# Проверка и исправление TypeScript файлов
npm run lint

# Только проверка (без исправлений)
npm run lint:check

# Форматирование всех файлов (ts, css, md, json)
npm run format

# Только проверка форматирования
npm run format:check
```

## 📝 Конфигурационные файлы

| Файл               | Описание                              |
| ------------------ | ------------------------------------- |
| `eslint.config.js` | Конфигурация ESLint (Flat Config)     |
| `.prettierrc.json` | Конфигурация Prettier                 |
| `.prettierignore`  | Игнорируемые для Prettier файлы       |
| `.eslintignore`    | Игнорируемые для ESLint файлы         |
| `.editorconfig`    | Единый стиль кода для всех редакторов |

## ⚙️ Настройки Prettier

- `semi: true` - точки с запятой в конце строк
- `singleQuote: true` - одинарные кавычки
- `printWidth: 100` - макс. длина строки 100 символов
- `tabWidth: 2` - отступ 2 пробела
- `trailingComma: es5` - запятые в конце списков (как в ES5)

## 📋 Правила ESLint

### TypeScript

- `@typescript-eslint/no-unused-vars` - предупреждение о неиспользуемых переменных
- `@typescript-eslint/no-explicit-any` - предупреждение для `any`
- `@typescript-eslint/no-empty-function` - предупреждение для пустых функций
- `@typescript-eslint/no-empty-object-type` - предупреждение для пустых объектов

### Общие

- `no-console` - предупреждение для `console.log` (разрешены `log`, `warn`, `error`)
- `no-debugger` - предупреждение для `debugger`
- `prefer-const` - предпочитать `const` вместо `let`
- `no-var` - запрещать `var`

## 💻 VS Code

После открытия проекта VS Code предложит установить рекомендуемые расширения:

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

### Автоформатирование при сохранении

В `.vscode/settings.json` настроено автоформатирование:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## 🎯 Примеры нарушений

```typescript
// ❌ Нарушение: any
const data: any = getData();

// ✅ OK: unknown
const data: unknown = getData();

// ❌ Нарушение: var
var count = 0;

// ✅ OK: const/let
const count = 0;

// ❌ Нарушение: неиспользуемая переменная
const unused = 5;

// ✅ OK: префикс _ игнорируется
const _unused = 5;
```

## 🔧 Отключение правил (если нужно)

```typescript
// Отключить для следующей строки
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getData();

// Отключить для блока
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = getData();
/* eslint-enable @typescript-eslint/no-explicit-any */

// Отключить для всего файла (в начале файла)
/* eslint-disable @typescript-eslint/no-explicit-any */
```

## 🐛 Решение проблем

### ESLint работает медленно

ESLint с проверкой типов может работать медленно. Для ускорения:

1. Убедитесь, что `node_modules` и `dist` в `.eslintignore`
2. Используйте `--cache` для кэширования:
   ```bash
   npx eslint . --cache --fix
   ```

### Конфликты между ESLint и Prettier

Если возникают конфликты, убедитесь, что `eslint-config-prettier` подключён последним в конфиге.

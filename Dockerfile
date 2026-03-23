# Dockerfile для сайта-портфолио
# Multi-stage сборка для оптимизации размера образа

# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

# Установка рабочей директории
WORKDIR /app

# Копирование package файлов для кэширования зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка проекта
RUN npm run build

# ==========================================
# Stage 2: Production
# ==========================================
FROM nginx:alpine AS production

# Копирование кастомной конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копирование собранного приложения из builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Экспорт порта
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]

# ==========================================
# Stage 3: Development
# ==========================================
FROM node:20-alpine AS development

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка всех зависимостей (включая dev)
RUN npm ci

# Копирование исходного кода
COPY . .

# Экспорт порта для Vite
EXPOSE 5173

# Запуск в режиме разработки
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

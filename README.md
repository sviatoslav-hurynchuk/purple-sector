# F1 Data Hub 🏎️

Інтерактивна аналітична платформа для Формули 1, побудована на Node.js + Next.js.

## Стек

| Шар | Технологія |
|-----|-----------|
| Backend | Node.js + Express.js + TypeScript |
| Frontend | Next.js (App Router) + TypeScript |
| Package Manager | pnpm (workspaces monorepo) |
| APIs | [Jolpica F1](https://api.jolpi.ca/ergast/f1/) · [OpenF1](https://api.openf1.org/v1/) |

## Структура проєкту

```
f1-data-demo/
├── packages/
│   ├── backend/     # Express API (port 3001)
│   └── frontend/    # Next.js app (port 3000)
├── package.json
└── pnpm-workspace.yaml
```

## Запуск

```bash
# Встановити залежності
pnpm install

# Запустити обидва сервери паралельно
pnpm dev

# Або окремо
pnpm dev:backend
pnpm dev:frontend
```

## API Endpoints (Backend)

| Method | Path | Опис |
|--------|------|------|
| GET | `/api/health` | Health check |
| GET | `/api/standings/drivers` | Залік пілотів |
| GET | `/api/standings/constructors` | Залік конструкторів |
| GET | `/api/races/:season` | Список гонок сезону |
| GET | `/api/races/:season/:round` | Деталі гонки |

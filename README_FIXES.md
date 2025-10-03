# Dossier Manager — Fixed

## Что исправил
- Убрал сломанные импорты и троеточия в исходниках.
- Переписал фильтры на вкладке **Список** — теперь не падают на пустых значениях и неполных данных.
- Стабильные UI-примитивы (button, input, select, switch и т.д.).
- Три режима просмотра: карточки / таблица / фотостена.
- Добавил бэкенд (Express + SQLite) с CRUD `/api/people` и автоинициализацией.

## Запуск локально
```bash
# в корне проекта
npm install
cd server && npm install && cd ..
npm run server          # запустит API на 8787
npm run dev             # запустит Vite (http://localhost:5173)
# или: npm run start    # API и Vite параллельно (нужен npm-run-all)
```

## Деплой
- Подходит любой Node-хостинг. Для Vercel — вынос API в vercel functions или выделенный сервер/Render.
- БД по умолчанию — `server/db.sqlite`. Для продакшена рекомендуется Postgres (например, Supabase).

## Структура API
- `GET /api/ping` — healthcheck
- `GET /api/people` — список
- `POST /api/people` — создать (тело = объект человека)
- `PUT /api/people/:id` — обновить часть полей
- `DELETE /api/people/:id` — удалить

Фронтенд сам переключается: если API недоступен — хранит в `localStorage`.
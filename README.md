# Dossier — Vercel Ready (Next.js + Vercel Postgres + Vercel Blob)

## Локально
```bash
npm i
npm run dev
```
Создай `.env.local` на основе `.env.example` и задай:
- `POSTGRES_URL` — из Vercel Postgres
- `BLOB_READ_WRITE_TOKEN` — токен Vercel Blob (Read/Write)

## Деплой на Vercel
1. Импортируй репозиторий в Vercel → добавь Postgres и Blob в Project → Storage.
2. В `Environment Variables` добавь `POSTGRES_URL` и `BLOB_READ_WRITE_TOKEN`.
3. Deploy. Схема создастся автоматически на первом запросе.

## API
- `GET /api/people` — список
- `POST /api/people` — создать
- `GET /api/people/:id` — досье + факты + истории
- `PUT /api/people/:id` — обновить
- `DELETE /api/people/:id` — удалить
- `POST /api/upload` — загрузка фото → Vercel Blob (public)
- `POST/GET /api/people/:id/facts`, `DELETE /api/facts/:fid`
- `POST/GET /api/people/:id/stories`, `DELETE /api/stories/:sid`

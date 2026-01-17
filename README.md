## Environment Variables

Створіть файл `.env` на основі `.env.example`:

- `DATABASE_URL` - PostgreSQL connection string
- `API_KEY` - Secret API key for server-side API protection
- `NEXT_PUBLIC_API_KEY` - Public API key for client-side requests (should match API_KEY)

## Database Setup

1. Створіть базу даних PostgreSQL
2. Запустіть міграції:sh
   npm run db:push
   # або
   npm run db:migrate
   
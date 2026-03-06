# Frontend

Next.js frontend for the PM2230 dashboard.

## Development

Run the frontend dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

The backend API runs separately on `http://localhost:8003`.

## Production Build

Create a static export:

```bash
npm run build
```

The exported site is written to `frontend/out` and then copied into
`backend/dist/frontend_web` by the root build scripts so the backend can serve
the dashboard directly.

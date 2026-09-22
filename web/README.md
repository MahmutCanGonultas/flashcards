# Kelimece — web

The React 19 + Vite client. See the [root README](../README.md) for the full picture.

```bash
npm install
npm run dev      # http://localhost:5173, talks to the API on :3000
npm run build    # production build + service worker (dist/)
npm run lint
```

`VITE_API_URL` points the client at a deployed API; without it the dev server uses `http://localhost:3000/api/v1`.

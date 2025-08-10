# Deploy to Netlify (Zero-Code)

This project is a **Vite + Tailwind** app. To deploy with automatic builds:

1) Push this folder to **GitHub** (you can upload via the GitHub web UI).
2) In **Netlify**: New site → **Import from Git** → select your repo.
3) Build command: `npm ci && npm run build`
4) Publish directory: `dist`
5) Deploy.

Already included:
- `netlify.toml` with SPA redirects
- `public/_redirects` for client-side routing

For environment variables: Netlify → Site settings → Environment variables → add any `VITE_*` variables.

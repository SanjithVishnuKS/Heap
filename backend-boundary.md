# Production Backend Boundary

The current app is intentionally local-first. Before production, add a server-side backend with:

- Authentication and per-user authorization
- Durable thoughts with ISO timestamps and row-level security
- Embedding generation and vector search
- AI answers that cite thought IDs and source text
- Rate limits, request logging without raw thought content, and provider timeout handling
- Account deletion and export endpoints

Supabase is a practical implementation choice for auth, Postgres, pgvector, and edge functions. Do not place provider API keys in `src/` or ship them in browser bundles.

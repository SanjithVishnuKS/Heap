# Heap

Heap is a local-first beta prototype for the no-folders note-taking premise: capture anything, then ask for it later in natural language.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Captures and beta metrics persist in the browser with `localStorage`.

## What is implemented

- Frictionless capture dock with no title, folder, or tagging step
- Today and Everything views
- Natural-language-style retrieval using transparent keyword scoring
- Evidence labels on matching thoughts to make retrieval trust testable
- A small “signal” prompt to encourage asking behavior
- First-run onboarding prompt for the cold-start moment
- Plain-text export for trust and portability
- Weekly “Still here” reminder for an older untouched thought
- Beta pulse metrics for captures and asks
- Local event log for `capture_made`, `ask_made`, and `digest_viewed`
- Responsive desktop and mobile layout
- Cmd/Ctrl+N keyboard capture shortcut
- Install prompt when the browser supports PWA installation

This is intentionally a prototype. Data and event tracking currently stay in the browser. Production AI retrieval should move into a server-side endpoint with embeddings, source citations, authentication, encrypted storage, and error logging before inviting real users. The weekly reminder is date-aware locally and selects thoughts that have been untouched for at least seven days.

## Cloud handoff

The `supabase/` directory contains a migration with per-user row-level security, pgvector storage, and a protected `ask` edge-function boundary. Run the migration in a Supabase project, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only for the client, and store model-provider secrets in Supabase project secrets. The checked-in edge function intentionally returns HTTP 501 until embedding generation is configured, so the prototype cannot silently present fake AI answers.

## Publish the current prototype

The included `vercel.json` is ready for a Vite deployment. Push this folder to GitHub, import it into Vercel, and deploy with the default settings. The build command is `npm run build` and the output directory is `dist`. The same settings work in Netlify or Cloudflare Pages. This publishes the local-first beta only; complete the cloud handoff before accepting sensitive user data.

## Market scan

- [Reflect](https://reflect.app/) combines frictionless capture, backlinks, AI assistance, voice notes, web clipping, and end-to-end encryption. Heap can stay simpler and make “never organize” the primary behavior.
- [Capacities](https://capacities.io/) uses daily notes, typed objects, and connections to avoid folders. It is a strong adjacent product, but it still introduces an object model; Heap should delay that complexity during the beta.
- [Tana](https://tana.inc/) is now focused on collaborative meetings, agents, and a context graph. Its earlier outliner product is adjacent, but Heap is more personal and deliberately unstructured.
- Other adjacent alternatives include Mem, Evernote AI, Notion AI, MyMind, and Apple Notes with search. The differentiator is not “AI notes”; it is measuring whether people capture without organizing and return specifically to ask.

## Publish path

1. Create a Git repository and add environment handling before any secret is used.
2. Host the static prototype on Vercel, Netlify, or Cloudflare Pages by importing the repository and using `npm run build` with output directory `dist`.
3. For production, add a backend database and authentication, then keep model API keys server-side. Supabase is a practical first choice for auth, Postgres, and row-level security.
4. Add privacy policy, terms, data export/delete, consent for AI processing, and a support contact before a public beta.
5. Invite 5–8 testers with a private link. Record captures/day, asks/week, day-7 return, and retrieval trust exactly as defined in `beta-test-plan.md`.
6. For a mobile app, ship the responsive web app as a PWA first. A native iOS or Android wrapper can follow once the beta proves the loop.

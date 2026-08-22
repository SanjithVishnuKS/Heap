# Heap

Heap is a local-first beta prototype for the no-folders note-taking premise: capture anything, then ask for it later in natural language.

## Visual direction

Heap uses a “Coastal Morning” palette: seafoam and misty blue create a calm base, deep teal carries readable structure, coral marks action, and amber highlights signals. The direction follows Figma’s guidance on color harmony, hierarchy, complementary contrast, and accessibility. Reference: [Figma color combinations](https://www.figma.com/resource-library/color-combinations/).

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Captures and beta metrics persist in the browser with `localStorage`.

## What is implemented

- Calendar workspace with local date-based time blocks and durations

This is intentionally a prototype. Data and event tracking currently stay in the browser. Production AI retrieval should move into a server-side endpoint with embeddings, source citations, authentication, encrypted storage, and error logging before inviting real users. The weekly reminder is date-aware locally and selects thoughts that have been untouched for at least seven days.

## Cloud handoff

The `supabase/` directory contains a migration with per-user row-level security, pgvector storage, and a protected `ask` edge-function boundary. Run the migration in a Supabase project, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only for the client, and store model-provider secrets in Supabase project secrets. The checked-in edge function intentionally returns HTTP 501 until embedding generation is configured, so the prototype cannot silently present fake AI answers.

The `ask` function now uses `text-embedding-3-small` for query embeddings and `gpt-4o-mini` for concise source-grounded answers. Activate it with `supabase secrets set OPENAI_API_KEY=...` and `supabase functions deploy ask` after enabling Supabase Auth and syncing captured thoughts into `public.thoughts`. Until a signed-in sync path is connected, the browser continues to use the local retrieval fallback.

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, the sidebar enables passwordless email sign-in. Signed-in users load cloud thoughts, upload local thoughts into an empty cloud heap, and sync new, edited, or deleted thoughts. Without those variables, Heap remains fully local.

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

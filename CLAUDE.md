# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DC Signal — PWA news digest personalizado con diseño Apple News. Busca noticias via Anthropic web_search y las cachea en Supabase.

## Commands

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

- **Next.js 14 App Router** with TypeScript and Tailwind CSS
- **Supabase** for persistence (categories + news_items tables)
- **Anthropic SDK** with `web_search_20250305` tool for news fetching
- Client-side rendering (`"use client"`) for the feed and admin pages
- API route `/api/refresh` handles all Anthropic calls server-side (API key never exposed to browser)

### Key files

- `src/lib/supabase.ts` — Supabase client (uses NEXT_PUBLIC_ env vars)
- `src/lib/types.ts` — Shared TypeScript interfaces
- `src/app/api/refresh/route.ts` — POST handler: fetches news for all active categories via Anthropic web_search, saves to Supabase
- `src/app/page.tsx` — Main feed with tabbed categories, skeleton loaders, 4h cache logic
- `src/app/admin/page.tsx` — Category CRUD (toggle, edit, delete, add)
- `src/app/manifest.ts` — PWA manifest for iOS Add to Home Screen

### Cache logic

Feed checks `fetched_at` freshness (4h window) on load. If stale or empty, triggers `/api/refresh` automatically. Manual refresh always available via header button.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `ANTHROPIC_API_KEY` — Server-side only, used in /api/refresh

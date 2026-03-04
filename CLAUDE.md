# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # Install dependencies
npm run dev    # Start development server (Vite)
npm run build  # Production build (also serves as type-check)
```

No test runner is configured. Run `npm run build` after every change to verify no TypeScript or build errors.

---

## Current Phase: Phase 2A — Roles & Members

Active work: workspace settings page, members management, role assignment, invite flow, channel visibility controls.

---

## Completed Phases

- **Phase 0+1:** Full UI shell + Supabase auth (sign in, sign up, protected routes) + real messages loaded from and sent to Supabase per channel.
- **Phase 1.5:** Color system overhaul, sidebar rebuild with collapsible categories, channel settings dropdown, focus mode, DND toggle, unread indicators, inactive section styling.
- **Phase 2A-1:** Settings page (`/settings`) with navigation layout and MembersPanel showing a members table with owner row.
- **Phase 2A-2:** Real members loaded from DB, search, loading state, role dropdown, toast feedback, remove member confirmation dialog.

---

## Architecture

FlowTalk is a **real Slack alternative** backed by Supabase. There is no mock/hardcoded backend — auth, messages, and workspace data all go through Supabase.

**Entry point:** `src/main.tsx` → `AuthProvider` → `RouterProvider` → `src/routes.tsx`

**Routes** (`src/routes.tsx`):
- `/` → `src/app/App.tsx` — main chat layout (protected)
- `/settings` → `src/pages/Settings.tsx` — workspace settings (protected)
- `/signin`, `/signup`, `/forgot-password`, `/reset-password`, `/loading` → auth pages in `src/pages/auth/`

**Main chat layout** (`App.tsx`) is a horizontal flex row of four columns:
- `LeftRail` — narrow icon rail (workspace switcher, nav icons, user avatar). Dark `#1a1d21` background.
- `Sidebar` (`w-60`) — collapsible category sections (Favorites, Channels, DMs), channel list with unread indicators, DND/focus toggles. Background `#F7F8FA`.
- `ChatArea` (`flex-1`) — channel header, message list loaded from Supabase, message compose box. Opens `SearchModal` overlay.
- `RightPanel` (`w-80`) — tabbed panel: AI Analyzer, My Tasks, Files & links.

**Settings layout** (`Settings.tsx`) — sidebar nav on the left, panel on the right. Currently has `MembersPanel` for workspace member management.

**Key lib files:**
- `src/lib/supabase.ts` — Supabase client (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` from `.env`)
- `src/lib/AuthContext.tsx` — `AuthProvider` + `useAuth()` hook exposing `{ session, loading }`

---

## Database (Supabase)

| Table | Key columns |
|---|---|
| `profiles` | `id`, `full_name`, `email`, `avatar_url`, `role` |
| `channels` | `id`, `name`, `type`, `category`, `is_active`, `last_message_at`, `created_by` |
| `messages` | `id`, `channel_id`, `user_id`, `content`, `created_at` |
| `workspace_members` | `id`, `user_id`, `role`, `invited_by`, `joined_at`, `invite_status` |
| `channel_visibility` | `id`, `channel_id`, `user_id`, `can_view`, `can_write`, `set_by` |
| `workspace_invites` | `id`, `email`, `token`, `role`, `invited_by`, `expires_at`, `accepted_at` |

---

## Tech Stack

- **React 18** + **TypeScript** via Vite 6
- **Supabase** (`@supabase/supabase-js`) — auth, database, realtime
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin; configured in `tailwind.css` with `source(none)` + explicit `@source` glob)
- **shadcn/ui** in `src/app/components/ui/` (Radix UI primitives + `class-variance-authority` + `tailwind-merge`)
- **lucide-react** for icons — the only icon library in use
- **react-router** (`createBrowserRouter`) for client-side routing
- **motion** (Framer Motion v12), **react-dnd**, **recharts** installed but not yet wired up

---

## Design System

| Token | Value |
|---|---|
| Primary | `#4d298c` |
| Border | `#E5E7EB` |
| Sidebar bg | `#F7F8FA` |
| Text primary | `#111827` |
| Lime / online / success | `#d7f78b` |
| Font | Inter |

CSS is loaded via `src/styles/index.css` → `fonts.css`, `tailwind.css`, `theme.css`.
All design tokens are CSS variables in `theme.css`, exposed to Tailwind via `@theme inline`.
The `@` path alias resolves to `src/`.

Do **not** add `.css`, `.tsx`, or `.ts` files to `vite.config.ts`'s `assetsInclude` — only SVG and CSV raw imports are allowed there.

---

## Rules

- **Build must pass** after every change — run `npm run build` to verify.
- **No blue colors anywhere** — use the primary purple (`#4d298c`) and the defined color system only.
- **No emojis as icons** — use `lucide-react` icons exclusively.
- **All transitions:** `transition-all duration-150`
- **Use the existing color system strictly** — do not introduce ad-hoc hex values or Tailwind color classes outside the design tokens.

---

## Common Mistakes to Avoid

**React UMD / "React is not defined" errors:** Fix by setting `"jsx": "react-jsx"` in `tsconfig.json` (under `compilerOptions`). Never fix this by adding `import React from 'react'` to component files — that is the wrong solution.

**TypeScript errors blocking build:** `npm run build` is the type-checker. Fix all errors before considering a task done.

**Supabase env vars:** Must be prefixed `VITE_` to be available in the browser bundle. Never access `process.env` directly — use `import.meta.env`.

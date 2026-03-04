# FlowTalk — Claude Code Context

## Commands
npm i          # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build (must pass after every change)

## Project
Real Slack alternative. NOT a static prototype. Full Supabase backend.

## Completed Phases
- Phase 0+1: Full UI + Supabase auth (sign in/up/out) + real messages in DB + protected routes
- Phase 1.5: Inter font, color system (#4d298c throughout), sidebar rebuild with collapsible categories, channel settings dropdown, focus mode toggle, DND toggle, unread indicators per channel, mute per channel, inactive section
- Phase 2A-1: workspace_members + channel_visibility + workspace_invites tables with RLS, workspace name dropdown in sidebar, Settings page at /settings with left nav layout
- Phase 2A-2: MembersPanel — real members from DB, loading skeleton, search, role badges, Manage button

## In Progress
- Phase 2A: fixing members fetch (currently returns empty), role dropdown, remove member, invite flow, channel visibility panel

## Upcoming
- Phase 2B: Message threading (right panel), pinning, search
- Phase 2C: Notifications — @mentions, DM unread, inbox
- Phase 2D: Custom status
- Phase 3+4: AI features, file storage, push notifications, multi-workspace

## Architecture
Entry: src/main.tsx → AuthProvider → RouterProvider → src/routes.tsx
Routes:
- / → src/app/App.tsx (protected)
- /settings → src/pages/Settings.tsx (protected)
- /signin /signup /forgot-password /reset-password → src/pages/auth/

Main layout (App.tsx): LeftRail | Sidebar (w-60, #F7F8FA) | ChatArea (flex-1) | RightPanel (w-80)
Settings layout (Settings.tsx): left nav 200px | right content panel

## Database Tables (Supabase)
- profiles: id, full_name, email, avatar_url, role
- channels: id, name, type, category, is_active, last_message_at, created_by
- messages: id, channel_id, user_id, content, created_at
- workspace_members: id, user_id, role, invited_by, joined_at, invite_status
- channel_visibility: id, channel_id, user_id, can_view, can_write, set_by
- workspace_invites: id, email, token, role, invited_by, expires_at, accepted_at

## Key Files
- src/app/components/Sidebar.tsx — sidebar with categories, focus mode, DND, unread
- src/app/App.tsx — main layout, passes props to Sidebar and ChatArea
- src/pages/Settings.tsx — workspace settings with MembersPanel
- src/lib/supabase.ts — Supabase client (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- src/lib/AuthContext.tsx — AuthProvider + useAuth() → { session, loading }
- src/routes.tsx — all routes including protected /settings

## Tech Stack
- React 18 + TypeScript via Vite 6
- Supabase (@supabase/supabase-js) — auth, database, realtime
- Tailwind CSS v4 (via @tailwindcss/vite)
- lucide-react — only icon library
- react-router (createBrowserRouter)
- CSS tokens in src/styles/theme.css, @ alias resolves to src/

## Design System
- Primary: #4d298c
- Border: #E5E7EB
- Sidebar bg: #F7F8FA
- Text: #111827
- Lime (online/success): #d7f
- Icons: lucide-react ONLY — never emojis as icons ever

## Rules
- Build must pass after every change (npm run build)
- No blue colors anywhere — use #4d298c
- No emojis as icons — lucide-react only
- Transitions: transition-all duration-150
- Never introduce colors outside the design system

## Common Mistakes
- React "not defined" error: set "jsx": "react-jsx" in tsconfig.json — never add import React
- Supabase env vars must be prefixed VITE_ — never use process.env
- Build errors must be fixed before task is done
- Do not add .css/.tsx/.ts to vite.config.ts assetsInclude
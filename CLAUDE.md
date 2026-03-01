# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # Install dependencies
npm run dev    # Start development server (Vite)
npm run build  # Production build
```

No test runner is configured in this project.

## Architecture

This is a **static UI prototype** of the FlowTalk team chat app, generated from a Figma design. All data is hardcoded; there is no backend.

**Entry point:** `src/main.tsx` → `RouterProvider` → `src/routes.tsx`

**Routes** (`src/routes.tsx`):
- `/` → `src/app/App.tsx` — main chat layout
- `/signin`, `/signup`, `/forgot-password`, `/reset-password`, `/loading` → auth pages in `src/pages/auth/`

**Main chat layout** (`App.tsx`) is a horizontal flex row of four columns:
- `LeftRail` — narrow icon rail (workspace switcher, nav icons, user avatar). Dark `#1a1d21` background.
- `Sidebar` (`w-60`) — collapsible sections: Favorites, Channels, Direct Messages. Light `#f8f9fa` background.
- `ChatArea` (`flex-1`) — channel header, message list with hardcoded messages, message compose box. Opens `SearchModal` overlay.
- `RightPanel` (`w-80`) — tabbed panel with AI Analyzer, My Tasks, and Files & links tabs.

**`SearchModal`** — full-screen overlay triggered from the ChatArea header. Filters a hardcoded `allResults` array by query string.

**`figma/ImageWithFallback`** — utility wrapper for `<img>` that shows a placeholder SVG on load error.

**Auth pages** (`src/pages/auth/`) use `AuthLayout` (two-column: form left, branding panel right; right panel hidden on mobile). Shared auth form styles are in `authStyles.ts`. `AuthBrandingPanel` and `FlowTalkLogo` live in `src/app/components/` alongside the main layout components.

## Tech Stack

- **React 18** + **TypeScript** via Vite 6
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin; configured in `tailwind.css` with `source(none)` + explicit `@source` glob)
- **shadcn/ui** components in `src/app/components/ui/` (Radix UI primitives + `class-variance-authority` + `tailwind-merge`)
- **lucide-react** for icons; **MUI** (`@mui/material`) also installed but not used by current components
- **react-router** (`createBrowserRouter`) is wired up for client-side routing
- **motion** (Framer Motion v12), **react-dnd**, **recharts** are installed but not yet wired up

## Styling

CSS is loaded via `src/styles/index.css` which imports:
1. `fonts.css` — font-face declarations
2. `tailwind.css` — Tailwind v4 setup with `tw-animate-css`
3. `theme.css` — CSS custom properties for the design tokens (colors, radius, sidebar, dark mode via `.dark` class) and base typography

All design tokens are defined as CSS variables in `theme.css` and exposed to Tailwind via `@theme inline`. The `@` path alias resolves to `src/`.

Do **not** add `.css`, `.tsx`, or `.ts` files to `vite.config.ts`'s `assetsInclude` — only SVG and CSV raw imports are supported there.

## Data

All data (messages, tasks, files, search results) is **hardcoded** in the component files. There is no state management library, API layer, or persistence.

## Common Mistakes to Avoid

**React UMD / "React is not defined" errors:** Fix by setting `"jsx": "react-jsx"` in `tsconfig.json` (under `compilerOptions`). Never fix this by adding `import React from 'react'` to component files — that is the wrong solution.

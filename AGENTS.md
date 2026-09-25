# AGENTS.md

Guidance for agentic coding agents working in this repository.

## Project Overview

CC Lab is a research lab website for Structural Bioinformatics & Molecular Dynamics at XJTLU. Built with React 18, TypeScript (strict), Vite 5, Tailwind CSS v4, and Framer Motion. Deployed on Netlify with HashRouter for static hosting compatibility. Content is managed through JSON files in `public/data/` and optionally via Decap CMS at `/admin/`.

---

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Type-check + production build → dist/
npm run preview   # Serve the production build locally
```

**There are no test, lint, or format commands.** TypeScript strict mode enforced at build time is the primary correctness gate. A clean `npm run build` is the equivalent of "passing CI".

- To verify a change: `npm run build`
- To run a "single test": there is no test runner — validate with `npm run build` and manual inspection in `npm run dev`
- Node.js v18+ required

---

## Directory Structure

```
/
├── index.html              # App shell; loads Inter font, Material Symbols, Netlify Identity
├── index.tsx               # React entry point
├── App.tsx                 # HashRouter, routes, BreadcrumbProvider, preloadAllData()
├── components/             # All page and UI components (NOT inside src/)
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Breadcrumb.tsx
│   ├── Home.tsx, Hero.tsx, RecentPosts.tsx
│   ├── Member.tsx, Research.tsx, Publication.tsx
│   ├── Resources.tsx, News.tsx, Contact.tsx
│   └── Team.tsx            # Legacy/unused static page
├── src/
│   ├── index.css           # Tailwind v4 import + @theme{} custom tokens
│   ├── context/
│   │   └── BreadcrumbContext.tsx
│   └── lib/
│       ├── dataLoader.ts   # All TypeScript interfaces + typed fetch loaders + cache
│       └── utils/
│           └── bibtexParser.ts
├── public/
│   ├── data/               # JSON content files (members, publications, news, etc.)
│   ├── assets/images/      # people/, papers/, posts/ subdirs
│   └── admin/              # Decap CMS files
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
└── netlify.toml
```

**Important:** Component files live at the root level in `components/`, not inside `src/`. The `src/` directory contains only CSS, context, and lib utilities.

---

## TypeScript

**Config:** `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`, `noEmit: true` (Vite transpiles; tsc is type-check only), `moduleResolution: "bundler"`.

- **All type/interface definitions** for data models live in `src/lib/dataLoader.ts` — never create duplicate type definitions elsewhere.
- Import types from `dataLoader.ts`: `Member`, `Publication`, `NewsItem`, `ContactInfo`, `LabInfo`, `IconName`, `ResearchDirection`, `ResearchProject`, `ResearchData`, `ResourceTool`, `ResourcesData`
- `loadMembers()` returns `{ PI, MEMBERS, ALUMNI }` — the JSON keys are lowercase (`pi`, `members`, `alumni`) but the loader normalises them to uppercase
- `loadNews()` returns `NewsItem[]` directly — **not** `{ items: NewsItem[] }`. Do not call `.items` on the result
- `ResearchData.projects` is optional (`projects?: ResearchProject[]`) — the Current Projects section has been removed from the Research page
- Use explicit generic typing: `React.useState<ResearchData | null>(null)`
- Do **not** use `any` unless wrapping an untyped third-party return (e.g., the in-memory cache in `dataLoader.ts` uses `Record<string, any>`)
- All unused variables and parameters are compile errors — remove or prefix with `_`

---

## Code Style

### Imports

```tsx
// 1. React (always first)
import React from 'react';
// 2. Third-party libraries
import { motion } from 'framer-motion';
import { Brain, LucideIcon } from 'lucide-react';
// 3. Internal context/hooks
import { useBreadcrumb } from '../src/context/BreadcrumbContext';
// 4. Internal lib/types
import { loadResearch, ResearchData, IconName } from '../src/lib/dataLoader';
```

- Use named imports, not default imports, for lucide-react icons and dataLoader exports
- Relative paths from `components/` to `src/` use `../src/...`

### Components

```tsx
// PascalCase filename, React.FC type annotation, named export
export const Research: React.FC = () => {
  // ...
};
```

- Always annotate with `React.FC` (no props type inline on the function)
- Use `React.useState`, `React.useEffect`, `React.useContext` (namespaced, not destructured imports in most files)

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Component files | PascalCase `.tsx` | `Research.tsx`, `Navbar.tsx` |
| Utility/lib files | camelCase `.ts` | `dataLoader.ts`, `bibtexParser.ts` |
| Interfaces/Types | PascalCase | `ResearchData`, `BreadcrumbItem` |
| Type union aliases | PascalCase | `IconName` |
| Constants (module-level) | UPPER_SNAKE_CASE | `NAV_LINKS`, `MONTH_NAMES` |
| Component exports | named, PascalCase | `export const Member: React.FC` |
| JSON data keys | camelCase (preferred) | `bibtexKey`, `eprintType` |

### Data Loading Pattern

All data fetching uses the loader functions from `src/lib/dataLoader.ts`. **Never import JSON files directly.**

```tsx
const [data, setData] = React.useState<ResearchData | null>(null);
const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
  loadResearch()
    .then(setData)
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

Always handle both loading and error/null states before rendering data:

```tsx
if (loading) {
  return <div className="min-h-screen pt-20"><div className="animate-pulse text-slate-500">Loading...</div></div>;
}
if (!data) {
  return <div className="min-h-screen pt-20"><div className="text-slate-500">Failed to load data.</div></div>;
}
```

### Breadcrumbs

Every page component sets breadcrumbs in `useEffect`. Home clears them with `[]`.

```tsx
const { setBreadcrumbs } = useBreadcrumb();
React.useEffect(() => {
  setBreadcrumbs([{ label: 'Research' }]);
}, [setBreadcrumbs]);
```

### Error Handling

- Async data loaders: `.catch(console.error)` at call site; the loader in `dataLoader.ts` logs and re-throws
- Utility functions (e.g., `bibtexParser.ts`): `try/catch` per entry, errors collected into a `ParseResult.errors[]` array — do not swallow errors silently
- Context guards: custom hooks throw a descriptive `Error` if used outside their provider

---

## Styling

**Tailwind CSS v4** — no `tailwind.config.js`. Theme tokens are defined in `src/index.css`:

```css
@theme {
  --color-primary: #004a99;
  --color-background-light: #ffffff;
  --color-background-dark: #0f1923;
  --font-family-sans: Inter, sans-serif;
  --font-size-huge: 6.5rem;
}
```

- Use `dark:` prefix for dark mode variants (class-based: `class="dark"` on `<html>`)
- Primary breakpoint for mobile nav: `md:` (768px)
- Material Symbols icons via `<span className="material-symbols-outlined">icon_name</span>` (loaded in `index.html`)
- lucide-react icons: always render via the `iconMap` pattern with a fallback, never hardcode icon components from JSON-sourced names

```tsx
const iconMap: Record<IconName, LucideIcon> = { Brain, Dna, Pill, Lightbulb, Github, Database, Terminal };
const getIcon = (name: IconName) => {
  const Icon = iconMap[name] || Brain;
  return <Icon className="w-6 h-6" />;
};
```

---

## Animations

Framer Motion is used for page-level and list-item transitions. Standard pattern:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
>
```

Do not add animations to purely functional/utility elements.

---

## Routing

React Router v6 with **HashRouter** (required for Netlify static hosting). Routes are defined in `App.tsx`.

Current routes: `/` (Home), `/member`, `/research`, `/publication`, `/resources`, `/news`, `/contact`. Catch-all redirects to home.

`App.tsx` layout: `BreadcrumbProvider` → `ScrollToTop` → `Navbar` → `<main>` → `Footer`. `ScrollToTop` resets scroll on every route change.

`preloadAllData()` is called once on app mount to cache all JSON files upfront, enabling faster page transitions.

Add new pages as:
1. A new `components/MyPage.tsx` file
2. A `<Route path="/my-page" element={<MyPage />} />` in `App.tsx`

---

## Data Files

Edit `public/data/*.json` to update site content. After editing, do a **hard refresh** in the browser (Cmd+Shift+R) during development — the in-memory cache in `dataLoader.ts` will otherwise serve stale data.

- `members.json` — `{ pi, members[], alumni[] }` (lowercase keys; loader normalises to `{ PI, MEMBERS, ALUMNI }`)
- `publications.json` — `{ publications: [{ year, papers: [...] }] }` grouped by year
- `news.json` — `{ items: [...] }`
- `labInfo.json` — contact and lab metadata
- `research.json` — `{ intro, directions[] }` (`projects` is optional and currently unused)
- `resources.json` — `{ intro, tools[] }`

If adding a new data shape, define its TypeScript interface in `src/lib/dataLoader.ts` and export a new typed loader function from the same file.

---

## Images

Store in `public/assets/images/`:
- `people/` — member photos, 400×400px, named `bio-lastname.jpg`
- `papers/` — paper thumbnails, 500×300px, named `paper1.jpg`
- `posts/` — news images, 800×600px+, descriptive names

Reference with absolute paths: `/assets/images/people/bio-chan.jpg`. Optimize: JPG at ~85% quality, keep under 500KB.

---

## Content Management (Decap CMS)

Access at `/admin/` to manage content visually. Collections: Members, Publications, News, Lab Info, Research, Resources & Software. Config: `public/admin/config.yml`.

**BibTeX Import Widget** (`public/admin/bibtex-widget.js`): Batch import publications with author name conversion, DOI-based link generation, preprint detection (arXiv, bioRxiv, ChemRxiv), and duplicate detection. Supporting utility: `src/lib/utils/bibtexParser.ts`.

---

## Deployment

Netlify auto-deploys on push to `main`. Live site: https://cc-lab-xjtlu.netlify.app. The `netlify.toml` sets build command to `npm run build`, publish dir to `dist/`, and configures `/* → /index.html` (200) for SPA routing. Do not remove this redirect rule.

**Before pushing**, always verify `npm run build` succeeds with zero TypeScript errors.

---

## Quick Reference

1. **TypeScript strict** — build fails on type errors; no unused vars/params allowed
2. **Tailwind v4** — theme in `src/index.css` via `@theme {}`, not a separate config file
3. **Dark mode** — class-based; use `dark:` prefix
4. **Mobile** — Navbar has mobile menu; primary breakpoint `md:` (768px)
5. **Animations** — Framer Motion for Navbar and page transitions only
6. **Icons** — `lucide-react` via `iconMap`; Material Symbols via `<span class="material-symbols-outlined">`
7. **Breadcrumbs** — every page component calls `useBreadcrumb()` in `useEffect`
8. **Data loading** — always use `dataLoader.ts` loaders; never import JSON directly
9. **Cache** — hard-refresh browser (Cmd+Shift+R) to pick up JSON edits during dev
10. **`loadNews()` returns `NewsItem[]` directly** — not `{ items }`. Calling `.items` on the result returns `undefined` and silently breaks rendering
11. **Member grouping** — `Member.tsx` groups by `role` field using `ROLE_ORDER`: PhD Student → MRes Student → Undergraduate Researcher → Lab Manager. Alumni use `type: "alumn"` and are rendered as a compact text roster, hidden when `alumni[]` is empty

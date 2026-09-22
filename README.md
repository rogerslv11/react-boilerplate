<div align="center">

# React + Vite Boilerplate

**Production-grade React frontend boilerplate** — strict TypeScript, Axios, Zod, TanStack Query, shadcn/ui, tests, CI.

[![CI](https://img.shields.io/github/actions/workflow/status/rogerslv11/react-vite-boilerplate/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/rogerslv11/react-vite-boilerplate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](./CONTRIBUTING.md)
![Node](https://img.shields.io/badge/node-%E2%89%A518.18-339933?style=flat-square)
![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A59-F69220?style=flat-square)

</div>

A professional, opinionated frontend boilerplate for building production-grade React applications — dashboards, SaaS platforms, internal tools, and customer-facing apps.

It ships with a complete development experience: typed end-to-end, modular architecture by feature, ready-to-use UI primitives, validated environment variables, axios with interceptors, tanstack queries, form handling with Zod, light/dark theme, and unit tests.

> 📐 **Looking for the "why"?** Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full rationale,
> folder-by-folder walkthrough, and step-by-step guide to adding a new feature.

---

## ✨ Tech stack

- **[React 19](https://react.dev/)** — UI library
- **[Vite 6](https://vitejs.dev/)** — dev server & build
- **[TypeScript 5](https://www.typescriptlang.org/)** — strict typing (`strict: true`)
- **[Tailwind CSS 3](https://tailwindcss.com/)** — utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** — accessible component primitives on top of Radix
- **[Lucide React](https://lucide.dev/)** — icons
- **[Axios](https://axios-http.com/)** — HTTP client with interceptors
- **[Zod](https://zod.dev/)** — schema validation + type inference
- **[React Hook Form](https://react-hook-form.com/)** + **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** — forms
- **[React Router DOM 7](https://reactrouter.com/)** — routing
- **[TanStack Query 5](https://tanstack.com/query)** — async state & cache
- **[next-themes](https://github.com/pacocoursey/next-themes)** — light/dark theme
- **[Sonner](https://sonner.emilkowal.ski/)** — toast notifications
- **[Vitest](https://vitest.dev/)** + **[Testing Library](https://testing-library.com/)** — unit tests
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** + **typescript-eslint** — lint & formatting

---

## 🚀 Getting started

### Requirements

- **Node.js ≥ 18.18**
- **pnpm ≥ 9** (preferred). `npm` and `yarn` also work.

### Install

```bash
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env
```

### Scripts

| Command              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `pnpm dev`           | Start the development server on `http://localhost:5173`. |
| `pnpm build`         | Type-check and produce a production build in `dist/`.    |
| `pnpm preview`       | Preview the production build locally.                    |
| `pnpm lint`          | Run ESLint across the project.                           |
| `pnpm lint:fix`      | Auto-fix lint issues.                                    |
| `pnpm format`        | Format files with Prettier.                              |
| `pnpm format:check`  | Verify formatting without writing.                       |
| `pnpm typecheck`     | Type-check `tsconfig.app.json` and `tsconfig.node.json`. |
| `pnpm test`          | Run all unit tests once (Vitest).                        |
| `pnpm test:watch`    | Watch mode for tests.                                    |
| `pnpm test:coverage` | Generate coverage report.                                |

---

## ⚙️ Environment variables

All variables are validated at runtime by Zod (`src/lib/env.ts`). The build/dev server will refuse to start if anything is missing or malformed.

| Variable                | Type    | Default                     | Purpose                                  |
| ----------------------- | ------- | --------------------------- | ---------------------------------------- |
| `VITE_APP_NAME`         | string  | `React Boilerplate`         | Brand name shown in UI.                  |
| `VITE_APP_ENV`          | enum    | `development`               | `development` \| `production` \| `test`  |
| `VITE_API_BASE_URL`     | url     | `http://localhost:3000/api` | Axios base URL.                          |
| `VITE_API_TIMEOUT`      | number  | `15000`                     | Axios timeout (ms).                      |
| `VITE_USE_MOCKS`        | boolean | `true`                      | Use the mock layer instead of real HTTP. |
| `VITE_AUTH_TOKEN_KEY`   | string  | `rb_auth_token`             | Session storage key for auth tokens.     |
| `VITE_AUTH_REFRESH_KEY` | string  | `rb_refresh_token`          | Session storage key for refresh tokens.  |

> Only variables prefixed with `VITE_` are exposed to the client. Never put secrets here.

---

## 📁 Project structure

```text
src/
├── app/                      # Application bootstrap
│   ├── layouts/              # App, auth and dashboard layouts
│   ├── providers/            # App, query, theme, toast providers
│   └── router/               # Router, routes and guards
│
├── components/               # Reusable building blocks
│   ├── ui/                   # shadcn/ui primitives (do not modify structure)
│   ├── feedback/             # Loading, empty, error, 404, 403
│   └── shared/               # Cross-feature components (theme toggle, etc.)
│
├── features/                 # Feature-based modules
│   ├── auth/                 # Authentication feature
│   │   ├── components/       # Login form, forgot-password form
│   │   ├── context/          # AuthProvider + useAuth
│   │   ├── hooks/            # useSignInMutation, usePasswordRecoveryMutation
│   │   ├── mocks/            # Auth mocks
│   │   ├── pages/            # /login, /forgot-password
│   │   ├── schemas/          # Zod schemas for forms + DTOs
│   │   ├── services/         # auth-service.ts
│   │   └── types/            # User, Session, UserRole
│   └── dashboard/            # Dashboard feature
│       ├── components/       # MetricCard, CustomersTable, etc.
│       ├── hooks/            # TanStack queries
│       ├── mocks/            # Mocked data
│       ├── pages/            # Overview page
│       ├── schemas/          # Zod schemas
│       ├── services/         # dashboard-service.ts
│       └── types/            # Domain types
│
├── constants/                # Shared constants (routes, pagination, etc.)
├── lib/                      # Generic helpers (axios, env, utils)
├── styles/                   # Tailwind entry + globals
└── main.tsx                  # App entry (StrictMode + providers)
```

---

## 🧠 Architectural principles

- **Feature-first** — every business capability lives in `src/features/<feature>` and is self-contained.
- **No leaky abstractions** — UI components never call Axios directly. They consume hooks exposed by the feature.
- **Schemas over types** — define data shapes with Zod and infer types via `z.infer<typeof schema>`.
- **Strict TypeScript** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.
- **Path aliases** — use `@/components`, `@/features`, `@/lib`, etc. Always import via aliases (already wired).
- **Lazy loading** — pages are imported with `React.lazy` and rendered inside a `Suspense`.
- **Errors are first-class** — central error normalization in `lib/axios.ts`, consistent toasts, `ErrorState`/`EmptyState` feedback components.

---

## ➕ Adding a new feature

A feature is anything that owns business logic, server calls, and pages.

1. **Create the folder** under `src/features/<feature>` with the same internal layout (`components/`, `hooks/`, `schemas/`, `services/`, `types/`, `pages/`).
2. **Define Zod schemas** in `schemas/`. Infer all domain types from them.
3. **Build the service** (`services/<feature>-service.ts`) that wraps Axios calls and returns parsed DTOs.
4. **Expose hooks** in `hooks/` that wrap `useQuery`/`useMutation` and re-export them to UI.
5. **Add the page(s)** in `pages/` and register the route in `src/app/router/routes.tsx`.
6. **Mock data** lives under `mocks/` and is selected by `VITE_USE_MOCKS`.

Minimal example — adding a `billing` feature:

```ts
// src/features/billing/schemas/billing-schemas.ts
import { z } from 'zod';

export const invoiceSchema = z.object({
  id: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  status: z.enum(['paid', 'open', 'void']),
  issuedAt: z.string(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
```

```ts
// src/features/billing/services/billing-service.ts
import { api } from '@/lib/axios';
import { invoiceSchema, type Invoice } from '../schemas/billing-schemas';

export const billingService = {
  async listInvoices(): Promise<Invoice[]> {
    const { data } = await api.get<unknown>('/invoices');
    return z.array(invoiceSchema).parse(data);
  },
};
```

```ts
// src/features/billing/hooks/use-invoices-query.ts
import { useQuery } from '@tanstack/react-query';
import { billingService } from '../services/billing-service';

export function useInvoicesQuery() {
  return useQuery({ queryKey: ['billing', 'invoices'], queryFn: billingService.listInvoices });
}
```

```tsx
// src/features/billing/pages/invoices-page.tsx
export function InvoicesPage() {
  const { data, isLoading } = useInvoicesQuery();
  if (isLoading) return <LoadingScreen />;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

Finally, register it in the router:

```tsx
// src/app/router/routes.tsx
const InvoicesPage = lazy(() =>
  import('@/features/billing/pages/invoices-page').then((m) => ({ default: m.InvoicesPage })),
);

<Route path="billing" element={<InvoicesPage />} />;
```

---

## 🧩 Shared components & UI primitives

- shadcn/ui primitives live in `src/components/ui`. They are intentionally minimal — do not add business logic here.
- Cross-feature composites go in `src/components/shared` (e.g., `theme-toggle.tsx`).
- Cross-feature **feedback** components live in `src/components/feedback`: `LoadingScreen`, `EmptyState`, `ErrorState`, `NotFoundPage`, `ForbiddenPage`.

To add a new shadcn component locally, copy the official recipe into `components/ui/<name>.tsx` and adjust imports to `@/lib/utils`.

---

## 🌐 Axios

Centralized in `src/lib/axios.ts`:

- Reads `VITE_API_BASE_URL` and `VITE_API_TIMEOUT`.
- Injects `Authorization: Bearer <token>` automatically from `sessionStorage`.
- Normalizes errors into `ApiErrorPayload` (`{ code, message, status, details }`).
- Surfaces 401s by clearing the session and dispatching an `auth:unauthorized` event the AuthProvider listens to.
- Surfaces 403/5xx via Sonner toasts.

Use the helper `getApiError(error)` to read the normalized payload from any catch block.

Per-feature services (e.g., `features/auth/services/auth-service.ts`) wrap Axios and return Zod-parsed data. Never call Axios from a component.

---

## ✅ Zod

- Forms validate with `zodResolver` (see `LoginForm`).
- Server payloads are validated at the boundary — never trust raw JSON.
- Domain types are inferred from schemas via `z.infer` (see `auth-schemas.ts`).
- Environment variables are validated in `src/lib/env.ts` with `.safeParse` — the app refuses to boot if anything is invalid.

---

## 🛣️ Routing

Defined in `src/app/router/routes.tsx`:

- `<ProtectedRoute />` — redirects guests to `/login`, remembers the intended page.
- `<GuestOnlyRoute />` — redirects authenticated users to `/dashboard`.
- `<NotFoundPage />` and `<ForbiddenPage />` for error states.
- Pages are lazy-loaded with `React.lazy` and rendered through a single `<Suspense>` boundary.

To add a route, append a `<Route>` inside the existing layout wrappers — no need to refactor the router.

---

## 🔐 Authentication

The auth flow is **demonstrative only**. Tokens are stored in `sessionStorage` for the demo because:

1. The boilerplate ships without a backend.
2. `sessionStorage` reduces the blast radius of XSS compared to `localStorage`.
3. It avoids persisting fake tokens across browser restarts.

For production, the recommended pattern is:

- **Use httpOnly secure cookies** set by your backend (`Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax`). The frontend never sees the token.
- Combine with a **CSRF strategy** (double-submit cookie or SameSite=Strict) and rotate the refresh token.
- Keep the AuthProvider as the single source of truth for the current user, fetched from `/auth/me` or a cookie-aware `/session` endpoint.

Demo credentials:

```text
ada@boilerplate.dev   /  password   (admin)
grace@boilerplate.dev /  password   (manager)
alan@boilerplate.dev  /  password   (member)
```

---

## 🌗 Theme

- `next-themes` manages light/dark/system.
- Tailwind uses the `class` strategy (`darkMode: ['class']`).
- The `<ThemeToggle />` component (`components/shared/theme-toggle.tsx`) lets the user switch themes from anywhere.
- All color tokens are CSS variables defined in `src/styles/globals.css`, so themes are easy to customize.

---

## 🧪 Tests

- Vitest is wired to use jsdom.
- Test files live next to the code they cover (`*.test.ts`, `*.test.tsx`).
- Run a specific file:

  ```bash
  pnpm test src/lib/utils.test.ts
  ```

- Coverage is configured via `pnpm test:coverage` (V8 provider).

Starter tests are provided for:

- `src/lib/utils.test.ts`
- `src/features/auth/schemas/auth-schemas.test.ts`
- `src/features/dashboard/schemas/dashboard-schemas.test.ts`
- `src/components/ui/button.test.tsx`
- `src/features/dashboard/components/metric-card.test.tsx`

---

## 🎭 Mocks vs real API

- `VITE_USE_MOCKS=true` keeps the app self-contained — every feature has a `mocks/` folder with realistic data.
- `VITE_USE_MOCKS=false` makes the services hit `VITE_API_BASE_URL`. Pair it with any REST backend that respects the documented contracts (see `schemas/`).
- Mocks never leak into components — they are only imported from the matching `services/<feature>-service.ts`.

---

## 🛡️ Security & best practices

- Frontend route guards are **only UX**. Authorization **must** be enforced on the backend for every protected resource.
- Never commit secrets. Only `VITE_*` variables are exposed to the bundle.
- Validate **all** incoming data with Zod, especially anything coming from query strings or storage.
- Centralized error handling (see `lib/axios.ts`) prevents leaking sensitive information via toasts.
- Tokens in `sessionStorage` are demo-only; production should use httpOnly cookies.

---

## 📦 Build & deployment

`pnpm build` produces an optimized static bundle in `dist/`. Vite is configured to:

- Split vendor chunks (`react`, `query`, `forms`, `ui`) for better caching.
- Resolve all `@/` aliases.
- Strip source maps (set `build.sourcemap = true` in `vite.config.ts` if you need them).

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, Nginx, etc.). Configure SPA fallback (all unknown routes → `/index.html`) so React Router can take over.

---

## 📜 Code conventions

- Use **functional components** and hooks only.
- **No `any`** — define types or use `unknown` + narrowing.
- Keep components under ~150 lines. Extract subcomponents when growing.
- Imports must be ordered: external → `@/` aliases → relative. ESLint enforces `consistent-type-imports`.
- One responsibility per file. Co-locate tests with the code they cover.
- Prefer **composition** over configuration. Avoid premature abstractions.
- Accessibility matters: every interactive element has an accessible name, semantic HTML, and keyboard support.

---

## 📄 License

This boilerplate is released under the **MIT License**. Use it, fork it, ship it.

---

Happy hacking 🚀

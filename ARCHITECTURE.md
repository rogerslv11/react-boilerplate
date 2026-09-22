# Architecture

> How the boilerplate is organized, why it's structured this way, and how each layer
> interacts with the next.

---

## 1. Guiding principles

| Principle                   | In practice                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Feature-first**           | Every business capability lives in `src/features/<name>` and is self-contained.                      |
| **Schemas over types**      | Shapes are defined with Zod; TS types come from `z.infer`. The source of truth is the schema.        |
| **Strict boundaries**       | UI never talks to Axios; services never talk to React. Hooks bridge the two.                         |
| **Mocks are first-class**   | Every feature ships with its own `mocks/` folder and a `VITE_USE_MOCKS` switch at the service layer. |
| **Errors are normalized**   | HTTP errors are mapped to a single `ApiErrorPayload` shape and surfaced consistently.                |
| **Lazy by default**         | Pages are `React.lazy` imports; routers are wrapped in a single `<Suspense>`.                        |
| **Strict TypeScript**       | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.                      |
| **Path aliases everywhere** | `@/components`, `@/features`, `@/lib`, `@/hooks`, `@/app`, `@/constants`, `@/styles`, `@/test`.      |

---

## 2. High-level layers

```text
┌──────────────────────────────────────────────────────────────┐
│  UI  (pages, components, layouts)                            │
│      ↓  consumes                                             │
│  Hooks  (TanStack Query wrappers, form hooks)                │
│      ↓  consumes                                             │
│  Services  (Axios + Zod parsing)                             │
│      ↓  consumes                                             │
│  Lib  (axios instance, env, utils)                           │
│      ↓  consumes                                             │
│  Infra  (env vars, mock data, browser APIs)                  │
└──────────────────────────────────────────────────────────────┘
```

Dependencies always point **downward**. Lower layers never import from higher
layers.

---

## 3. Folder map

```text
src/
├── main.tsx                  # StrictMode + AppProvider + Router mount
├── app/                      # Application bootstrap
│   ├── layouts/              # App, Auth, Dashboard shells
│   ├── providers/            # Theme → Query → Auth → Toaster
│   └── router/               # Routes + Protected/GuestOnly guards
│
├── components/
│   ├── ui/                   # shadcn/ui primitives (Radix + Tailwind)
│   ├── feedback/             # LoadingScreen, EmptyState, ErrorState, 404, 403
│   └── shared/               # Cross-feature composites (theme-toggle)
│
├── features/
│   ├── auth/                 # Login + password recovery flow
│   └── dashboard/            # Customer overview, metrics, activity
│       (each feature:)
│       ├── api/              # (reserved — currently services/ holds Axios)
│       ├── components/       # Feature-specific UI
│       ├── hooks/            # React Query wrappers
│       ├── mocks/            # Mock data layer
│       ├── pages/            # Route-level pages (lazy-imported)
│       ├── schemas/          # Zod schemas (forms + DTOs)
│       ├── services/         # Feature service (Axios + parsing)
│       └── types/            # Domain types (derived from schemas)
│
├── lib/                      # Cross-cutting infra (axios, env, utils)
├── constants/                # App-level constants (routes, pagination, ...)
├── styles/                   # Tailwind entry + design tokens (CSS variables)
├── test/                     # Vitest setup (jsdom polyfills)
└── vite-env.d.ts             # Vite + ImportMetaEnv types
```

Each `features/<x>/` folder is **independent**: nothing inside imports from a sibling
feature, and reaching into another feature's internals from outside is discouraged.
Cross-feature contracts happen via shared `components/shared/*` or `components/ui/*`.

---

## 4. Provider tree

`src/main.tsx` mounts the tree:

```tsx
<AppProvider>
  {' '}
  // composition root
  <AppRouterProvider /> // BrowserRouter + routes
</AppProvider>
```

Inside `AppProvider`:

```tsx
<ThemeProvider>
  {' '}
  // next-themes: light / dark / system
  <QueryProvider>
    {' '}
    // TanStack Query client
    <AuthProvider>
      {' '}
      // session, signIn / signOut
      {children} // routed pages
      <Toaster /> // global notifications (sibling, not parent)
    </AuthProvider>
  </QueryProvider>
</ThemeProvider>
```

Order matters:

- `ThemeProvider` is outermost so SSR-friendly variables (`<html class="...">`) work
  and Tailwind's `dark:` variants apply before the first paint.
- `QueryProvider` wraps `AuthProvider` because the auth context uses the query
  client indirectly (hooks may call queries) and should always be available.
- `Toaster` is a sibling, not a parent: it never blocks rendering.

`AppRouterProvider` lives **outside** the providers so navigation errors don't
crash the toaster or the query cache.

---

## 5. Routing & guards

`src/app/router/routes.tsx` defines every route. Two guards wrap subtree groups:

| Guard              | Behaviour                                                         |
| ------------------ | ----------------------------------------------------------------- |
| `<GuestOnlyRoute>` | If authenticated, redirects to `/dashboard`. Used for `/login`.   |
| `<ProtectedRoute>` | If not authenticated, redirects to `/login` and remembers `from`. |

Lazy loading happens at the route element:

```tsx
const OverviewPage = lazy(() =>
  import('@/features/dashboard/pages/overview-page').then((m) => ({ default: m.OverviewPage })),
);
```

A single `<Suspense fallback={<LoadingScreen />}>` in `AppRouter` covers all
pages. New routes only need a new `<Route>` inside the existing layout tree.

---

## 6. Feature anatomy

Take the **dashboard** feature as a worked example:

```text
features/dashboard/
├── schemas/dashboard-schemas.ts        # Zod schemas (single source of truth)
├── schemas/dashboard-schemas.test.ts   # schema unit tests
├── types/index.ts                      # domain types = z.infer<typeof schema>
├── mocks/dashboard-mock.ts             # in-memory implementation
├── services/dashboard-service.ts       # chooses mock or Axios + parses DTOs
├── hooks/use-dashboard-query.ts        # useQuery wrapper
├── hooks/use-customers-query.ts
├── hooks/use-activity-query.ts
├── components/metric-card.tsx
├── components/customer-filters.tsx
├── components/customers-table.tsx
├── components/activity-feed.tsx
├── components/pagination.tsx
├── components/dashboard-content.tsx    # composition root for the page
└── pages/overview-page.tsx             # exports <OverviewPage />
```

The **flow for a single piece of data** (e.g., customers list):

```text
mock or HTTP
      │
      ▼
dashboard-service.listCustomers(params)
  • if VITE_USE_MOCKS → dashboardMock.listCustomers()
  • else → api.get('/customers?...') + paginatedResponseSchema(customerSchema).parse()
      │
      ▼
useCustomersQuery(params) (TanStack Query)
  • stale time, retry policy, cancellation
      │
      ▼
CustomersTable (component)
  • renders rows, pagination, empty/loading/error states
```

Notice:

- The component **never imports** `axios` or the mock directly.
- The service **never imports** React or React Query.
- The hook **never imports** axios directly — only via the service.

---

## 7. Validation strategy

- **Forms** — `zodResolver(schema)` + `<Form>` shadcn primitives. Errors are shown
  next to fields via `<FormMessage />`. See `features/auth/components/login-form.tsx`.
- **Environment** — `lib/env.ts` uses `z.safeParse(import.meta.env)`. The app
  refuses to boot if a variable is missing or malformed.
- **API responses** — every service call goes through a Zod schema
  (`customerSchema`, `paginatedResponseSchema(...)`, etc.) before reaching the UI.
  This catches API drift early and gives the rest of the app fully-typed data.
- **Type inference** — `type Customer = z.infer<typeof customerSchema>` is the
  canonical pattern. We never duplicate a shape in both `types/` and `schemas/`.

---

## 8. HTTP layer (`lib/axios.ts`)

A single Axios instance is exported as `api`. Concerns:

1. **Base URL & timeout** come from `env` (validated at boot).
2. **Request interceptor** adds `Authorization: Bearer <token>` from
   `sessionStorage` if present.
3. **Response interceptor** wraps every error into an `ApiErrorPayload`
   (`{ code, message, status, details }`) and rejects with an `Error` that
   carries the payload on the `apiError` property. Use `getApiError(error)` to
   read it.
4. **401 handling** — clears the stored tokens and dispatches the
   `auth:unauthorized` window event. The AuthProvider listens and resets state.
5. **Silent option** — pass `{ silent: true }` to suppress automatic toasts on
   errors that the caller wants to handle explicitly (e.g., a 401 inside a
   background revalidation).

Services wrap `api.get/post/...` and validate the response with Zod. The UI
consumes parsed, typed data — never raw `AxiosResponse`.

---

## 9. State management

There are **three** kinds of state, each with one home:

| Kind             | Where it lives                                       |
| ---------------- | ---------------------------------------------------- |
| **Server state** | TanStack Query (`@tanstack/react-query`)             |
| **Auth state**   | React context (`features/auth/context/auth-context`) |
| **Theme state**  | `next-themes` (localStorage, OS-preference aware)    |

We deliberately avoid Redux/Zustand for server data: the boilerplate ships with a
strict separation between cache (Query) and UI state (component-local). Reach for
`useState`/`useReducer` inside components or contexts only for ephemeral UI.

---

## 10. Error & feedback model

Every async surface in the app produces one of three states:

- **Loading** — `isLoading === true` (no data yet). Show `<Skeleton />` or
  `<LoadingScreen />`.
- **Error** — `isError === true`. Show `<ErrorState onRetry={refetch} />`.
- **Empty** — data is present but length is zero. Show `<EmptyState />`.

The QueryClient also has a global `onError` that surfaces failed mutations as
Sonner toasts. Services can opt out by passing `{ silent: true }` for the
specific request that should be handled inline.

---

## 11. Styling

- **Tokens** — colors, radii, and shadows are CSS variables in `src/styles/globals.css`.
  Both light and dark themes are defined there and toggled by adding/removing the
  `dark` class on `<html>`.
- **Utility-first** — Tailwind handles 100% of styling. No CSS modules, no
  styled-components, no inline `style` objects (except for genuinely dynamic
  values).
- **Composition** — feature components extend primitives (`Card`, `Badge`,
  `Table`, etc.) rather than reinventing them. When a pattern repeats three
  times in a feature, lift it to `components/shared/`.

---

## 12. Testing

- **Framework** — Vitest + jsdom + Testing Library + jest-dom matchers.
- **Setup** — `src/test/setup.ts` registers jest-dom matchers, polyfills
  `matchMedia` and `IntersectionObserver` (Radix relies on both), and runs
  `cleanup()` after every test.
- **What we test** — utility functions, Zod schemas, and pure UI components
  (Button, MetricCard). Hooks and services are wired through the Query client and
  AuthProvider for end-to-end coverage in real browser sessions.
- **Co-location** — tests live next to the code they cover
  (`foo.ts` + `foo.test.ts`).

---

## 13. Build & deployment

`pnpm build` runs `tsc -b && vite build`. Vite is configured to:

- Resolve `@/*` aliases.
- Split the bundle into vendor chunks (`react`, `query`, `forms`, `ui`) for
  better long-term caching.
- Drop source maps by default (toggle `build.sourcemap` if you need them).

The output in `dist/` is a static SPA. Configure your host with an SPA fallback
(all unknown paths → `/index.html`) so React Router can take over. There is no
runtime — the entire app is client-rendered after the first paint.

---

## 14. Adding a new feature (step by step)

1. **Scaffold the folder** under `src/features/<name>/` with `components`,
   `hooks`, `mocks`, `pages`, `schemas`, `services`, `types`.
2. **Define Zod schemas** in `schemas/<name>-schemas.ts`. Export types via
   `z.infer`.
3. **Build the mock** in `mocks/<name>-mock.ts`. Keep it self-contained.
4. **Build the service** in `services/<name>-service.ts`. Read
   `env.VITE_USE_MOCKS` to choose mock vs Axios. Validate responses with Zod.
5. **Expose hooks** in `hooks/use-<name>-query.ts` etc.
6. **Build UI** in `components/` and compose it in `pages/<page>.tsx`.
7. **Wire the route** in `src/app/router/routes.tsx` (lazy).
8. **Test the schemas** with a `schemas/<name>-schemas.test.ts`.

No file outside `features/<name>/` needs to change beyond the router. That's the
test of a clean feature module.

---

## 15. What this boilerplate intentionally does NOT include

- **Redux / Zustand** — server state belongs in TanStack Query; ephemeral UI
  state stays in components or context.
- **CSS-in-JS** — Tailwind covers every style need and ships zero JS.
- **Storybook** — easy to add, but not part of the runtime deliverable.
- **i18n** — multi-locale support is a project-specific decision; left out for
  minimalism.
- **Service workers / PWA** — opt-in per project. The boilerplate remains a pure
  SPA.
- **MSW** — would add complexity to the mock layer; the explicit
  `mocks/<feature>-mock.ts` pattern keeps tests fast and transparent.

Each can be added without disturbing the architecture above.

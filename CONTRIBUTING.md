# Contributing

Thanks for your interest in improving this boilerplate! 🎉

This project is meant to stay **lean and opinionated**, so please discuss larger
ideas in an issue before opening a pull request.

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Required tool: **Node.js ≥ 18.18** and **pnpm ≥ 9**.

## Quality gates

Before sending a pull request, make sure the following commands pass:

```bash
pnpm format:check   # Prettier
pnpm lint               # ESLint
pnpm typecheck         # tsc
pnpm test              # Vitest
pnpm build             # Production build
```

All five must be green. CI runs the same checks (see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Conventions

- TypeScript **strict** mode is enforced; do not introduce `any`.
- Functional components and hooks only.
- One responsibility per file. Keep components under ~150 lines.
- New features follow the layout described in
  [`ARCHITECTURE.md`](./ARCHITECTURE.md): `schemas`, `mocks`, `services`,
  `hooks`, `components`, `pages`.
- Co-locate tests next to the code they cover (`foo.test.ts` next to `foo.ts`).

## Commit messages

This repository uses [Conventional Commits](https://www.conventionalcommits.org/)
because it is wired up with [release-please](.github/workflows/release-please.yml).

Examples:

```text
feat: add invoice list feature
fix(auth): clear stale tokens on 401
docs: document feature-first architecture
chore(deps): bump zod to 3.24
```

## Pull request checklist

- [ ] The change is described (what & why)
- [ ] Tests added or updated
- [ ] Docs updated (README or ARCHITECTURE.md if relevant)
- [ ] No new dependency without justification
- [ ] All CI checks are green

## Reporting issues

Please use the [issue templates](.github/ISSUE_TEMPLATE). For security
vulnerabilities, see [`SECURITY.md`](./SECURITY.md).

## License

By contributing you agree that your contributions will be licensed under the
MIT License (see [`LICENSE`](./LICENSE)).

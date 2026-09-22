# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

Releases are managed automatically by
[release-please](https://github.com/googleapis/release-please) on every push to
`main`. Conventional Commit messages determine the version bump.

## [Unreleased]

### Added

- Initial public release of the React + Vite boilerplate.
- Feature-first architecture (`src/features/<name>/`).
- Axios instance with interceptors and Zod-parsed responses.
- TanStack Query, React Router, React Hook Form, next-themes, Sonner.
- shadcn/ui component library (Button, Card, Dialog, Dropdown Menu, Select,
  Checkbox, Switch, Tabs, Table, Badge, Avatar, Skeleton, Tooltip, Sheet, Form,
  Alert, Separator, Input, Label).
- Auth feature with login, forgot password, route guards and demo session.
- Dashboard feature with metrics, customers table, activity feed, filters,
  pagination, search.
- Vitest + Testing Library setup with starter tests for utils, schemas,
  primitives and components.
- ESLint (flat config) + Prettier + strict TypeScript.
- GitHub Actions CI pipeline (lint, typecheck, format, tests, build).
- Dependabot configuration (npm + GitHub Actions).
- Issue and pull request templates.
- `ARCHITECTURE.md`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`.

[Unreleased]: https://github.com/rogerslv11/react-vite-boilerplate/compare/HEAD

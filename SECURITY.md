# Security Policy

## Supported versions

| Version | Supported           |
| ------- | ------------------- |
| latest  | ✅                  |
| older   | ❌ (please upgrade) |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.
Instead, email **`security@your-domain.example`** with:

- A description of the vulnerability
- Reproduction steps
- Impact assessment (best estimate)
- Any known mitigations

You should receive an acknowledgement within **72 hours**. We aim to ship a fix
within **30 days** for critical issues.

## What you can expect

- Acknowledgement within 3 business days
- Status updates every 7 days until resolution
- Credit in the release notes (unless you prefer to stay anonymous)

## Scope

This repository is a **frontend boilerplate**. It does not run a server.
Vulnerabilities of interest include:

- Build / supply-chain risks (compromised dependencies)
- XSS vectors introduced by the UI primitives
- Auth/session handling flaws in the demo flow
- Anything in CI workflows under `.github/workflows/`

Vulnerabilities specific to **your** application must be patched in your own
code. The boilerplate is only the starting point.

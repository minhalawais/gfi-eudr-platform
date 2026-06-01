# Frontend

This directory contains the Next.js 14 App Router application for the FOS EUDR platform.

## Principles

- RSC-first by default
- Route groups for role-specific experiences
- Typed API clients for `/api/v1`
- No compliance-critical state authority in the browser

## Structure

```text
src/app/               Route groups and pages
src/components/        Shared UI and domain components
src/lib/               Frontend helpers and typed API clients
src/server/            Server-only integrations and session helpers
src/styles/            Global styles and tokens
src/types/             Frontend-safe types and view models
```

## Route Groups

- `(internal)`: internal operator and compliance team workspace
- `(supplier-portal)`: supplier self-service and evidence submission
- `(agent-portal)`: EU-agent package access

## Delivery Rules

- Use server components unless client interactivity is required.
- Keep auth and permission decisions enforced server-side.
- Use shared status and evidence-view patterns instead of one-off UI logic.

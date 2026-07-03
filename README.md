# Mail Agent

Mail Agent is a multi-account mail workspace that pulls Gmail and IMAP inboxes into one system, then connects important mail to Notion and later AI workflows.

## Current Structure

- `apps/web`: Next.js web client
- `apps/api`: NestJS API server
- `packages/shared`: shared mail domain types
- `prisma`: database schema draft
- `docs`: product, design, and development planning documents

## Quick Start

```bash
npm install
npm run check
```

Optional local infra:

```bash
npm run db:up
```

Run each app in its own terminal:

```bash
npm run dev:api
npm run dev:web
```

## Development Flow

The working development guide lives in [docs/Development_Workflow.md](docs/Development_Workflow.md).

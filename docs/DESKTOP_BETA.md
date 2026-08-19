# Desktop beta architecture

## Runtime split

- Railway Web: Next.js renderer loaded by Electron.
- Railway API: NestJS, PostgreSQL, Redis, Gmail OAuth and synchronization.
- Desktop: Electron shell, OAuth deep link, bundled llama.cpp and Qwen3-4B Q4_K_M.
- Email text is passed to local inference through isolated IPC. Only the structured analysis result
  is validated and persisted by the central API.

## Railway services

Create separate Web and API services from this repository, plus PostgreSQL and Redis plugins.

- API Dockerfile: `deploy/railway/api.Dockerfile`
- Web Dockerfile: `deploy/railway/web.Dockerfile`
- API health check: `/api/health`
- Web variable: `NEXT_PUBLIC_API_BASE_URL=https://<api-domain>/api`
- API variables: `DATABASE_URL`, `REDIS_URL`, Google OAuth credentials, token encryption key.
- Production auth variables: `ALLOW_DEVELOPMENT_IDENTITY=false`,
  `OAUTH_ALLOWED_RETURN_ORIGINS=https://<web-domain>` and
  `CORS_ALLOWED_ORIGINS=https://<web-domain>`.
- Google redirect URI: `https://<api-domain>/api/auth/google/callback`

Set `MAIL_AGENT_WEB_URL=https://<web-domain>` and
`MAIL_AGENT_API_URL=https://<api-domain>/api` when packaging the desktop app.

## Local model bundle

Use Qwen's official `Qwen3-4B-GGUF` Q4_K_M artifact and a pinned llama.cpp release. Packaging
requires the resource layout in `apps/desktop/resources/README.md`. The asset preparation script
verifies SHA-256 and splits the 2.5 GB model into llama.cpp-compatible shards below 2 GB. Do not
commit model files to Git; inject them in the release workflow.

## Build hosts

- Build the model-included Windows x64 beta as ZIP. NSIS cannot embed the resulting archive because
  it exceeds its 2 GB limit; an installer build requires a separate first-run model download flow.
- Build, sign and notarize DMG/ZIP separately on macOS arm64 and x64.
- A macOS package cannot be properly signed and notarized from a Windows build host.

## Security release gate

- Keep `ALLOW_DEVELOPMENT_IDENTITY=false` in production so only OAuth-issued desktop sessions work.
- Restrict CORS to the Railway web origin.
- Store Gmail refresh tokens encrypted and rotate the production encryption key.
- Sign Windows artifacts and notarize macOS artifacts.
- Publish the Qwen Apache-2.0 and llama.cpp license notices with the installer.

# Security Setup

## Never commit secrets

- Never commit `.env`, `.env.local`, `.env.production`.
- Keep only placeholders in `.env.example`.
- Service-role and model keys are server-only.

## Server-only secrets checklist

Use environment manager (Vercel project settings or equivalent) for:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_DSN`

Do not expose these with `NEXT_PUBLIC_*`.

## If keys were exposed

Immediately rotate:

1. Supabase anon key
2. Supabase service role key
3. OpenAI API key
4. Sentry token/DSN if needed

## Preflight

Run before release:

```bash
npm run security:preflight
```

This script checks local env files for obvious secret-like values and fails if found.

## Additional controls

- Enable branch protection + secret scanning in Git provider.
- Restrict production environment variable editing to limited roles.
- Keep separate keys per environment (dev/staging/prod).

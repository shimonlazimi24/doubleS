# Moving the database from Tokyo to Frankfurt

Why: the Vercel functions run in Frankfurt (`vercel.json`) and the database is
in Tokyo. Measured on the live site, every round trip costs about 500ms, and a
signed-in page makes three to five of them in a row. The same page against a
Frankfurt database would spend under 50ms on the database.

Supabase cannot move a project between regions, so this is a new project plus a
copy of the data. Users keep their accounts (password hashes and Google
identities travel with `auth.users` / `auth.identities`); everyone is signed out
once, because the session cookies name the old project.

## What the owner does (Supabase + Google + Vercel dashboards)

1. **Create the project** in the same organization, region **Central EU
   (Frankfurt)**. Choose a database password and keep it.
2. **JWT signing keys**: Authentication → JWT Keys → create an asymmetric key
   (ES256) and make it current. With this, the middleware verifies tokens
   locally (`getClaims()`), one fewer round trip on every navigation.
3. **Google sign-in**: in Google Cloud, add the new callback
   `https://<new-ref>.supabase.co/auth/v1/callback` to the OAuth client; in the
   new project enable the Google provider with the same client id and secret,
   and set Site URL + redirect URLs as in `docs/SUPABASE_AUTH_SETUP.md`.
4. **Connection strings**: Project Settings → Database → *Session pooler*
   connection string for the **old** project and for the **new** one. Those go
   into the two environment variables of the copy step below, on your own
   machine, never into the repository or the chat.
5. After the copy: put the new **URL**, **anon key** and **service_role key** in
   Vercel (Production), redeploy, run `npm run verify:new-project`, sign in once,
   run `supabase/grant-admin.sql`, sign in again.

## The copy (one terminal session, about 15 minutes)

Tooling: the Supabase CLI needs Docker for `db dump`; this Mac has neither Docker
nor Homebrew. Use the standalone PostgreSQL binaries instead (pg_dump / psql,
version 17, macOS arm64 zip from EnterpriseDB), unpacked under
`~/fixTok/node-toolchain/pg/`. Both dump and restore run from this machine.

```bash
export PATH="$HOME/fixTok/node-toolchain/pg/bin:$PATH"
export OLD_DB_URL='postgresql://postgres.<old-ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
export NEW_DB_URL='postgresql://postgres.<new-ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
bash scripts/migrate-db-to-new-project.sh
```

The script:

1. Runs the schema files of `SETUP_NEW_PROJECT.md` against the new project, in
   order, so the tables, policies and functions exist exactly as the code
   expects them (not a schema dump of the old project, which carries three
   unused schemas and old policy versions).
2. Dumps **data only** from the old project: `auth.users`, `auth.identities`,
   and every `public` table the app queries, with `COPY` statements.
3. Restores that data into the new project with `session_replication_role =
   replica`, so foreign keys and triggers do not fight the load order.
4. Prints row counts from both sides, table by table, so a mismatch is visible
   before Vercel points at the new project.

Storage: the `site-media` bucket holds the admin's uploaded videos. The script
lists the objects; copy them by hand from the old bucket to the new one in the
dashboard (there are a handful), or leave the old project alive for a week and
move them when convenient. `prep_site_settings` keeps the public URLs, so
re-upload under the same object names.

## Rollback

Keep the old project alive, untouched, for two weeks. Rolling back is putting the
old URL and keys back in Vercel and redeploying; nothing in the old project was
changed by the copy.

## After the move

- Delete `vercel.json`'s region pin? No: keep `fra1`, it is now the right choice.
- Measure again: `/prep/settings` should answer in about 300ms instead of 1.5s.
- Then the old project can be paused (Supabase keeps a paused project for free).

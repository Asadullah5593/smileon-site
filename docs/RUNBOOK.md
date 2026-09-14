# SmileOn — operations runbook

Everything you need at 2am. Commands assume `docker compose` from the repo root;
adjust paths if you deploy differently.

---

## First deploy

```bash
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, MYSQL_ROOT_PASSWORD
npx auth secret               # generates AUTH_SECRET

RUN_SEED=1 docker compose up --build -d
```

`RUN_SEED=1` runs the seed **once**: it syncs the permission registry, creates the five system
roles and the first super admin. The entrypoint applies migrations on every start regardless.

Then, immediately:

1. Sign in at `/login` with the credentials the seed printed.
2. Change that password at `/admin/profile`.
3. Turn **Settings → SEO → Hide the entire site from search engines** off when you go live. It is
   the switch people forget.

Leave `RUN_SEED` unset (or `0`) for subsequent deploys.

---

## Routine operations

| Task | Command |
| --- | --- |
| Deploy a new version | `docker compose up --build -d` (migrations run automatically) |
| Follow logs | `docker compose logs -f app` — JSON, one object per line |
| Filter logs by request | `docker compose logs app \| grep <requestId>` |
| Apply migrations by hand | `docker compose exec app npx prisma migrate deploy` |
| Re-sync roles & permissions | `docker compose exec app npx tsx prisma/seed.ts` |
| Open a database shell | `docker compose exec db mysql -uroot -p smileon` |

**After changing `permission-registry.ts`,** re-run the seed. It upserts new permissions and prunes
ones that no longer exist in code.

---

## Health

| Endpoint | Answers | Who polls it |
| --- | --- | --- |
| `GET /api/health` | Is the process up? Never touches the database | Docker `HEALTHCHECK`, orchestrator liveness |
| `GET /api/health/ready` | Database reachable, migrations applied, storage driver | Load balancer readiness |

The split matters: a failing **liveness** probe restarts the container. If it checked the database,
a 30-second database blip would become a restart loop that makes the outage worse. Readiness only
removes the instance from rotation, which is the right response.

```bash
curl -s localhost:3000/api/health/ready | jq
```

---

## Backup and restore

### Two things need backing up

1. **The database** — all content, users, appointments, the audit log.
2. **The uploads volume** — every image. It is *not* in the database, and losing it is not
   recoverable from a SQL dump.

### Backup

```bash
# Database
docker compose exec -T db mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines --triggers smileon | gzip > smileon-$(date +%F).sql.gz

# Uploads
docker run --rm -v smileon_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

`--single-transaction` takes a consistent snapshot without locking writers out.

### Restore

```bash
gunzip < smileon-2026-08-07.sql.gz | \
  docker compose exec -T db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" smileon

docker run --rm -v smileon_uploads:/data -v "$PWD":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/uploads-2026-08-07.tar.gz -C /data"

docker compose restart app
```

**Test the restore on a scratch environment before you need it.** An untested backup is a guess.

---

## Rollback

```bash
docker compose down
git checkout <previous-tag>
docker compose up --build -d
```

**Migrations do not roll back automatically.** If the bad release added a migration, the old code
runs against the new schema — usually fine for additive changes (new column, new table), broken for
destructive ones. If a migration dropped or renamed something, restore the database from backup
instead of rolling the code back alone.

---

## Common incidents

### Locked out — no super admin

Promote an existing user directly:

```sql
INSERT INTO user_roles (userId, roleId, assignedAt)
SELECT u.id, r.id, NOW() FROM users u, roles r
WHERE u.email = 'you@smileon.pk' AND r.slug = 'super-admin';
```

Then bump `permissionsVersion` so the live session re-resolves:

```sql
UPDATE users SET permissionsVersion = permissionsVersion + 1 WHERE email = 'you@smileon.pk';
```

### Someone forgot their password and email isn't configured

Without `SMTP_HOST`, reset emails are logged rather than sent — look for the link in
`docker compose logs app`. Otherwise an administrator can set a password directly at
`/admin/users`.

### An editor published something wrong

`/admin/audit` shows who changed what and when, with before/after values. Filter by actor or date.
The log is append-only; there is no endpoint that edits or deletes it.

### The site is serving stale content

Content reads are cached for an hour and invalidated on save. If something looks stale after a save,
restart the app — the cache is in-process:

```bash
docker compose restart app
```

### Rotating `AUTH_SECRET`

Rotating it invalidates every session; everyone is signed out. That is the intended behaviour after
a suspected leak.

```bash
npx auth secret          # put the new value in .env
docker compose up -d --force-recreate app
```

---

## Scaling past one instance

Two things are per-instance and must change before a second replica:

1. **Local uploads** — set `STORAGE_DRIVER=s3` and complete `src/shared/storage/s3-driver.ts`.
   Otherwise each instance only serves the images it happened to receive.
2. **The rate limiter** — `src/shared/api/rate-limit.ts` holds counters in a `Map`. With N
   instances the effective limit is N× what you configured. Swap it for Redis.

The content cache is also per-instance, which is harmless: it means a save takes effect on one
instance immediately and on the others within the hour. If that matters, use a shared cache handler.

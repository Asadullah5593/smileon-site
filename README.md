# SmileOn

Full-stack **Next.js 16** application that serves both the public **smileon.pk** website and the **CMS** that manages it. One codebase, one deploy, one MySQL database — no separate API service.

- Public site: `/`
- CMS: `/admin` (sign in at `/login`)

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, `output: "standalone"`), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, shadcn/ui (new-york) on Radix, `lucide-react`, `sonner` |
| Database | MySQL 8+ via Prisma 7 (`@prisma/adapter-mariadb` driver adapter) |
| Auth | Auth.js v5, credentials provider, bcrypt, JWT sessions |
| Authorization | Dynamic RBAC — DB-backed roles & permissions, per-user overrides |
| Forms | react-hook-form + zod v4 (the same schema validates client **and** server) |
| Client state | TanStack Query, TanStack Table, `nuqs` for URL-synced filters |
| Editor | Tiptap → HTML, sanitized on write with DOMPurify |
| Media | Storage driver interface (`local` now, `s3` stub), `sharp` WebP + thumbnails |
| Testing | Vitest + Testing Library, Playwright for e2e |

## Quick start

```bash
cp .env.example .env          # then fill in DATABASE_URL and AUTH_SECRET
npx auth secret               # generates AUTH_SECRET for you

mysql -u root -p -e "CREATE DATABASE smileon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

npm install
npm run db:migrate            # creates the schema
npm run db:seed               # permissions, system roles, first admin, demo content
npm run dev
```

Sign in at <http://localhost:3000/login> with the credentials printed by the seed
(`admin@smileon.pk` / `ChangeMe123!` unless you set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
**Change that password immediately.**

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and server |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm test` / `test:watch` | Vitest unit tests |
| `npm run test:e2e` | Playwright (boots the dev server itself) |
| `npm run db:migrate` / `db:deploy` | Create a migration / apply migrations in production |
| `npm run db:seed` | Idempotent seed — also the **RBAC sync** |
| `npm run db:studio` | Prisma Studio |
| `npm run rbac:sync` | Push `permission-registry.ts` into the database |

> The build runs `prisma generate` first. The public site is rendered at request time
> (`export const dynamic = "force-dynamic"` in `app/(public)/layout.tsx`), so **the database does
> not need to be reachable at build time** — `docker build` works against no database at all.
> Speed comes from `unstable_cache` on the reads underneath, not from prerendering.

## Project layout

```
prisma/            schema.prisma, migrations, seed.ts
src/
  app/
    (public)/      the website — home, services, contact
    (auth)/        login
    admin/         the CMS
    api/           admin/*, public/*, media, auth, health
    sitemap.ts robots.ts
  features/<slice>/    schemas.ts · api.ts · components/ · server/
    access appointments admin auth media public-site services
  shared/
    api/     route-handler, error-response, http, list-query, rate-limit
    auth/    auth, permissions, permission-registry, permission-check, password
    db/      prisma client singleton
    storage/ driver interface + local & s3 drivers
    editor/  Tiptap editor + sanitizer
    seo/     JSON-LD helpers
    ui/      shadcn primitives + shared widgets
  proxy.ts   optimistic /admin gate (Next 16 renamed middleware → proxy)
```

**Rule of thumb:** nothing outside `features/*/server/` touches Prisma. That boundary is what
keeps the option of extracting a standalone API later a swap of one layer rather than a rewrite.

## How access control works

Three moving parts:

1. **`src/shared/auth/permission-registry.ts`** — the code-level catalogue of every permission
   (`services.update`, `media.upload`, `roles.delete`, …), derived from a resource × action table.
   **Code is the source of truth for what exists; the database stores who has what.**
   `npm run db:seed` upserts the registry into `permissions` and prunes anything stale.
2. **Roles** (`roles`, `role_permissions`) — created and edited in the CMS at `/admin/roles`
   using a resource × action matrix. Seeded system roles: Super Admin, Administrator,
   Content Editor, Author, Front Desk. System roles can be cloned but not deleted.
3. **Users** (`user_roles`, `user_permissions`) — a user gets any number of roles, plus optional
   per-user `ALLOW` / `DENY` overrides at `/admin/users`.

Effective permissions = `union(role permissions) + direct ALLOW − direct DENY`.
A role flagged `isSuperAdmin` short-circuits every check.

Enforcement points:

```ts
// Route handlers — this is the real gate.
export const PATCH = createRouteHandler(
  { permission: "services.update", body: serviceUpdateSchema },
  async ({ body, params, viewer }) => ok(await updateService(params.id, body, viewer.id)),
);

// Server components.
await requirePermission("services.read");

// Client UI — cosmetic only, the server still checks.
<Can permission="services.create"><NewServiceButton /></Can>
```

Changing someone's roles bumps `users.permissionsVersion`, so live sessions re-resolve rather
than waiting for the JWT to expire. Every role/user mutation writes to `audit_logs`.

### Adding a permission

1. Add the resource or action in `permission-registry.ts`.
2. `npm run rbac:sync`.
3. Reference it in the route handler and (optionally) in `features/admin/navigation.ts`.

The `/admin/roles` matrix picks it up automatically — there is no UI to update.

## Adding a content type

`Service` is the reference implementation; copy its five files:

| File | Role |
| --- | --- |
| `prisma/schema.prisma` | the model (+ `status`, `publishedAt`, the four SEO columns) |
| `features/services/schemas.ts` | zod schemas + DTO |
| `features/services/server/service-repository.ts` | all data access, audit, cache invalidation |
| `app/api/admin/services/{route,[id]/route}.ts` | endpoints wrapped in `createRouteHandler` |
| `features/services/{api.ts,components/}` | query keys, table, form |

Then add the permission resource to the registry and a sidebar entry in `features/admin/navigation.ts`.

## Media

Uploads go through `POST /api/media`. Raster images are re-encoded to WebP (which also strips EXIF
GPS data from phone photos) and get a 400px thumbnail. Files are addressed by a storage **key**, and
`STORAGE_DRIVER` decides where that key lives:

- `local` → `public/uploads/<folder>/<year>/<month>/…`, served by Next as static assets.
- `s3` → complete `src/shared/storage/s3-driver.ts` and set the `S3_*` variables. Nothing else changes.

## Deployment

```bash
docker compose up --build          # app + MySQL
docker compose exec app npx prisma migrate deploy
docker compose exec app npx tsx prisma/seed.ts
```

The image is multi-stage and ships `.next/standalone`. Mount a volume at `/app/public/uploads`
(compose does) or switch to the S3 driver before running more than one instance — the local driver
and the in-memory rate limiter are both per-instance.

`GET /api/health` returns `{ status: "ok", db: "up" }` for your load balancer.

## Known advisories

`npm audit` reports a high-severity nodemailer advisory pulled in transitively by `@auth/core`.
It concerns the message-level `raw` option, which this app never uses, and there is no fixed
version published yet. Re-check with `npm audit` after upgrading `next-auth`.

# SmileOn — Implementation plan

**Goal:** make everything the codebase already declares actually work, on a production-grade
setup — and stop there. No speculative features, no schema changes, no old-site parity.

smileon.pk was a reference for understanding the domain, not a migration source. Nothing in
this plan imports from it or mirrors its URLs.

---

## 0. Scope

### In

1. **The 14 admin modules** that have a model, a permission and a sidebar link — but no code.
2. **The 3 unused models** — `Invitation`, `PasswordResetToken`, `Redirect`.
3. **The 4 dead permissions** — `appointments.delete`, `appointments.export`, and every
   `*.publish` (see **F1**, this is a real access-control hole).
4. **Public wiring** — the site already reads `getTeam` / `getTestimonials` / `getFaqs` /
   `getMenu` / `getPrimaryLocation`; finish that, and give `Page` / `Post` / `GalleryCase` a URL
   so nothing in the CMS is write-only. `app/sitemap.ts` already emits `/blog/[slug]` and
   `/[slug]` — those routes get built rather than the sitemap trimmed.
5. **Production hardening** — Docker, caching, observability, CI. All four tracks.

### Out

| Not doing | Why |
| --- | --- |
| Any `prisma migrate` | The current schema covers every module in scope. Zero migrations. |
| `Service.kind`, `GalleryAlbum`, `TeamMember.experienceYears` | Were only needed for old-site parity. Dropped. |
| `/treatments`, `/dental-problems`, `/before-and-after` URLs | Same. Routes stay as scaffolded: `/services`, `/blog`, `/team`, `/gallery`. |
| WordPress / content import | Content is entered by hand through the CMS. |
| `Page.blocks` visual block editor | Column stays unused; v1 is `bodyHtml` + Tiptap. |
| Mega-menu, multi-language, payments, patient portal | New requirements if they ever arrive. |

### Design rules for this pass

- **No schema changes.** If a module seems to need one, it is out of scope — flag it instead.
- **Thin shared helpers, explicit modules.** Share only what is genuinely identical (§1).
  Each module keeps its own readable repository and routes. No generic CRUD factory —
  a future requirement should be a normal edit to one file, not a fight with an abstraction.
- **Every module ships its permission test.** The `*.publish` hole below is exactly what
  happens without one.

---

## 1. Findings in the existing code

Fix these first; three are security- or deploy-blocking.

| # | Severity | Finding |
| --- | --- | --- |
| **F1** | **High** | **Every `*.publish` permission is dead.** `PATCH /api/admin/services/[id]` requires only `services.update`, and `serviceUpdateSchema` accepts `status`. The **Author** role — defined as "writes posts but cannot publish" — can set `status: "PUBLISHED"` via `posts.update`. This replicates into all 8 publishable types unless fixed before they are built. |
| **F2** | **High** | **`.dockerignore` is missing.** The builder stage does `COPY . .`, so `.env` (real `DATABASE_URL` + `AUTH_SECRET`), `node_modules`, `.next` and `public/uploads/*` all enter the build context and the builder layer. Secrets in a cached layer, plus a slow, non-reproducible build. |
| **F3** | **High** | **The Docker build and the README contradict each other.** The README says "the database must be reachable at build time"; the Dockerfile builds with `DATABASE_URL="mysql://build:build@localhost:3306/build"`. `app/(public)/page.tsx` queries Prisma during prerender, so `docker build` either fails or silently produces empty pages. Must be resolved (§5, T1) — verify with an actual `docker build`. |
| **F4** | Medium | The `Redirect` model is written by nobody and read by nobody. |
| **F5** | Medium | `getMenu()` drops children (`filter(item => !item.parentId)`) and `SiteHeader` renders a flat list, so `MenuItem.parentId` is unusable. The footer is fully hardcoded — no menu, no socials, no hours. |
| **F6** | Medium | No `not-found.tsx` or `error.tsx` for `(public)`. A bad URL renders the framework default. |
| **F7** | Low | `setUserActive()` calls `updateUser()` (which already does `permissionsVersion: { increment: 1 }`) and then `bumpPermissionsVersion()` — double increment. |
| **F8** | Low | `permissionsVersion` is only re-read on `trigger === "update"`. `getViewer()` re-resolves from the DB on every request, so access is correct — the counter is currently decorative. Wire it in properly or drop it from the token. |
| **F9** | Low | `schema.prisma` documents `Page.blocks` as "see `src/features/pages/blocks.ts`" — that file does not exist. Update the comment to match the decision above. |
| **F10** | Low | `/admin` dashboard has a hardcoded `Pages: 0 — coming next` tile, and its stats are not permission-gated. |
| **F12** | Low | `app/admin/error.tsx` used the `reset` prop. In Next 16.3 `retry()` is the stable prop and re-fetches the failed segment; `reset()` only clears the boundary, so for a failed server render "Try again" re-renders the same failure. |
| **F13** | Low | Prettier fails on **125 files** — essentially the whole repo, predating this work. `format:check` exists in `package.json` but nothing runs it. Fixing it repo-wide is a mechanical commit that should stand alone, not ride along with feature work. |
| **F11** | **High** | **`/admin/users` is broken for the Administrator role.** `UsersManager.tsx:49` calls `rolesApi.list` unconditionally; `GET /api/admin/roles` requires `roles.read`; the seed gives Administrator every permission *except* `roles.*`. The query 403s, `roles` is `undefined`, and the role checkbox list renders empty with no error — so an Administrator can create a user but cannot assign any role to it, producing accounts with zero access and no way to fix them. Two fixes, both needed: grant Administrator `roles.read` (§8), and give that query an error branch instead of failing silently. |

---

## 2. The work list

### 2a. Dead sidebar links (12)

| Route | Permission | Model(s) |
| --- | --- | --- |
| `/admin/pages` | `pages.*` | `Page` |
| `/admin/posts` | `posts.*` | `Post`, `PostCategory`, `PostTag` |
| `/admin/team` | `team.*` | `TeamMember` |
| `/admin/testimonials` | `testimonials.*` | `Testimonial` |
| `/admin/faqs` | `faqs.*` | `FaqItem` |
| `/admin/gallery` | `gallery.*` | `GalleryCase` |
| `/admin/messages` | `messages.*` | `ContactMessage` |
| `/admin/locations` | `locations.*` | `Location` |
| `/admin/menus` | `menus.*` | `Menu`, `MenuItem` |
| `/admin/banners` | `banners.*` | `Banner` |
| `/admin/settings` | `settings.*` | `SiteSetting` |
| `/admin/audit` | `audit.read` | `AuditLog` |

### 2b. Permissions with no UI at all (2)

| Route to add | Permission | Model(s) |
| --- | --- | --- |
| `/admin/taxonomy` | `taxonomy.*` | `Category`, `Tag`, `ServiceCategory` |
| `/admin/redirects` | `redirects.*` | `Redirect` |

### 2c. Incomplete existing modules

| Module | Gap |
| --- | --- |
| Appointments | No `DELETE /api/admin/appointments/[id]`; no CSV export. Both permissions exist and are unreachable. |
| Services | `ServiceForm` has no category picker despite `categoryId` in the schema **and** the DTO. |
| Users | No invitation flow (`Invitation` unused); admin types the user's password in plaintext. |
| Auth | No password reset (`PasswordResetToken` unused); no self-service profile page; no rate limit on login. |

---

## 3. Shared helpers — build first

Five small modules. Nothing generic, nothing that hides a query.

| File | Contents | Replaces |
| --- | --- | --- |
| `shared/content/publishable.ts` | The `seoSchema` + `status` + `sortOrder` zod block; `PublishStatus` re-export; `stampPublishedAt(input, existing)` | The block copy-pasted into 9 schemas |
| `shared/auth/publish-guard.ts` | `assertCanSetStatus(viewer, resource, next, current)` — throws `ForbiddenError` unless the viewer holds `<resource>.publish` when moving out of `DRAFT` | **Fixes F1** |
| `shared/content/list.ts` | `buildSearchWhere(q, fields)` + a thin wrapper over the existing `toOrderBy` / `toSkipTake` / `paginate` | The identical `listX()` preamble |
| `shared/content/cache-tags.ts` | One exported const per resource, and `revalidateContent(tag)` | `revalidateTag("services")` string literals |
| `shared/ui/ResourceTable.tsx` | The `ServicesTable` shell — `nuqs` filters, pagination, skeleton, empty state, `Can`-gated actions, `ConfirmDialog`. Columns and row actions come in as props | ~120 duplicated lines × 12 tables |
| `shared/content/PublishingCard.tsx`, `SeoCard.tsx` | The right-hand column of `ServiceForm` | ~80 duplicated lines × 9 forms |

**Each module still owns:** its `schemas.ts`, its repository (its own `prisma.x` queries, its own
`include`/`select`, its own audit calls), its routes, and its form body. A module is ~150–250
readable lines.

**Then refactor `features/services/*` onto these helpers first** — it is the only slice with
tests and e2e coverage, so it proves the helpers before 13 modules depend on them.

---

## 4. The modules

Every module is the same five files:

```
features/<slice>/schemas.ts                 zod in + DTO out
features/<slice>/api.ts                     query keys + typed fetchers
features/<slice>/server/<x>-repository.ts   the only file touching prisma.<x>
features/<slice>/components/<X>Table.tsx    ResourceTable + columns
features/<slice>/components/<X>Form.tsx     form body + PublishingCard + SeoCard
app/api/admin/<x>/route.ts, [id]/route.ts   createRouteHandler, permission-gated
app/admin/<x>/page.tsx (+ new/, [id]/)      requirePermission + PageHeader
```

Below is only what differs from that shape.

### Group A — Publishable content

| Module | Notes | Public consumer |
| --- | --- | --- |
| **Pages** | Slug accepts nested paths (`about/values`); reserved-slug check against `services`, `blog`, `team`, `gallery`, `faqs`, `contact`, `admin`, `login`, `api`. `blocks` column left unused. | `/[...slug]` |
| **Posts** | Category + tag multi-selects (writes `PostCategory` / `PostTag` in one transaction); cover image; `readMinutes` auto-derived from word count; `authorId` defaults to the viewer. | `/blog`, `/blog/[slug]` |
| **Team** | Repeatable JSON editors for `qualifications`, `specialties`, `socials` — three simple string-array inputs, not a JSON textarea. Sortable list. | `/team` + homepage (already wired) |
| **Testimonials** | Inline dialog form: name, quote, 1–5 rating, optional photo, optional linked service. Publishing *is* the moderation step. | homepage (already wired) |
| **FAQs** | Grouped by the existing `group` column; reorder within a group; Tiptap answers. | `/faqs` + homepage (already wired) |
| **Gallery** | Paired before/after media picker with a side-by-side preview. Optional `serviceId` link. Flat list — no albums. | `/gallery` |

All six: `*.read/create/update/delete/publish`, and **`assertCanSetStatus` on create and update**.

### Group B — Non-publishable content

| Module | Notes | Public consumer |
| --- | --- | --- |
| **Taxonomy** | One page, three tabs: post categories, tags, service categories. Inline row editing, `sortOrder` drag, delete blocked while referenced (the `P2003` → `ConflictError` mapping already exists). | `/blog` filters, `/services` filter |
| **Locations** | A real 7-row opening-hours editor writing the `openingHours` JSON — not a raw textarea. Repository enforces exactly one `isPrimary`. | `/contact`, footer, header phone |
| **Menus** | Nested tree editor (2 levels is enough), item types: internal link picker / custom URL. **Fixes F5** — `getMenu()` returns a tree; `SiteHeader` renders one dropdown level; a `footer` menu replaces the hardcoded footer links. | header + footer |
| **Banners** | Sortable, media picker, heading/subheading/CTA, `isActive`. | homepage hero |
| **Settings** | `SiteSetting` is key → JSON. One zod schema **per key** in `features/settings/schemas.ts`, validated on write, with a typed `getSetting("brand")`. Tabs: **brand** (name, tagline, logo) · **contact** (phone, whatsapp, email, notification inbox) · **social** · **seo** (title template, default description, default OG image, global `noIndex` switch) · **analytics** (GA4 / GTM). | replaces every hardcoded string in the layout, footer and JSON-LD |
| **Redirects** | Table + single-add + bulk paste (`source,target,permanent`). Loop detection and a warning when `source` matches a live page. **Fixes F4.** | resolved by `/[...slug]` |
| **Messages** | New `api/admin/messages/route.ts` (GET) + `[id]/route.ts` (GET, PATCH `isRead`, DELETE) — the model currently only has `create`. Inbox UI: unread-first, read pane, `mailto:` reply, unread count badge in the sidebar. | — |
| **Audit log** | **GET only, no mutations ever.** Filters: actor, entity, action, date range. Detail drawer renders the `diff` JSON as a before/after list. | — |

### Group C — Completing what exists

| Item | Work |
| --- | --- |
| **Appointments** | Add `DELETE /api/admin/appointments/[id]` (`appointments.delete`) and `GET /api/admin/appointments/export` (`appointments.export`, streamed CSV honouring the current filters). Add a date-range filter and phone/WhatsApp deep links. |
| **Services** | Add the missing category picker to `ServiceForm`; refactor onto §3 helpers. |
| **Invitations** | `POST /api/admin/users/invite` → hashed token in `Invitation` → email → `(auth)/invite/[token]` where the invitee sets their own password → `User` created with the invited roles → `acceptedAt` stamped. The existing "admin sets a password" path stays as a fallback. Gated by `users.create`. |
| **Password reset** | `(auth)/forgot-password`, `(auth)/reset-password/[token]`, `api/public/password-reset` + `[token]`. Hashed single-use token, 1-hour expiry, rate-limited, identical response whether or not the email exists. Add a rate limit to the login route while here. |
| **Profile** (`/admin/profile`) | **No permission gate** — every signed-in user reaches their own. Name, avatar, email change, change password (requires current password), read-only "my roles". Handlers key strictly off `viewer.id`, never an `:id` param, or this becomes privilege escalation. |
| **Dashboard** (**F10**) | Real counts per module, each tile gated on the matching `*.read`; recent activity from `AuditLog` gated on `audit.read`. |
| **Navigation** | Add `Categories & tags`, `Redirects`, and a footer `My profile` entry to `features/admin/navigation.ts`. |

---

## 5. Public site

Only what makes the CMS non-write-only, plus what the site already half-reads.

| Route | Source | Note |
| --- | --- | --- |
| `/` | banners, services, team, testimonials, faqs, settings | Hero from `Banner`; hardcoded strings from `SiteSetting` |
| `/blog`, `/blog/[slug]` | `Post` | Paginated; category/tag filter; `Article` JSON-LD. Matches what `sitemap.ts` already emits |
| `/[...slug]` | `Page` → `Redirect` → 404 | Resolve `Page` by joined path; else a `Redirect` row → `permanentRedirect()` (308); else `notFound()`. Also matches `sitemap.ts` |
| `/team` | `TeamMember` | Grid; `Person` JSON-LD |
| `/gallery` | `GalleryCase` | Before/after pairs |
| `/faqs` | `FaqItem` | Grouped; `faqSchema` already exists |
| `/contact` | `Location` | Map embed, opening hours, WhatsApp — currently only the booking form |
| header / footer | `Menu` | **Fixes F5** |
| `not-found.tsx`, `error.tsx` | — | **Fixes F6** |

`app/sitemap.ts` needs no structural change once `/blog/[slug]` and `/[...slug]` exist — just
add team/gallery/faqs and honour the global `noIndex` setting.

---

## 6. Production

Four tracks, written against what is actually in the repo today.

### T1 — Docker & deploy hardening

| Item | Current | Change |
| --- | --- | --- |
| `.dockerignore` | **missing (F2)** | Add: `node_modules`, `.next`, `.git`, `.env*`, `public/uploads/*`, `test-results`, `playwright-report`, `docs`, `e2e`, `coverage` |
| Build-time DB | contradictory (**F3**) | Verify with a real `docker build`. Fix by making the public pages resilient at build (they are `unstable_cache`-wrapped already) or by declaring them dynamic — **not** by requiring a live DB during image build |
| Entrypoint | migrations run by hand | `docker-entrypoint.sh`: `prisma migrate deploy` → optional `db:seed` behind `RUN_SEED=1` → `node server.js`. Fails loudly if migrations fail |
| Security headers | 4 present | Add `Content-Security-Policy` and `Strict-Transport-Security`. CSP needs care with Next's inline bootstrap — use a nonce via `proxy.ts` |
| compose | healthchecks + `depends_on: condition` already good | Add `deploy.resources.limits`, MySQL `--max-connections` / buffer-pool tuning, a `migrate` one-shot service, and `env_file` |
| Prisma pool | driver-adapter defaults | Set explicit `connectionLimit` matched to `deploy.resources` |
| Image | `node:22-alpine`, non-root, healthcheck, standalone — already correct | Pin the digest; add OCI labels |

### T2 — Performance & caching

- Audit every `unstable_cache` tag against the new `cache-tags.ts` registry — a save in the CMS
  must invalidate exactly the pages that show it, and no more.
- `generateStaticParams` for `/services/[slug]`, `/blog/[slug]`, `/[...slug]`.
- Narrow `select:` on list queries (repositories currently `include` whole relations to build a
  DTO that uses two fields).
- Review the existing indexes against the actual `where` / `orderBy` shapes each new repository
  produces — the schema's indexes were written ahead of the queries.
- `@next/bundle-analyzer` behind an `ANALYZE=1` flag; Tiptap and the admin table stack should
  not reach public bundles.
- `next/image` everywhere; the media pipeline already emits WebP + a 400px thumbnail.
- Note the known limit: `shared/api/rate-limit.ts` is in-memory and per-instance. Fine for a
  single node; document Redis as the swap point rather than building it now.

### T3 — Observability & ops

- `shared/log.ts` — structured JSON logs with level, request id, route, duration, actor id.
  Replaces the `console.error` calls in `error-response.ts`, `audit-log.ts` and `email/index.ts`.
- Request id generated in `proxy.ts`, threaded through `createRouteHandler`, returned as a
  response header and included in the error body so a user-reported error is traceable.
- `/api/health` currently probes the DB only → split into **liveness** (process up) and
  **readiness** (DB + storage writable + migrations applied).
- Graceful shutdown on `SIGTERM` so in-flight requests drain.
- Error-tracking seam (a single `captureException` indirection) — Sentry-ready, not wired.
- `docs/RUNBOOK.md` — first deploy, migrate, seed, backup/restore MySQL + the uploads volume,
  rollback, rotate `AUTH_SECRET`, recover a locked-out super admin.

### T4 — CI & quality gates

Extend `.github/workflows/ci.yml` (already has a MySQL service + lint/typecheck/test/build):

- `npm run test:e2e` (Playwright) against the built app.
- `prisma migrate diff --exit-code` — fails if `schema.prisma` drifts from the migrations.
- `npm audit --audit-level=high`, with the documented nodemailer advisory allow-listed.
- `npm run format:check` (the script exists and nothing runs it).
- Build and push the image on a tag.
- Cache the Next build between runs.

---

## 7. Testing

| Layer | Coverage |
| --- | --- |
| Unit (vitest) | A schema test per module; the `assertCanSetStatus` truth table; slug uniqueness with nested paths; redirect-loop detection; each settings-key schema |
| **RBAC integration** | **One test per module × per role**, asserting 200/403 on read, write and **publish**. This is the suite that would have caught F1 — the highest-value tests in the plan |
| E2E (playwright) | Sign in as each of the 5 roles and assert the visible sidebar matches §8; create → publish → appears on the public URL, for one resource per group |

Gates: `lint`, `format:check`, `typecheck`, `test`, `test:e2e` green before a phase closes.

---

## 8. Role matrix — final state

`✓` = all actions · `R` = read only · `—` = none.

| Resource | Super Admin | Administrator | Content Editor | Author | Front Desk |
| --- | :---: | :---: | :---: | :---: | :---: |
| `services` | ✓ | ✓ | ✓ | — | R |
| `pages` | ✓ | ✓ | ✓ | — | — |
| `posts` | ✓ | ✓ | ✓ | ¹ | — |
| `taxonomy` | ✓ | ✓ | ✓ | R | — |
| `team` | ✓ | ✓ | ✓ | — | R |
| `testimonials` | ✓ | ✓ | ✓ | — | ² |
| `faqs` | ✓ | ✓ | ✓ | — | R |
| `gallery` | ✓ | ✓ | ✓ | — | — |
| `media` | ✓ | ✓ | ✓ | ³ | R |
| `appointments` | ✓ | ✓ | — | — | ⁴ |
| `messages` | ✓ | ✓ | — | — | ✓ |
| `locations` | ✓ | ✓ | — | — | R |
| `menus` | ✓ | ✓ | ⁵ | — | — |
| `banners` | ✓ | ✓ | ✓ | — | — |
| `settings` | ✓ | ✓ | R | — | — |
| `redirects` | ✓ | ✓ | ⁶ | — | — |
| `users` | ✓ | ✓ | — | — | — |
| `roles` | ✓ | **R** ⁷ | — | — | — |
| `audit` | ✓ | ✓ | — | — | — |

1. **Author → posts:** `read`, `create`, `update`. **No `publish`, no `delete`.** Unenforced
   today (**F1**); the publish guard makes it real.
2. **Front Desk → testimonials:** `read` + `create`. Reception records what patients say; an
   editor reviews and publishes it.
3. **Author → media:** `read` + `upload`. They add files, they don't curate the library.
4. **Front Desk → appointments:** `read`, `update`, `export`. **No `delete`** — enquiries are a
   business record.
5. **Content Editor → menus:** `read` + `update`. They may re-link an existing menu; only an
   Administrator creates or deletes one.
6. **Content Editor → redirects:** `read` + `create`. They cause the slug changes, so they must
   be able to preserve the old URL — but not remove someone else's redirect.
7. **Administrator → roles:** `read` only — **changed from today's empty set** (see **F11**).
   Without it `/admin/users` silently breaks: the role picker renders empty and an Administrator
   cannot assign a role to the users they are allowed to create. Read-to-use / write-to-change is
   the boundary used everywhere else in this matrix. `roles.create/update/delete` stay with the
   Super Admin, so an Administrator can attach an existing role but never change what a role means.

**Invariants already enforced in code — keep them:**
`isSuperAdmin` short-circuits every check and its permission set is not editable · the last
active super admin cannot be deactivated, demoted or deleted · system roles clone but never
delete · every role/user mutation bumps `permissionsVersion` and writes an `AuditLog` row ·
`/admin/profile` is the one route with no permission gate and must key off `viewer.id` alone.

### `prisma/seed.ts` changes

```ts
// Administrator — was: every permission except resource "roles"
permissions: [
  ...PERMISSIONS.filter((p) => p.resource !== "roles").map((p) => p.name),
  "roles.read",                            // ← F11: without this, /admin/users breaks
],

// Content Editor
permissions: [
  ...byResource(...CONTENT_RESOURCES),     // unchanged list
  ...byResource("media", "banners"),
  "menus.read", "menus.update",
  "settings.read",
  "redirects.read", "redirects.create",
],

// Author — unchanged, but now actually enforced
permissions: [
  "posts.read", "posts.create", "posts.update",
  "taxonomy.read", "media.read", "media.upload",
],

// Front Desk
permissions: [
  "appointments.read", "appointments.update", "appointments.export",
  ...byResource("messages"),
  "services.read", "team.read", "faqs.read", "locations.read", "media.read",
  "testimonials.read", "testimonials.create",
],
```

`Administrator` keeps picking up new resources automatically; the only change is the explicit
`roles.read` grant. `Super Admin` needs no change. Because `syncPermissions()` prunes stale rows and
`ensureSystemRoles()` replaces each system role's set on every run, `npm run db:seed` remains
the single idempotent RBAC sync — no new permission resources are introduced by this plan.

---

## 8b. Phase 1 — done

Shipped, with `typecheck` / `lint` / `test` (73 passing) / `prettier` green on every touched file.

| Item | Outcome |
| --- | --- |
| **F1** publish guard | `shared/auth/publish-guard.ts` + 20 tests. Enforced in the services repository on create and update. Rule is **visibility**, not status equality — see the module docblock |
| **F2** `.dockerignore` | Added. `.env`, `node_modules`, `.next`, `public/uploads/*` no longer enter the build context |
| **F3** Docker build | **Was genuinely broken** — reproduced the Dockerfile's env and `next build` died prerendering `/`. Fixed with `dynamic = "force-dynamic"` on `app/(public)/layout.tsx`; the build now completes against **no database**. README corrected |
| **F7** double increment | `setUserActive` no longer bumps `permissionsVersion` twice |
| **F9** `Page.blocks` comment | Now says what is true: reserved, unread, bodies are `bodyHtml` |
| **F10** dashboard | Placeholder tile gone. Tiles are a declarative list; a viewer only triggers queries for tiles they may see |
| **F11** Administrator | `roles.read` granted in `seed.ts`; the roles query in `UsersManager` now shows an explanatory error instead of an empty picker |
| **F12** error prop | `reset` → `retry` in the admin boundary |
| **F6** boundaries | `(public)/not-found.tsx` and `(public)/error.tsx` added |
| Helpers | `content/publishable.ts`, `content/cache-tags.ts`, `content/PublishingCard.tsx`, `content/SeoCard.tsx`, `content/StatusFilter.tsx`, `ui/ResourceTable.tsx`, `ui/FieldError.tsx` |
| Services refactor | Table −38%, form −10%, on the shared helpers. Proves the kit before 13 modules depend on it |

**Deviations from the plan, and why:**

1. **Dropped `shared/content/list.ts`.** The planned `searchWhere` helper replaced one already-readable
   line with generic Prisma typing gymnastics. Not worth it — the rule was thin helpers, so it went.
2. **Added `StatusFilter` and `FieldError`,** which weren't planned but are genuinely duplicated
   across every content module.
3. **No new sidebar entries.** The plan had Phase 1 adding `Categories & tags`, `Redirects` and
   `My profile` to `navigation.ts`. Those pages don't exist until Phases 3–6, so adding them now
   would create *new* dead links — the exact thing this work removes. Each entry lands with its module.
4. **Content repositories now take `viewer: Viewer`, not `actorId: string`.** The publish check needs
   permissions *and* the record's current status, so the repository is the only place with both. This
   is the convention the other modules follow. Non-content repositories (users, roles, media,
   appointments) keep `actorId` — they have no publish concept.
5. **Removed `setServiceStatus`** — defined, never called.
6. **F3 fixed by rendering at request time, not by giving the build a database.** A build-time DB
   would couple the image to an environment and force a rebuild per deploy target. The cost is
   CDN-cacheable static HTML; the `unstable_cache` layer keeps MySQL out of the request path anyway.

**Not verified:** the actual `docker build` — Docker isn't installed in this environment. The failing
step *inside* it (`next build` with no DB) is fixed and verified. The image-layer changes are
straightforward but untested end to end.

---

## 8c. Phase 2 — done

Messages built, appointments completed. `typecheck` / `lint` / `test` (91 passing) / `prettier` green.

| Item | Outcome |
| --- | --- |
| **Messages module** | Full slice — `schemas` · `api` · `server/message-repository` · `MessagesInbox` · `GET /api/admin/messages` · `GET,PATCH,DELETE /api/admin/messages/[id]` · `/admin/messages`. Unread-first ordering matches the existing `@@index([isRead, createdAt])`. Opening a message marks it read; the page header counts unread |
| **`ContactMessage` ownership moved** | It lived in the *appointments* repository — the one place a repository touched another module's table. Schema, repository function and tests now sit in `features/messages/`, and `api/public/contact` points at them |
| **`appointments.delete`** | `DELETE /api/admin/appointments/[id]` + repository function. Permission is no longer dead |
| **`appointments.export`** | `GET /api/admin/appointments/export` — CSV over the *same* `where` the list uses (extracted to `toWhere`), so an export is exactly what the operator is looking at. Capped at 5000 rows. Audited despite being a read, because patient contact details leave the building |
| **Appointments inbox** | Rebuilt on `ResourceTable`; adds a date-range filter, `tel:`/`wa.me` row actions, and delete |
| **Front Desk role** | Loses `appointments.delete` (a business record), gains `services.read` + `media.read` so reception can answer questions |
| Tests | +18 — CSV escaping, message schemas, appointment list query |

**Worth knowing:**

- **`shared/api/csv.ts` guards against formula injection.** Export cells contain public form input
  (patient names, free-text messages). A value starting with `=`, `+`, `-` or `@` executes as a
  formula when the file is opened in Excel or Sheets — a route to exfiltrating data from whoever
  opens it. Such values get a leading apostrophe. Also emits a UTF-8 BOM so Excel doesn't mangle
  non-ASCII names. Seven tests cover it.
- **Marking a message read is not audited.** It fires every time someone opens one; burying real
  changes under that noise would make the audit log useless. Deletion *is* audited.
- **Seed grants were held back.** §8 lists `team.read`, `faqs.read`, `locations.read` and
  `testimonials.*` for Front Desk, and `banners`/`menus`/`settings`/`redirects` for Content Editor.
  Those sidebar entries are permission-gated, so granting them now would show Front Desk links to
  pages that 404. Each grant lands with its module.

---

## 8d. Phase 3 — done

Seven modules. `typecheck` / `lint` / `test` (122 passing) / `prettier` green; build clean.

| Module | Shape | Notes |
| --- | --- | --- |
| **FAQs** | dialog | Free-text `group` with a datalist of groups already in use |
| **Testimonials** | dialog | Rating, optional photo and linked treatment. Publishing *is* moderation |
| **Team** | full pages | `StringListField` for qualifications and specialties — a JSON textarea would be a reliable way to save invalid JSON |
| **Before & after** | dialog | Paired media picker; a case cannot be **published** with only one of the pair |
| **Categories & tags** | tabs | Three tables, one permission, one repository, a `kind` discriminator. A term in use reports its count and refuses to delete |
| **Pages** | full pages | Nested slugs (`about/our-values`) with a live address preview and a reserved-prefix guard |
| **Blog posts** | full pages | Category/tag multi-select written in one transaction; `readMinutes` derived from the body |

**Two bugs caught while building, both of which would have shipped silently:**

1. **`slugify` uses `strict: true`, which strips `/`.** A page slugged `about-us/our-values`
   would have been mangled to `about-usour-values` — a valid address the editor typed, silently
   changed. Added `slugifyPath()` (slugify per segment) and a `normalize` parameter on
   `uniqueSlug`. Four tests, one of which asserts the old behaviour to document why the helper exists.
2. **`htmlToText` truncates to 200 characters by default.** Using it to count words for
   `readMinutes` would have made *every* post "1 min read" regardless of length.

**Adjustments to the Phase 1 helpers, driven by what the models actually have:**

- `publishableSchema` originally bundled status + sortOrder + SEO. Wrong: `Page` and `Post` have
  no `sortOrder` column, and FAQs/testimonials/team/gallery have no SEO columns. Split into
  `statusSchema` → `orderedStatusSchema` → `publishableSchema`, each module spreading what its
  table has. `PublishingCard` gained `showSortOrder`.
- Added `useResourceFilters` (the nuqs page/q/status trio, used by all seven),
  `MultiSelectField` and `StringListField`.
- `ServiceOption` moved into `features/services/schemas` — gallery was importing it from a
  *testimonials component*, which is the kind of cross-slice dependency the layout exists to prevent.

**Also:** `Categories & tags` added to the sidebar (its page now exists). Front Desk gained
`team.read`, `faqs.read`, `testimonials.read` and `testimonials.create` — reception writes up what
a patient said, an editor publishes it. `next typegen` regenerates `PageProps` types without a
full build, which is what new dynamic admin routes need.

**Still deferred:** the Content Editor grants for `banners`/`menus`/`settings`/`redirects`, and
Front Desk's `locations.read` — those modules land in Phase 4.

---

## 8e. Phase 4 — done

Five modules plus the public catch-all. `typecheck` / `lint` / `test` (149 passing) / `prettier`
green; build clean. **`/admin/audit` is now the only dead sidebar link left.**

| Module | Notes |
| --- | --- |
| **Locations** | Seven-row opening-hours editor writing the JSON column — a textarea would be a reliable way for reception to save invalid JSON. Repository enforces exactly one primary, in a transaction, and promotes a replacement if the primary is deleted (the header, footer and contact page all read it) |
| **Banners** | Homepage hero, with the hardcoded copy kept as the fallback for a site that hasn't set one up. Inline active toggle in the list |
| **Settings** | Five typed groups (brand · contact · social · SEO · analytics). **Writes are strict, reads are lenient** — nothing invalid enters the table, and a bad row falls back to defaults rather than taking the site down. Analytics ids are format-checked, because a malformed one injects a broken tag into every page |
| **Navigation** | **Fixes F5.** Two-level menus with reorder, a self-parent and descendant-cycle guard, and one-click creation of the `header`/`footer` menus the site expects |
| **Redirects** | **Fixes F4.** Single-add and bulk paste; loop detection walks the whole chain, not just one hop. A 60-line paste with one typo imports 59 and hands back the bad lines to correct |

**Public wiring:**

- **`/[...slug]`** — the catch-all that finally gives Pages a URL *and* becomes the redirect
  table's only reader: published page → redirect (308/307) → 404.
- **Header** renders real dropdowns from the menu tree; opens on hover **and** `focus-within`, so
  it works from the keyboard with no JS state.
- **Footer** is no longer hardcoded: footer menu, socials, opening hours and brand from the CMS.
- **Homepage hero** comes from the first active banner.

**Worth knowing:**

1. **`toMenuTree` promotes orphans to roots.** An item whose parent was deleted stays in the menu
   instead of silently vanishing. Eight tests, one of which pins the old drop-the-children bug.
2. **Redirect sources are normalised** (`/old/` → `/old`), so one rule covers both forms — and a
   self-redirect is caught even when written as `/loop/` → `/loop`.
3. **`lucide-react` v1 dropped brand icons**, so footer socials are labelled text links. A
   wrong-looking approximation of someone's logo is worse than the word.
4. Three `watch()` calls tripped `react-hooks/incompatible-library`; converted to `Controller`,
   matching every other form in the codebase.

**Role grants now that the modules exist:** Content Editor gained `banners.*`,
`menus.read`/`update`, `redirects.read`/`create` and `settings.read`. Front Desk gained
`locations.read`.

---

## 8f. Phase 5 — done

Audit log, invitations, password reset and self-service profile. `typecheck` / `lint` /
`test` (166 passing) / `prettier` green; build clean.

**Every sidebar link now resolves — 20/20, verified against `navigation.ts`. All three
previously-unused models (`Invitation`, `PasswordResetToken`, `Redirect`) are wired.**

| Item | Notes |
| --- | --- |
| **Audit log** | Filter by actor / action / date, detail drawer rendering the `diff` as before/after, CSV export. **GET only** — no update or delete route exists, because a trail an administrator can edit is not a trail. Facets come from the data, so filters only offer values that occur |
| **Invitations** | Invite by email + roles → hashed token → invitee sets their own password. Re-inviting supersedes the outstanding link. Panel lives under Users, so the whole staff lifecycle is one screen |
| **Password reset** | `/forgot-password` → emailed link → `/reset-password/[token]`. Single-use, 1-hour, hashed, rate-limited |
| **Profile** (`/admin/profile`) | The one route with **no permission gate**. Name, password change, read-only roles. Reached from the account menu |
| **Login rate limit** | 10 attempts per client per 5 minutes in the credentials provider |

**Security decisions worth recording:**

1. **Tokens are stored only as SHA-256 hashes.** `createOneTimeToken`/`hashToken` already existed
   in `password.ts` and were unused — this is what they were for. A database leak cannot be
   replayed into an account.
2. **The reset request always answers 204**, whether or not the address has an account, and the UI
   shows the same "check your inbox" either way. A different response for unknown emails is an
   account-enumeration oracle. Deactivated accounts get no link and no distinguishable answer.
3. **Rate-limit rejection at login returns `null`, not an error** — identical to a wrong password,
   so a throttled attacker learns nothing from the difference.
4. **`profileUpdateSchema` has no `id`, `roleIds` or `isActive`.** The endpoint acts on
   `viewer.id` alone; accepting an id would turn the only permission-free route into privilege
   escalation. A test asserts those keys are stripped.
5. **Changing a password requires the current one**, and voids any outstanding reset links.
6. Both token-consuming writes run in a transaction, so a failure can't spend a token without
   applying the change.

---

## 8g. Phase 6 — done

Public routes for every content type. `typecheck` / `lint` / `test` (176 passing) / `prettier`
green; build clean. **Nothing in the CMS is write-only any more.**

| Route | Source |
| --- | --- |
| `/blog`, `/blog/[slug]` | `Post` — category filter, cover, tags, related posts, `BlogPosting` JSON-LD |
| `/team` | `TeamMember` — photo, qualifications, specialties, bio, `Physician` JSON-LD |
| `/gallery` | `GalleryCase` — paired before/after with captions, linked back to the treatment |
| `/faqs` | `FaqItem` — grouped, `FAQPage` JSON-LD |
| `/contact` | Rebuilt: map embed, full opening hours, WhatsApp, emergency number, `openingHoursSpecification` |
| `/[...slug]` | `Page` → `Redirect` → 404 (Phase 4) |

**The `noIndexSite` kill switch now actually works.** It was a setting nothing read. It needed
three separate things, because each covers a different failure:

1. **`robots.txt`** returns `disallow: /` — stops further crawling.
2. **`sitemap.xml`** returns empty — publishing a sitemap while hiding the site invites the exact
   crawling the switch prevents.
3. **A `noindex` meta tag on every public page**, via `generateMetadata` on the public layout —
   this is the only one of the three that *removes* an already-indexed page. robots.txt alone
   would have left old results in place, which is the failure mode people actually hit.

It sits on the public layout rather than the root layout so `/robots.txt` and `/_not-found` stay
static and the build still needs no database.

**Also:** the sitemap gained the new routes and dropped the `/blog/[slug]` and `/[slug]` entries
that used to 404. `robots.txt` now also excludes the token URLs (`/invite/`, `/reset-password/`).
The header's fallback menu was verified to point only at routes that exist.

**Tests:** +10 unit tests for the JSON-LD helpers (including that half-filled opening hours emit
nothing rather than a malformed spec). The e2e suite grew from 5 cases to 13 — every new public
route, the 404 page, robots/sitemap, the reset-request enumeration guard, an invalid invite token,
and an assertion that the audit log rejects POST/PATCH/DELETE. **The e2e suite has not been run
here** — it needs a database and a booted server.

---

## 8h. Phase 7 — done

Production hardening, all four tracks. `typecheck` / `lint` / `test` (176) / `format:check`
green — **F13 closed, the whole repo is formatted**, which CI now enforces.

### T1 — Docker & deploy
- **CSP with a per-request nonce** in `proxy.ts` (`.dockerignore` and the build fix landed in Phase 1).
- **HSTS**, production-only — pinning it from a localhost dev server would force https for every
  other project on localhost.
- **`docker-entrypoint.sh`** — `set -e` then `migrate deploy`, so a failed migration stops the
  container instead of serving against a half-migrated schema. `exec "$@"` makes node PID 1 so it
  receives SIGTERM. Seeding is opt-in via `RUN_SEED=1`.
- **compose** — utf8mb4 server-side, buffer pool sized to the memory limit, `connection_limit=10`
  in the URL (per instance opens its own pool), `stop_grace_period`, log rotation, memory limits.

### T3 — Observability
- `shared/observability/logger.ts` — dependency-free structured JSON, one line per event.
- **Request ids** generated in `createRouteHandler`, returned as `X-Request-Id`, echoed in 5xx
  bodies and attached to every log line. A user-reported error is now one grep.
- **Health split into liveness and readiness.** `/api/health` never touches the database:
  a failing liveness probe *restarts* the container, so checking a dependency there turns a
  30-second blip into a restart loop. `/api/health/ready` checks database, pending migrations and
  the storage driver, and returns 503 so a load balancer drains the instance instead.
- `docs/RUNBOOK.md` — first deploy, backup/restore (**including the uploads volume, which no SQL
  dump covers**), rollback with the migration caveat, locked-out recovery, secret rotation.

### T4 — CI
e2e against a seeded database, **`prisma migrate diff --exit-code`** (catches a schema edit with no
migration — works locally, breaks in production), `format:check`, Playwright report on failure,
Next build cache, a non-blocking `npm audit` job, and a Docker image build that proves the
Dockerfile still needs no database.

### T2 — Performance
- The planned `generateStaticParams` work **does not apply**: the public site is request-rendered
  (§8b, F3), so there is nothing to prerender. Speed comes from `unstable_cache` + tags instead.
- **Index review against the actual queries.** Every hot path is covered by an existing index —
  `faqs(status, group, sortOrder)`, `messages(isRead, createdAt)`, `appointments(status, createdAt)`,
  `redirects.source` (unique). Two gaps found, **both left alone because an index is a schema
  change and this pass adds no migrations**: `audit_logs.action` is unindexed (filtering by action
  alone scans), and `pages`/`services` default to `ORDER BY updatedAt` with no index on it. Both
  are small-table scans today; revisit if the audit log grows past a few hundred thousand rows.
- Bundle analyzer skipped rather than add a dependency for a dev-only convenience.

**Known limitation of the nonce CSP:** a nonce can only be applied during server rendering, so any
prerendered page's scripts are blocked by `script-src 'strict-dynamic'`. Every route is now dynamic
**except `/_not-found`** — Next's built-in fallback, reachable only for paths no route matches
(`/[...slug]` catches all public paths, so in practice only unmatched `/admin/*` URLs behind
auth). Its HTML renders; it just won't hydrate. Fixing it means a root `app/not-found.tsx` that is
also dynamic.

**`style-src` keeps `'unsafe-inline'` deliberately.** Radix sets inline `style` *attributes* at
runtime to position dialogs, dropdowns and selects, and a nonce cannot cover style attributes — a
strict `style-src` would break most of the admin UI. Script injection stays fully locked down,
which is the attack that matters.

**Not verified here:** the real `docker build` and the e2e suite (no Docker, no database in this
environment). CI now runs both.

---

## 8i. Phase 8 — done

The verification suite. **270 tests across 21 files** (from 176). `typecheck` / `lint` /
`format:check` / build all green.

### The role matrix is now executable

`prisma/seed.ts` held the five role definitions inline, in a file with top-level side effects
that no test could import. They moved to **`src/shared/auth/system-roles.ts`**; the seeder imports
them, and `system-roles.test.ts` asserts them against the matrix in §8 above.

The test declares the matrix as data — `"all"` / `"read"` / `"none"` / an explicit action list —
and checks **every role against every action of every resource**. It also asserts each role's
entry **covers every resource in the registry**, so adding a resource forces an explicit decision
per role rather than an accidental silent grant or denial.

Plus the F1 regression tests, evaluated through `canSetStatus` rather than a re-implementation:
an author cannot publish, unpublish, or create something already live — but *can* still edit a
post that is already live.

### The route audit found a real problem

`route-gates.test.ts` reads every `src/app/api/**/route.ts` and asserts:

- every permission string referenced **exists in the registry** — a typo like `servcies.read`
  fails for everyone, and no happy-path test run as a super admin would ever notice;
- every admin route **declares a gate**, or appears in an allow-list with a written reason
  (only the two self-service `/api/admin/profile` routes do);
- the allow-list stays honest — an entry that gains a gate, or stops existing, fails;
- no `/api/public/*` route declares a permission, which would make it permanently unreachable;
- every write handler goes through `createRouteHandler`.

**That last one failed on first run:** `POST /api/media` was a hand-rolled handler with its own
`try`/`catch`. It *was* correctly gated, but it bypassed the wrapper — and therefore the access
logging and `X-Request-Id` added in Phase 7, so file uploads produced no log line at all.

Its comment claimed the wrapper couldn't be used because "multipart uploads bypass the wrapper's
JSON body parsing". That was wrong: `createRouteHandler` only calls `req.json()` **when a `body`
schema is declared**. With no schema it never touches the body, so the handler can read
`req.formData()` itself. Converted — uploads now get the same enforcement, error mapping, logging
and request id as every other endpoint, and the duplicated `try`/`catch` is gone.

### Note on running the suite

The default `forks` pool failed to spawn workers repeatedly in the development sandbox — including
on files that had passed minutes earlier, so it is resource pressure rather than a code problem.
`npx vitest run --pool=threads` runs clean. The config is left alone: changing the pool on the
evidence of one constrained machine would be the wrong inference.

---

## 9. Sequencing

| Phase | Delivers | Depends on |
| --- | --- | --- |
| **1 — Foundations** ✅ | Done — see §8b | — |
| **2 — Enquiries** ✅ | Done — see §8c | 1 |
| **3 — Publishable content** ✅ | Done — see §8d | 1 |
| **4 — Site chrome** ✅ | Done — see §8e | 1 |
| **5 — Access & accounts** ✅ | Done — see §8f | 1 |
| **6 — Public wiring** ✅ | Done — see §8g | 3, 4 |
| **7 — Production** ✅ | Done — see §8h | 1 |
| **8 — Verification** ✅ | Done — see §8i | all |

Phases 2–5 are independent and can run in any order or in parallel. **Phase 1 is the only hard
gate** — building a module before the helpers exist means writing it twice, and building it
before the publish guard means shipping F1 thirteen more times.

**Fastest path to "nothing is dead":** 1 → 2 (closes two dead permissions and gives Front Desk a
complete job) → 3 → 4 → 5 → 6 → 7 → 8.

---

## 10. Deliberately deferred

Each of these is a one-module change on top of what this plan builds, if a requirement ever
arrives:

- Row-level ownership ("authors edit only their own drafts") — a `where` clause in the post
  repository when the viewer lacks `posts.publish`.
- Redis-backed rate limiting — swap the `Map` in `shared/api/rate-limit.ts`.
- S3 storage — `shared/storage/s3-driver.ts` is a stub behind an existing interface;
  `STORAGE_DRIVER=s3` is the only other change.
- Scheduled publishing, content versioning, audit-log retention, multi-language, a visual
  block editor for `Page.blocks`.

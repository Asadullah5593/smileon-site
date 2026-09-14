import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PERMISSION_NAMES } from "@/shared/auth/permission-registry";

/**
 * Static audit of every API route's permission gate.
 *
 * Two failures this catches that nothing else does:
 *
 *   1. A typo'd permission string (`servcies.read`). It is not in the database,
 *      so the check fails for everyone — the feature is silently broken for
 *      every role including the super admin's colleagues, and no test that
 *      exercises the happy path with a super admin would notice.
 *   2. A new admin route shipped with no gate at all, which is open to any
 *      signed-in user.
 */

const API_ROOT = path.join(process.cwd(), "src", "app", "api");

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return entry === "route.ts" ? [full] : [];
  });
}

const routes = routeFiles(API_ROOT).map((file) => ({
  file,
  /** POSIX-style route path, e.g. `/api/admin/services/[id]`. */
  route: `/api/${path.relative(API_ROOT, path.dirname(file)).split(path.sep).join("/")}`,
  source: readFileSync(file, "utf8"),
}));

const adminRoutes = routes.filter((r) => r.route.startsWith("/api/admin"));

/**
 * Admin routes that intentionally have no `permission` option. Each one must
 * justify itself here, so adding an ungated route is a deliberate act.
 */
const UNGATED_BY_DESIGN: Record<string, string> = {
  "/api/admin/profile": "Self-service: every signed-in user may edit their own account.",
  "/api/admin/profile/password":
    "Self-service: changing your own password, guarded by the current one.",
};

describe("api route permission gates", () => {
  it("finds the route files", () => {
    expect(routes.length).toBeGreaterThan(20);
    expect(adminRoutes.length).toBeGreaterThan(15);
  });

  it("only references permissions that exist in the registry", () => {
    const known = new Set(PERMISSION_NAMES);
    const bad: string[] = [];

    for (const { route, source } of routes) {
      // `permission: "x.y"`, `permission: ["x.y", ...]`, `anyPermission: [...]`
      for (const match of source.matchAll(
        /(?:permission|anyPermission):\s*(\[[^\]]*\]|"[^"]*")/g,
      )) {
        for (const name of match[1].matchAll(/"([^"]+)"/g)) {
          if (!known.has(name[1])) bad.push(`${route} → ${name[1]}`);
        }
      }
    }

    expect(bad, "unknown permission(s) referenced").toEqual([]);
  });

  it("gates every admin route, or documents why not", () => {
    const ungated = adminRoutes
      .filter(({ source }) => !/(?:permission|anyPermission):/.test(source))
      .map((r) => r.route)
      .filter((route) => !(route in UNGATED_BY_DESIGN));

    expect(ungated, "admin route(s) with no permission gate").toEqual([]);
  });

  it("keeps the ungated allow-list honest", () => {
    // If a route on the list grows a gate, or disappears, the entry should go.
    for (const route of Object.keys(UNGATED_BY_DESIGN)) {
      const match = adminRoutes.find((r) => r.route === route);
      expect(match, `${route} is allow-listed but does not exist`).toBeDefined();
      expect(/(?:permission|anyPermission):/.test(match!.source)).toBe(false);
    }
  });

  it("routes every write through createRouteHandler", () => {
    // The wrapper is what enforces permissions, parses input and maps errors.
    // A raw `export async function POST` bypasses all three.
    const raw = routes
      .filter(({ source }) =>
        /export\s+(?:async\s+)?function\s+(POST|PATCH|PUT|DELETE)\b/.test(source),
      )
      .map((r) => r.route);

    expect(raw, "write handler(s) not using createRouteHandler").toEqual([]);
  });

  it("never gates a public route", () => {
    // `/api/public/*` is unauthenticated by definition; a permission there
    // would mean it was never reachable.
    const gated = routes
      .filter((r) => r.route.startsWith("/api/public"))
      .filter(({ source }) => /(?:permission|anyPermission):/.test(source))
      .map((r) => r.route);

    expect(gated).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { PERMISSIONS, PERMISSION_RESOURCES } from "@/shared/auth/permission-registry";
import { SYSTEM_ROLE_DEFINITIONS } from "@/shared/auth/system-roles";
import { viewerCan } from "@/shared/auth/permission-check";
import { canSetStatus } from "@/shared/auth/publish-guard";

/**
 * The role matrix, asserted.
 *
 * `docs/IMPLEMENTATION-PLAN.md` §8 documents what each role may do. Docs drift;
 * this file makes the matrix executable, so a role quietly gaining or losing a
 * permission fails the build instead of surprising someone in production.
 */

const roles = Object.fromEntries(
  SYSTEM_ROLE_DEFINITIONS.map((role) => [
    role.slug,
    { isSuperAdmin: role.isSuperAdmin, permissions: role.permissions },
  ]),
);

const can = (slug: string, permission: string) => viewerCan(roles[slug], permission);

/** `✓` all actions · `R` read only · `—` none · array = exactly these actions. */
type Expectation = "all" | "read" | "none" | string[];

const MATRIX: Record<string, Record<string, Expectation>> = {
  administrator: {
    services: "all",
    pages: "all",
    posts: "all",
    taxonomy: "all",
    team: "all",
    testimonials: "all",
    faqs: "all",
    gallery: "all",
    media: "all",
    appointments: "all",
    messages: "all",
    locations: "all",
    menus: "all",
    banners: "all",
    settings: "all",
    redirects: "all",
    users: "all",
    audit: "all",
    // The one carve-out: an administrator may see the permission model but not
    // change it.
    roles: "read",
  },
  "content-editor": {
    services: "all",
    pages: "all",
    posts: "all",
    taxonomy: "all",
    team: "all",
    testimonials: "all",
    faqs: "all",
    gallery: "all",
    media: "all",
    banners: "all",
    menus: ["read", "update"],
    redirects: ["read", "create"],
    settings: "read",
    appointments: "none",
    messages: "none",
    locations: "none",
    users: "none",
    roles: "none",
    audit: "none",
  },
  author: {
    posts: ["read", "create", "update"],
    taxonomy: "read",
    media: ["read", "upload"],
    services: "none",
    pages: "none",
    team: "none",
    testimonials: "none",
    faqs: "none",
    gallery: "none",
    appointments: "none",
    messages: "none",
    locations: "none",
    menus: "none",
    banners: "none",
    settings: "none",
    redirects: "none",
    users: "none",
    roles: "none",
    audit: "none",
  },
  "front-desk": {
    appointments: ["read", "update", "export"],
    messages: "all",
    services: "read",
    team: "read",
    faqs: "read",
    locations: "read",
    media: "read",
    testimonials: ["read", "create"],
    pages: "none",
    posts: "none",
    taxonomy: "none",
    gallery: "none",
    menus: "none",
    banners: "none",
    settings: "none",
    redirects: "none",
    users: "none",
    roles: "none",
    audit: "none",
  },
};

function actionsFor(resource: string) {
  return PERMISSION_RESOURCES.find((r) => r.resource === resource)!.actions.map((a) => a.action);
}

function expected(expectation: Expectation, resource: string): string[] {
  if (expectation === "all") return actionsFor(resource);
  if (expectation === "read") return ["read"];
  if (expectation === "none") return [];
  return expectation;
}

describe("system role definitions", () => {
  it("defines exactly the five documented roles", () => {
    expect(SYSTEM_ROLE_DEFINITIONS.map((r) => r.slug).sort()).toEqual([
      "administrator",
      "author",
      "content-editor",
      "front-desk",
      "super-admin",
    ]);
  });

  it("grants only permissions that exist in the registry", () => {
    const known = new Set(PERMISSIONS.map((p) => p.name));
    for (const role of SYSTEM_ROLE_DEFINITIONS) {
      const unknown = role.permissions.filter((name) => !known.has(name));
      expect(unknown, `${role.slug} grants unknown permission(s)`).toEqual([]);
    }
  });

  it("gives the super admin the flag rather than a permission list", () => {
    const superAdmin = SYSTEM_ROLE_DEFINITIONS.find((r) => r.slug === "super-admin")!;
    expect(superAdmin.isSuperAdmin).toBe(true);
    expect(superAdmin.permissions).toEqual([]);
    // The flag short-circuits everything, including permissions nobody holds.
    expect(can("super-admin", "roles.delete")).toBe(true);
  });

  it("makes exactly one role a super admin", () => {
    expect(SYSTEM_ROLE_DEFINITIONS.filter((r) => r.isSuperAdmin)).toHaveLength(1);
  });
});

describe("the role matrix", () => {
  for (const [slug, resources] of Object.entries(MATRIX)) {
    describe(slug, () => {
      for (const [resource, expectation] of Object.entries(resources)) {
        const allowed = new Set(expected(expectation, resource));

        it(`${resource}: ${expectation === "none" ? "no access" : [...allowed].join(", ")}`, () => {
          for (const action of actionsFor(resource)) {
            const permission = `${resource}.${action}`;
            expect(can(slug, permission), `${slug} ${permission}`).toBe(allowed.has(action));
          }
        });
      }

      it("covers every resource in the registry", () => {
        // A new resource must be an explicit decision for every role, not an
        // accidental omission that silently grants or denies.
        expect(Object.keys(resources).sort()).toEqual(
          PERMISSION_RESOURCES.map((r) => r.resource).sort(),
        );
      });
    });
  }
});

describe("publishing rights, as the guard actually evaluates them", () => {
  // This is the regression test for F1: `posts.update` alone must never take
  // content live.
  it("an author cannot publish, unpublish, or create something live", () => {
    const author = roles.author;
    expect(canSetStatus(author, "posts", "PUBLISHED", "DRAFT")).toBe(false);
    expect(canSetStatus(author, "posts", "DRAFT", "PUBLISHED")).toBe(false);
    expect(canSetStatus(author, "posts", "PUBLISHED")).toBe(false);
  });

  it("an author can still edit a post that is already live", () => {
    expect(canSetStatus(roles.author, "posts", "PUBLISHED", "PUBLISHED")).toBe(true);
  });

  it("a content editor can publish every content type", () => {
    for (const resource of [
      "services",
      "pages",
      "posts",
      "team",
      "testimonials",
      "faqs",
      "gallery",
    ]) {
      expect(canSetStatus(roles["content-editor"], resource, "PUBLISHED", "DRAFT")).toBe(true);
    }
  });

  it("front desk can record a testimonial but not publish it", () => {
    const frontDesk = roles["front-desk"];
    expect(can("front-desk", "testimonials.create")).toBe(true);
    expect(canSetStatus(frontDesk, "testimonials", "PUBLISHED", "DRAFT")).toBe(false);
  });
});

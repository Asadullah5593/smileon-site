import { PERMISSIONS, SYSTEM_ROLES } from "@/shared/auth/permission-registry";

/**
 * The permission set each system role ships with.
 *
 * Lives here rather than inline in `prisma/seed.ts` so it is importable: the
 * seeder writes it to the database, and `system-roles.test.ts` asserts it
 * against the documented matrix. A role quietly gaining or losing a permission
 * is exactly the kind of change that is invisible in review and expensive in
 * production.
 *
 * Free of server-only imports, so the tests need no database.
 */

export type SystemRoleDefinition = {
  slug: string;
  name: string;
  description: string;
  isSuperAdmin: boolean;
  /** Empty for a super admin — the flag short-circuits every check instead. */
  permissions: string[];
};

const byResource = (...resources: string[]) =>
  PERMISSIONS.filter((p) => resources.includes(p.resource)).map((p) => p.name);

export const CONTENT_RESOURCES = [
  "services",
  "pages",
  "posts",
  "team",
  "testimonials",
  "faqs",
  "gallery",
  "taxonomy",
];

export const SYSTEM_ROLE_DEFINITIONS: SystemRoleDefinition[] = [
  {
    slug: SYSTEM_ROLES.superAdmin,
    name: "Super Admin",
    description: "Full access to everything, including roles and permissions.",
    isSuperAdmin: true,
    permissions: [],
  },
  {
    slug: SYSTEM_ROLES.administrator,
    name: "Administrator",
    description: "Manages content, media, enquiries, site settings and users.",
    isSuperAdmin: false,
    // Everything except *changing* the permission model. `roles.read` is
    // required, not a convenience: /admin/users lists roles in order to assign
    // them, and without it an administrator can create accounts but cannot give
    // them a single role.
    permissions: [
      ...PERMISSIONS.filter((p) => p.resource !== "roles").map((p) => p.name),
      "roles.read",
    ],
  },
  {
    slug: SYSTEM_ROLES.contentEditor,
    name: "Content Editor",
    description: "Creates and publishes content, and manages the media library.",
    isSuperAdmin: false,
    permissions: [
      ...byResource(...CONTENT_RESOURCES),
      ...byResource("media", "banners"),
      // They publish the pages, so they must be able to link them…
      "menus.read",
      "menus.update",
      // …and preserve the old URL when they change a slug.
      "redirects.read",
      "redirects.create",
      // Visible, not editable — brand and contact details are an admin's call.
      "settings.read",
    ],
  },
  {
    slug: SYSTEM_ROLES.author,
    name: "Author",
    description: "Writes blog posts and uploads media, but cannot publish.",
    isSuperAdmin: false,
    // No `posts.publish` and no `posts.delete`. Enforced for real by
    // `assertCanSetStatus` — see `shared/auth/publish-guard`.
    permissions: [
      "posts.read",
      "posts.create",
      "posts.update",
      "taxonomy.read",
      "media.read",
      "media.upload",
    ],
  },
  {
    slug: SYSTEM_ROLES.frontDesk,
    name: "Front Desk",
    description: "Handles appointment requests and contact messages only.",
    isSuperAdmin: false,
    permissions: [
      // Deliberately not `appointments.delete`: an enquiry is a business
      // record, so removing one stays with an administrator.
      "appointments.read",
      "appointments.update",
      "appointments.export",
      ...byResource("messages"),
      // Read-only context for answering the phone: "do you do implants?",
      // "which dentist does braces?"
      "services.read",
      "media.read",
      "team.read",
      "faqs.read",
      "locations.read",
      // Reception writes up what a patient said; an editor reviews and
      // publishes it, so no `testimonials.publish`.
      "testimonials.read",
      "testimonials.create",
    ],
  },
];

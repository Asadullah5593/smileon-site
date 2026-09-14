/**
 * The catalogue of every permission the app understands.
 *
 * Code is the source of truth for *what permissions exist*; the database only
 * stores *who has them*. `prisma/seed.ts` (and `npm run rbac:sync`) upserts
 * this list into the `permissions` table and prunes rows that no longer appear
 * here, so adding a feature means adding a line below — nothing else.
 *
 * This module is intentionally free of server-only imports so the admin UI can
 * render the permission matrix from the same definitions.
 */

export const PERMISSION_GROUPS = {
  content: "Content",
  media: "Media",
  enquiries: "Enquiries",
  site: "Site",
  access: "Access control",
} as const;

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;

type ResourceDefinition = {
  resource: string;
  label: string;
  group: PermissionGroup;
  actions: readonly { action: string; description: string }[];
};

const CRUD = [
  { action: "read", description: "View records" },
  { action: "create", description: "Create records" },
  { action: "update", description: "Edit records" },
  { action: "delete", description: "Delete records" },
] as const;

const CRUD_PUBLISH = [
  ...CRUD,
  { action: "publish", description: "Publish or unpublish records" },
] as const;

export const PERMISSION_RESOURCES: readonly ResourceDefinition[] = [
  { resource: "services", label: "Services", group: "content", actions: CRUD_PUBLISH },
  { resource: "pages", label: "Pages", group: "content", actions: CRUD_PUBLISH },
  { resource: "posts", label: "Blog posts", group: "content", actions: CRUD_PUBLISH },
  { resource: "team", label: "Team members", group: "content", actions: CRUD_PUBLISH },
  { resource: "testimonials", label: "Testimonials", group: "content", actions: CRUD_PUBLISH },
  { resource: "faqs", label: "FAQs", group: "content", actions: CRUD_PUBLISH },
  { resource: "gallery", label: "Before & after", group: "content", actions: CRUD_PUBLISH },
  { resource: "taxonomy", label: "Categories & tags", group: "content", actions: CRUD },
  {
    resource: "media",
    label: "Media library",
    group: "media",
    actions: [
      { action: "read", description: "Browse the media library" },
      { action: "upload", description: "Upload new files" },
      { action: "update", description: "Edit alt text and captions" },
      { action: "delete", description: "Delete files" },
    ],
  },
  {
    resource: "appointments",
    label: "Appointments",
    group: "enquiries",
    actions: [
      { action: "read", description: "View appointment requests" },
      { action: "update", description: "Change status and add notes" },
      { action: "delete", description: "Delete requests" },
      { action: "export", description: "Export to CSV" },
    ],
  },
  {
    resource: "messages",
    label: "Contact messages",
    group: "enquiries",
    actions: [
      { action: "read", description: "Read contact messages" },
      { action: "update", description: "Mark as read" },
      { action: "delete", description: "Delete messages" },
    ],
  },
  { resource: "locations", label: "Locations", group: "site", actions: CRUD },
  { resource: "menus", label: "Navigation menus", group: "site", actions: CRUD },
  { resource: "banners", label: "Home banners", group: "site", actions: CRUD },
  {
    resource: "settings",
    label: "Site settings",
    group: "site",
    actions: [
      { action: "read", description: "View site settings" },
      { action: "manage", description: "Change site settings" },
    ],
  },
  { resource: "redirects", label: "Redirects", group: "site", actions: CRUD },
  {
    resource: "users",
    label: "Users",
    group: "access",
    actions: [
      { action: "read", description: "View staff accounts" },
      { action: "create", description: "Invite staff" },
      { action: "update", description: "Edit accounts and assign roles" },
      { action: "delete", description: "Deactivate or delete accounts" },
    ],
  },
  {
    resource: "roles",
    label: "Roles & permissions",
    group: "access",
    actions: [
      { action: "read", description: "View roles" },
      { action: "create", description: "Create roles" },
      { action: "update", description: "Change a role's permissions" },
      { action: "delete", description: "Delete roles" },
    ],
  },
  {
    resource: "audit",
    label: "Audit log",
    group: "access",
    actions: [{ action: "read", description: "Read the audit log" }],
  },
] as const;

export type PermissionDefinition = {
  name: string;
  resource: string;
  action: string;
  group: PermissionGroup;
  description: string;
};

/** Flat list of `resource.action` permissions, derived from the resources above. */
export const PERMISSIONS: readonly PermissionDefinition[] = PERMISSION_RESOURCES.flatMap((r) =>
  r.actions.map((a) => ({
    name: `${r.resource}.${a.action}`,
    resource: r.resource,
    action: a.action,
    group: r.group,
    description: `${a.description} — ${r.label.toLowerCase()}`,
  })),
);

export const PERMISSION_NAMES = PERMISSIONS.map((p) => p.name);

/**
 * Loose on purpose: `string` keeps the registry editable without a rebuild of
 * every call site, while `PERMISSION_NAMES` gives the seeder and the admin UI
 * an exact list to validate against.
 */
export type PermissionName = string;

export function isKnownPermission(name: string): boolean {
  return PERMISSION_NAMES.includes(name);
}

/** Slugs of the roles created by the seeder. Referenced by tests and the UI. */
export const SYSTEM_ROLES = {
  superAdmin: "super-admin",
  administrator: "administrator",
  contentEditor: "content-editor",
  author: "author",
  frontDesk: "front-desk",
} as const;

import type { PermissionName } from "@/shared/auth/permission-registry";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** The viewer needs at least one of these to see the item. */
  anyOf: PermissionName[];
};

export type NavSection = { title: string; items: NavItem[] };

/**
 * Single source of truth for the admin sidebar. Every entry declares the
 * permissions that reveal it, so a role with no content permissions simply
 * never sees the Content section.
 */
export const ADMIN_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard", anyOf: [] }],
  },
  {
    title: "Content",
    items: [
      { label: "Services", href: "/admin/services", icon: "Stethoscope", anyOf: ["services.read"] },
      { label: "Pages", href: "/admin/pages", icon: "FileText", anyOf: ["pages.read"] },
      { label: "Blog posts", href: "/admin/posts", icon: "Newspaper", anyOf: ["posts.read"] },
      { label: "Team", href: "/admin/team", icon: "Users", anyOf: ["team.read"] },
      { label: "Testimonials", href: "/admin/testimonials", icon: "Quote", anyOf: ["testimonials.read"] },
      { label: "FAQs", href: "/admin/faqs", icon: "CircleHelp", anyOf: ["faqs.read"] },
      { label: "Before & after", href: "/admin/gallery", icon: "Images", anyOf: ["gallery.read"] },
    ],
  },
  {
    title: "Media",
    items: [{ label: "Media library", href: "/admin/media", icon: "Image", anyOf: ["media.read"] }],
  },
  {
    title: "Enquiries",
    items: [
      { label: "Appointments", href: "/admin/appointments", icon: "CalendarCheck", anyOf: ["appointments.read"] },
      { label: "Messages", href: "/admin/messages", icon: "Mail", anyOf: ["messages.read"] },
    ],
  },
  {
    title: "Site",
    items: [
      { label: "Locations", href: "/admin/locations", icon: "MapPin", anyOf: ["locations.read"] },
      { label: "Navigation", href: "/admin/menus", icon: "ListTree", anyOf: ["menus.read"] },
      { label: "Banners", href: "/admin/banners", icon: "GalleryHorizontal", anyOf: ["banners.read"] },
      { label: "Settings", href: "/admin/settings", icon: "Settings", anyOf: ["settings.read"] },
    ],
  },
  {
    title: "Access control",
    items: [
      { label: "Users", href: "/admin/users", icon: "UserCog", anyOf: ["users.read"] },
      { label: "Roles", href: "/admin/roles", icon: "ShieldCheck", anyOf: ["roles.read"] },
      { label: "Audit log", href: "/admin/audit", icon: "ScrollText", anyOf: ["audit.read"] },
    ],
  },
];

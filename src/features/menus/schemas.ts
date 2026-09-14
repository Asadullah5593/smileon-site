import { z } from "zod";
import { slugSchema } from "@/shared/content/publishable";

export const menuCreateSchema = z.object({
  name: z.string().trim().min(2, "Give the menu a name.").max(120),
  slug: slugSchema,
});

export const menuUpdateSchema = menuCreateSchema.partial();

export const menuItemCreateSchema = z.object({
  menuId: z.string().min(1),
  parentId: z.string().nullish(),
  label: z.string().trim().min(1, "Give the link a label.").max(120),
  href: z.string().trim().min(1, "Where should it go?").max(500),
  target: z.enum(["_self", "_blank"]).default("_self"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const menuItemUpdateSchema = menuItemCreateSchema.partial().omit({ menuId: true });

/** Drag-and-drop sends the whole tree back as a flat list of positions. */
export const menuReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        parentId: z.string().nullable(),
        sortOrder: z.coerce.number().int().min(0).max(9999),
      }),
    )
    .max(200),
});

export type MenuCreateInput = z.output<typeof menuCreateSchema>;
export type MenuUpdateInput = z.output<typeof menuUpdateSchema>;
export type MenuItemCreateInput = z.output<typeof menuItemCreateSchema>;
/** Pre-parse shape — defaults are still optional here. */
export type MenuItemFormValues = z.input<typeof menuItemCreateSchema>;
export type MenuItemUpdateInput = z.output<typeof menuItemUpdateSchema>;
export type MenuReorderInput = z.output<typeof menuReorderSchema>;

export type MenuItemDto = {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  href: string;
  target: string | null;
  sortOrder: number;
  children: MenuItemDto[];
};

export type MenuDto = {
  id: string;
  slug: string;
  name: string;
  items: MenuItemDto[];
};

/**
 * The two menus the public site reads. Creating them is a one-click action on
 * the menus screen rather than something an editor has to guess the slug for.
 */
export const WELL_KNOWN_MENUS = [
  { slug: "header", name: "Header" },
  { slug: "footer", name: "Footer" },
] as const;

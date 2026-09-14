import "server-only";
import { prisma } from "@/shared/db/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/api/errors";
import { uniqueSlug } from "@/shared/utils/slug";
import { recordAudit } from "@/shared/audit/audit-log";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type {
  MenuCreateInput,
  MenuDto,
  MenuItemCreateInput,
  MenuItemDto,
  MenuItemUpdateInput,
  MenuReorderInput,
  MenuUpdateInput,
} from "@/features/menus/schemas";
import type { Viewer } from "@/shared/auth/permissions";
import type { MenuItem } from "@/generated/prisma/client";

/** All `Menu` / `MenuItem` data access. */

/**
 * Build the parent/child tree from a flat row set.
 *
 * The previous public reader dropped every child (`filter(i => !i.parentId)`),
 * which made `MenuItem.parentId` unusable — a nested menu could be built in the
 * CMS and would silently render flat.
 */
export function toMenuTree(rows: MenuItem[]): MenuItemDto[] {
  const byId = new Map<string, MenuItemDto>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        menuId: row.menuId,
        parentId: row.parentId,
        label: row.label,
        href: row.href,
        target: row.target,
        sortOrder: row.sortOrder,
        children: [],
      },
    ]),
  );

  const roots: MenuItemDto[] = [];
  for (const item of byId.values()) {
    // An item whose parent was deleted or belongs elsewhere becomes a root
    // rather than vanishing from the menu.
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    if (parent) parent.children.push(item);
    else roots.push(item);
  }

  const bySortOrder = (a: MenuItemDto, b: MenuItemDto) =>
    a.sortOrder - b.sortOrder || a.label.localeCompare(b.label);

  roots.sort(bySortOrder);
  for (const item of byId.values()) item.children.sort(bySortOrder);

  return roots;
}

export async function listMenus(): Promise<MenuDto[]> {
  const menus = await prisma.menu.findMany({
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  return menus.map((menu) => ({
    id: menu.id,
    slug: menu.slug,
    name: menu.name,
    items: toMenuTree(menu.items),
  }));
}

/** Public read — one menu as a tree. */
export async function getMenuTree(slug: string): Promise<MenuItemDto[]> {
  const menu = await prisma.menu.findUnique({
    where: { slug },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  return menu ? toMenuTree(menu.items) : [];
}

export async function createMenu(input: MenuCreateInput, viewer: Viewer): Promise<MenuDto> {
  const slug = await uniqueSlug(input.slug || input.name, async (candidate) =>
    Boolean(await prisma.menu.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );

  const menu = await prisma.menu.create({ data: { name: input.name, slug } });

  await recordAudit({
    actorId: viewer.id,
    action: "menus.create",
    entity: "Menu",
    entityId: menu.id,
    summary: menu.name,
  });
  revalidateContent(CACHE_TAGS.menus);

  return { id: menu.id, slug: menu.slug, name: menu.name, items: [] };
}

export async function updateMenu(id: string, input: MenuUpdateInput, viewer: Viewer) {
  const existing = await prisma.menu.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Menu");

  const menu = await prisma.menu.update({ where: { id }, data: { name: input.name } });

  await recordAudit({
    actorId: viewer.id,
    action: "menus.update",
    entity: "Menu",
    entityId: id,
    summary: menu.name,
  });
  revalidateContent(CACHE_TAGS.menus);

  return { id: menu.id, slug: menu.slug, name: menu.name, items: [] };
}

export async function deleteMenu(id: string, viewer: Viewer) {
  const menu = await prisma.menu.delete({ where: { id } }).catch(() => null);
  if (!menu) throw new NotFoundError("Menu");

  await recordAudit({
    actorId: viewer.id,
    action: "menus.delete",
    entity: "Menu",
    entityId: id,
    summary: menu.name,
  });
  revalidateContent(CACHE_TAGS.menus);
}

export async function createMenuItem(input: MenuItemCreateInput, viewer: Viewer) {
  if (input.parentId) await assertSameMenu(input.parentId, input.menuId);

  const item = await prisma.menuItem.create({
    data: {
      menuId: input.menuId,
      parentId: input.parentId ?? null,
      label: input.label,
      href: input.href,
      target: input.target,
      sortOrder: input.sortOrder,
    },
  });

  await recordAudit({
    actorId: viewer.id,
    action: "menus.update",
    entity: "MenuItem",
    entityId: item.id,
    summary: `Added “${item.label}”`,
  });
  revalidateContent(CACHE_TAGS.menus);

  return item;
}

export async function updateMenuItem(id: string, input: MenuItemUpdateInput, viewer: Viewer) {
  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Menu item");

  if (input.parentId) {
    await assertSameMenu(input.parentId, existing.menuId);
    assertNotSelfParent(id, input.parentId);
    await assertNotDescendant(id, input.parentId);
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      parentId: input.parentId === undefined ? undefined : (input.parentId ?? null),
      label: input.label,
      href: input.href,
      target: input.target,
      sortOrder: input.sortOrder,
    },
  });

  await recordAudit({
    actorId: viewer.id,
    action: "menus.update",
    entity: "MenuItem",
    entityId: id,
    summary: `Edited “${item.label}”`,
  });
  revalidateContent(CACHE_TAGS.menus);

  return item;
}

export async function deleteMenuItem(id: string, viewer: Viewer) {
  // `onDelete: Cascade` on the self-relation takes the children with it.
  const item = await prisma.menuItem.delete({ where: { id } }).catch(() => null);
  if (!item) throw new NotFoundError("Menu item");

  await recordAudit({
    actorId: viewer.id,
    action: "menus.update",
    entity: "MenuItem",
    entityId: id,
    summary: `Removed “${item.label}”`,
  });
  revalidateContent(CACHE_TAGS.menus);
}

/** Applies a whole drag-and-drop reorder in one transaction. */
export async function reorderMenuItems(input: MenuReorderInput, viewer: Viewer) {
  await prisma.$transaction(
    input.items.map((item) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { parentId: item.parentId, sortOrder: item.sortOrder },
      }),
    ),
  );

  await recordAudit({
    actorId: viewer.id,
    action: "menus.update",
    entity: "MenuItem",
    summary: `Reordered ${input.items.length} item(s)`,
  });
  revalidateContent(CACHE_TAGS.menus);
}

async function assertSameMenu(parentId: string, menuId: string) {
  const parent = await prisma.menuItem.findUnique({
    where: { id: parentId },
    select: { menuId: true },
  });
  if (!parent) throw new NotFoundError("Parent item");
  if (parent.menuId !== menuId) {
    throw new ValidationError({ parentId: "wrong_menu" }, "That parent belongs to another menu.");
  }
}

function assertNotSelfParent(id: string, parentId: string) {
  if (id === parentId) {
    throw new ConflictError("An item cannot be its own parent.");
  }
}

/**
 * Reparenting an item under its own descendant would orphan that whole branch
 * from the tree — it would still be in the table but unreachable from any root.
 */
async function assertNotDescendant(id: string, parentId: string) {
  let cursor: string | null = parentId;
  const seen = new Set<string>();

  while (cursor) {
    if (cursor === id) throw new ConflictError("An item cannot be moved inside itself.");
    if (seen.has(cursor)) break;
    seen.add(cursor);

    const parent: { parentId: string | null } | null = await prisma.menuItem.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = parent?.parentId ?? null;
  }
}

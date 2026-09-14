import { describe, expect, it } from "vitest";
import { toMenuTree } from "@/features/menus/server/menu-repository";
import type { MenuItem } from "@/generated/prisma/client";

const item = (id: string, parentId: string | null, sortOrder = 0, label = id): MenuItem =>
  ({
    id,
    menuId: "m1",
    parentId,
    label,
    href: `/${id}`,
    target: "_self",
    sortOrder,
  }) as MenuItem;

describe("toMenuTree", () => {
  it("nests children under their parent", () => {
    const tree = toMenuTree([item("parent", null), item("child", "parent")]);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("parent");
    expect(tree[0].children.map((c) => c.id)).toEqual(["child"]);
  });

  // The bug this replaced: the old reader kept only `parentId === null`, so
  // every child silently disappeared from the rendered menu.
  it("keeps children rather than dropping them", () => {
    const tree = toMenuTree([item("a", null), item("a1", "a"), item("a2", "a")]);
    expect(tree[0].children).toHaveLength(2);
  });

  it("sorts roots and children by sortOrder", () => {
    const tree = toMenuTree([
      item("second", null, 2),
      item("first", null, 1),
      item("child-b", "first", 2),
      item("child-a", "first", 1),
    ]);

    expect(tree.map((i) => i.id)).toEqual(["first", "second"]);
    expect(tree[0].children.map((i) => i.id)).toEqual(["child-a", "child-b"]);
  });

  it("falls back to label order when sortOrder ties", () => {
    const tree = toMenuTree([item("b", null, 0, "Beta"), item("a", null, 0, "Alpha")]);
    expect(tree.map((i) => i.label)).toEqual(["Alpha", "Beta"]);
  });

  // An item whose parent was deleted must still appear, not vanish.
  it("promotes an orphan to a root", () => {
    const tree = toMenuTree([item("orphan", "missing-parent")]);
    expect(tree.map((i) => i.id)).toEqual(["orphan"]);
  });

  it("supports three levels", () => {
    const tree = toMenuTree([item("top", null), item("mid", "top"), item("leaf", "mid")]);
    expect(tree[0].children[0].children[0].id).toBe("leaf");
  });

  it("returns an empty tree for no items", () => {
    expect(toMenuTree([])).toEqual([]);
  });
});

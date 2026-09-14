"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, CornerDownRight, Pencil, Plus, Trash2 } from "lucide-react";
import { menuKeys, menusApi } from "@/features/menus/api";
import {
  WELL_KNOWN_MENUS,
  menuItemCreateSchema,
  type MenuDto,
  type MenuItemCreateInput,
  type MenuItemDto,
  type MenuItemFormValues,
} from "@/features/menus/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FieldError } from "@/shared/ui/FieldError";
import { Skeleton } from "@/shared/ui/primitives/skeleton";

type EditingItem = { menuId: string; item: MenuItemDto | null; parentId: string | null };

export function MenusManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditingItem | null>(null);

  const { data: menus, isPending } = useQuery({
    queryKey: menuKeys.all,
    queryFn: menusApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: menuKeys.all });

  const createMenu = useMutation({
    mutationFn: menusApi.create,
    onSuccess: (menu) => {
      toast.success(`“${menu.name}” menu created.`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return <Skeleton className="h-64 w-full" />;

  const existing = new Set((menus ?? []).map((menu) => menu.slug));
  const missing = WELL_KNOWN_MENUS.filter((menu) => !existing.has(menu.slug));

  return (
    <div className="space-y-6">
      {missing.length > 0 ? (
        <Can permission="menus.create">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Menus the website expects</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {missing.map((menu) => (
                <Button
                  key={menu.slug}
                  variant="outline"
                  size="sm"
                  disabled={createMenu.isPending}
                  onClick={() => createMenu.mutate({ name: menu.name, slug: menu.slug })}
                >
                  <Plus className="size-4" /> Create the {menu.name} menu
                </Button>
              ))}
            </CardContent>
          </Card>
        </Can>
      ) : null}

      {(menus ?? []).map((menu) => (
        <MenuCard key={menu.id} menu={menu} onEdit={setEditing} onChanged={invalidate} />
      ))}

      {menus?.length === 0 && missing.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No menus yet.
        </p>
      ) : null}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.item ? "Edit link" : "New link"}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <MenuItemForm
              editing={editing}
              onSaved={() => {
                setEditing(null);
                invalidate();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuCard({
  menu,
  onEdit,
  onChanged,
}: {
  menu: MenuDto;
  onEdit: (editing: EditingItem) => void;
  onChanged: () => void;
}) {
  const { can } = usePermissions();

  const removeItem = useMutation({
    mutationFn: menusApi.removeItem,
    onSuccess: () => {
      toast.success("Link removed.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      menusApi.updateItem(id, { sortOrder }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  /** Swap sort order with the neighbour in the same branch. */
  function shift(siblings: MenuItemDto[], index: number, direction: -1 | 1) {
    const target = siblings[index + direction];
    if (!target) return;
    const current = siblings[index];
    move.mutate({ id: current.id, sortOrder: target.sortOrder });
    move.mutate({ id: target.id, sortOrder: current.sortOrder });
  }

  function renderItems(items: MenuItemDto[], depth = 0) {
    return items.map((item, index) => (
      <li key={item.id}>
        <div
          className="flex items-center gap-2 border-b py-2 last:border-b-0"
          style={{ paddingLeft: depth * 24 }}
        >
          {depth > 0 ? (
            <CornerDownRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          ) : null}

          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-muted-foreground block truncate text-xs">{item.href}</span>
          </div>

          {item.target === "_blank" ? <Badge variant="secondary">new tab</Badge> : null}

          {can("menus.update") ? (
            <div className="flex shrink-0 gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move up"
                disabled={index === 0 || move.isPending}
                onClick={() => shift(items, index, -1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Move down"
                disabled={index === items.length - 1 || move.isPending}
                onClick={() => shift(items, index, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              {/* Two levels is enough for a clinic site's header. */}
              {depth === 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Add sub-link"
                  onClick={() => onEdit({ menuId: menu.id, item: null, parentId: item.id })}
                >
                  <Plus className="size-4" />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() => onEdit({ menuId: menu.id, item, parentId: item.parentId })}
              >
                <Pencil className="size-4" />
              </Button>
              <ConfirmDialog
                title={`Remove “${item.label}”?`}
                description={
                  item.children.length > 0
                    ? `Its ${item.children.length} sub-link(s) will be removed too.`
                    : "This cannot be undone."
                }
                onConfirm={() => removeItem.mutateAsync(item.id)}
              >
                <Button variant="ghost" size="icon" aria-label="Remove">
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </ConfirmDialog>
            </div>
          ) : null}
        </div>

        {item.children.length > 0 ? <ul>{renderItems(item.children, depth + 1)}</ul> : null}
      </li>
    ));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{menu.name}</CardTitle>
          <p className="text-muted-foreground text-xs">/{menu.slug}</p>
        </div>
        <Can permission="menus.update">
          <Button size="sm" onClick={() => onEdit({ menuId: menu.id, item: null, parentId: null })}>
            <Plus className="size-4" /> Add link
          </Button>
        </Can>
      </CardHeader>
      <CardContent>
        {menu.items.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No links yet.</p>
        ) : (
          <ul>{renderItems(menu.items)}</ul>
        )}
      </CardContent>
    </Card>
  );
}

function MenuItemForm({ editing, onSaved }: { editing: EditingItem; onSaved: () => void }) {
  const { item, menuId, parentId } = editing;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MenuItemFormValues, unknown, MenuItemCreateInput>({
    resolver: zodResolver(menuItemCreateSchema),
    defaultValues: {
      menuId,
      parentId: item?.parentId ?? parentId ?? null,
      label: item?.label ?? "",
      href: item?.href ?? "",
      target: (item?.target as "_self" | "_blank") ?? "_self",
      sortOrder: item?.sortOrder ?? 0,
    },
  });

  const save = useMutation({
    mutationFn: (values: MenuItemCreateInput) =>
      item
        ? menusApi.updateItem(item.id, {
            label: values.label,
            href: values.href,
            target: values.target,
            sortOrder: values.sortOrder,
          })
        : menusApi.createItem(values),
    onSuccess: () => {
      toast.success(item ? "Link updated." : "Link added.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" {...register("label")} placeholder="Treatments" />
        <FieldError message={errors.label?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="href">Link</Label>
        <Input id="href" {...register("href")} placeholder="/services" />
        <p className="text-muted-foreground text-xs">
          A path like <code>/services</code>, or a full URL for an external site.
        </p>
        <FieldError message={errors.href?.message} />
      </div>

      <div className="space-y-2">
        <Label>Opens in</Label>
        <Controller
          control={control}
          name="target"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">The same tab</SelectItem>
                <SelectItem value="_blank">A new tab</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : item ? "Save changes" : "Add link"}
      </Button>
    </form>
  );
}

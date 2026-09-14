"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { accessKeys, rolesApi } from "@/features/access/api";
import type { RoleDto } from "@/features/access/schemas";
import { PermissionMatrix } from "@/features/access/components/PermissionMatrix";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Badge } from "@/shared/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { cn } from "@/shared/utils/cn";

type Draft = { id: string | null; name: string; description: string; permissions: string[] };

export function RolesManager() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: roles, isPending } = useQuery({
    queryKey: accessKeys.roles,
    queryFn: rolesApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: accessKeys.roles });

  const save = useMutation({
    mutationFn: (value: Draft) =>
      value.id
        ? rolesApi.update(value.id, {
            name: value.name,
            description: value.description,
            permissions: value.permissions,
          })
        : rolesApi.create({
            name: value.name,
            description: value.description,
            permissions: value.permissions,
          }),
    onSuccess: (role) => {
      toast.success(`Role “${role.name}” saved.`);
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: rolesApi.remove,
    onSuccess: () => {
      toast.success("Role deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(role: RoleDto) {
    setDraft({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions,
    });
  }

  function clone(role: RoleDto) {
    setDraft({
      id: null,
      name: `${role.name} (copy)`,
      description: role.description ?? "",
      permissions: role.permissions,
    });
  }

  if (draft) {
    const editingSuperAdmin = Boolean(
      draft.id && roles?.find((r) => r.id === draft.id)?.isSuperAdmin,
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{draft.id ? "Edit role" : "New role"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Front desk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="What this role is for."
              />
            </div>
          </div>

          {editingSuperAdmin ? (
            <p className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
              The super admin role always holds every permission — that is what guarantees someone
              can always get back into the CMS.
            </p>
          ) : (
            <PermissionMatrix
              selected={draft.permissions}
              onChange={(permissions) => setDraft({ ...draft, permissions })}
            />
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => save.mutate(draft)}
              disabled={save.isPending || draft.name.trim().length < 2}
            >
              {save.isPending ? "Saving…" : "Save role"}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <p className="text-muted-foreground self-center text-sm">
              {draft.permissions.length} permission(s) selected
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Can permission="roles.create">
        <Button onClick={() => setDraft({ id: null, name: "", description: "", permissions: [] })}>
          <Plus className="size-4" /> New role
        </Button>
      </Can>

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading roles…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {roles?.map((role) => (
            <Card key={role.id} className={cn(role.isSuperAdmin && "border-primary/40")}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {role.isSuperAdmin ? <ShieldCheck className="text-primary size-4" /> : null}
                  {role.name}
                  {role.isSystem ? (
                    <Badge variant="secondary" className="ml-1">
                      system
                    </Badge>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  {role.description ?? "No description."}
                </p>
                <p className="text-muted-foreground text-xs">
                  {role.isSuperAdmin
                    ? "All permissions"
                    : `${role.permissions.length} permission(s)`}{" "}
                  · {role.userCount} user(s)
                </p>
                <div className="flex gap-1">
                  {can("roles.update") ? (
                    <Button variant="outline" size="sm" onClick={() => edit(role)}>
                      Edit
                    </Button>
                  ) : null}
                  <Can permission="roles.create">
                    <Button variant="ghost" size="sm" onClick={() => clone(role)}>
                      <Copy className="size-3.5" /> Clone
                    </Button>
                  </Can>
                  {can("roles.delete") && !role.isSystem ? (
                    <ConfirmDialog
                      title={`Delete “${role.name}”?`}
                      description={
                        role.userCount > 0
                          ? `${role.userCount} user(s) still hold this role — reassign them first.`
                          : "Users will lose any permissions this role granted."
                      }
                      onConfirm={() => remove.mutateAsync(role.id)}
                    >
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </ConfirmDialog>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ShieldCheck } from "lucide-react";
import { accessKeys, rolesApi, usersApi } from "@/features/access/api";
import type { UserDto } from "@/features/access/schemas";
import { PermissionMatrix } from "@/features/access/components/PermissionMatrix";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import { Checkbox } from "@/shared/ui/primitives/checkbox";
import { Switch } from "@/shared/ui/primitives/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/primitives/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";

type Draft = {
  id: string | null;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  roleIds: string[];
  allow: string[];
  deny: string[];
};

export function UsersManager() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [draft, setDraft] = useState<Draft | null>(null);

  const params = { page: 1 };
  const { data: users, isPending } = useQuery({
    queryKey: accessKeys.users(params),
    queryFn: () => usersApi.list(params),
  });
  const { data: roles } = useQuery({ queryKey: accessKeys.roles, queryFn: rolesApi.list });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: accessKeys.roles });
  };

  const save = useMutation({
    mutationFn: (value: Draft) => {
      const overrides = [
        ...value.allow.map((permission) => ({ permission, effect: "ALLOW" as const })),
        ...value.deny.map((permission) => ({ permission, effect: "DENY" as const })),
      ];
      return value.id
        ? usersApi.update(value.id, {
            name: value.name,
            email: value.email,
            isActive: value.isActive,
            roleIds: value.roleIds,
            overrides,
            ...(value.password ? { password: value.password } : {}),
          })
        : usersApi.create({
            name: value.name,
            email: value.email,
            password: value.password,
            roleIds: value.roleIds,
          });
    },
    onSuccess: () => {
      toast.success("User saved.");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(user: UserDto) {
    setDraft({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      isActive: user.isActive,
      roleIds: user.roles.map((r) => r.id),
      allow: user.overrides.filter((o) => o.effect === "ALLOW").map((o) => o.permission),
      deny: user.overrides.filter((o) => o.effect === "DENY").map((o) => o.permission),
    });
  }

  if (draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{draft.id ? "Edit user" : "New user"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {draft.id ? "New password (leave blank to keep)" : "Password"}
              </Label>
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              />
            </div>
            {draft.id ? (
              <div className="flex items-center justify-between self-end pb-2">
                <Label htmlFor="user-active">Account active</Label>
                <Switch
                  id="user-active"
                  checked={draft.isActive}
                  onCheckedChange={(isActive) => setDraft({ ...draft, isActive })}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-3">
              {roles?.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.roleIds.includes(role.id)}
                    onCheckedChange={(value) =>
                      setDraft({
                        ...draft,
                        roleIds:
                          value === true
                            ? [...draft.roleIds, role.id]
                            : draft.roleIds.filter((id) => id !== role.id),
                      })
                    }
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          {draft.id ? (
            <div className="space-y-2">
              <Label>Per-user overrides</Label>
              <p className="text-muted-foreground text-sm">
                Layered on top of the roles above. A denial always wins, even if a role grants it.
              </p>
              <Tabs defaultValue="allow">
                <TabsList>
                  <TabsTrigger value="allow">Extra allow ({draft.allow.length})</TabsTrigger>
                  <TabsTrigger value="deny">Deny ({draft.deny.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="allow" className="pt-3">
                  <PermissionMatrix
                    selected={draft.allow}
                    onChange={(allow) => setDraft({ ...draft, allow })}
                  />
                </TabsContent>
                <TabsContent value="deny" className="pt-3">
                  <PermissionMatrix
                    selected={draft.deny}
                    onChange={(deny) => setDraft({ ...draft, deny })}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save user"}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Can permission="users.create">
        <Button
          onClick={() =>
            setDraft({
              id: null,
              name: "",
              email: "",
              password: "",
              isActive: true,
              roleIds: [],
              allow: [],
              deny: [],
            })
          }
        >
          <Plus className="size-4" /> New user
        </Button>
      </Can>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Roles</TableHead>
              <TableHead className="hidden md:table-cell">Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (
              users?.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="flex items-center gap-1.5 font-medium">
                      {user.isSuperAdmin ? <ShieldCheck className="text-primary size-3.5" /> : null}
                      {user.name}
                    </span>
                    <span className="text-muted-foreground block text-xs">{user.email}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-muted-foreground text-xs">None</span>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {user.isSuperAdmin ? "All" : user.effectivePermissions.length}
                    {user.overrides.length > 0 ? ` (${user.overrides.length} override)` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "outline"}>
                      {user.isActive ? "active" : "disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {can("users.update") ? (
                      <Button variant="outline" size="sm" onClick={() => edit(user)}>
                        Edit
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

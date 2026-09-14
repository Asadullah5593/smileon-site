"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MailPlus, Trash2 } from "lucide-react";
import { apiFetch } from "@/shared/api/http";
import { accessKeys, rolesApi } from "@/features/access/api";
import {
  inviteCreateSchema,
  type InvitationDto,
  type InviteCreateInput,
} from "@/features/auth/schemas";
import { Can } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import { Checkbox } from "@/shared/ui/primitives/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FieldError } from "@/shared/ui/FieldError";

const invitationKeys = { all: ["invitations"] as const };

const invitationsApi = {
  list: () => apiFetch<InvitationDto[]>("/api/admin/invitations"),
  create: (body: InviteCreateInput) =>
    apiFetch<InvitationDto>("/api/admin/invitations", { method: "POST", body }),
  revoke: (id: string) => apiFetch<void>(`/api/admin/invitations/${id}`, { method: "DELETE" }),
};

export function InvitationsPanel() {
  const queryClient = useQueryClient();
  const [inviting, setInviting] = useState(false);

  const { data: invitations } = useQuery({
    queryKey: invitationKeys.all,
    queryFn: invitationsApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: invitationKeys.all });

  const revoke = useMutation({
    mutationFn: invitationsApi.revoke,
    onSuccess: () => {
      toast.success("Invitation revoked.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = invitations ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Pending invitations</CardTitle>
          <p className="text-muted-foreground text-sm">
            Invitees choose their own password, so nobody else ever knows it.
          </p>
        </div>
        <Can permission="users.create">
          <Button size="sm" onClick={() => setInviting(true)}>
            <MailPlus className="size-4" /> Invite someone
          </Button>
        </Can>
      </CardHeader>

      <CardContent>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invitations outstanding.</p>
        ) : (
          <ul className="divide-y">
            {pending.map((invitation) => {
              const expired = new Date(invitation.expiresAt) < new Date();
              return (
                <li key={invitation.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Invited by {invitation.invitedByName ?? "someone"} ·{" "}
                      {expired
                        ? "expired"
                        : `expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired ? <Badge variant="outline">expired</Badge> : null}
                    <Can permission="users.delete">
                      <ConfirmDialog
                        title={`Revoke the invitation for ${invitation.email}?`}
                        description="Their link stops working immediately."
                        confirmLabel="Revoke"
                        onConfirm={() => revoke.mutateAsync(invitation.id)}
                      >
                        <Button variant="ghost" size="icon" aria-label="Revoke">
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </ConfirmDialog>
                    </Can>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a colleague</DialogTitle>
          </DialogHeader>
          <InviteForm
            onSent={() => {
              setInviting(false);
              invalidate();
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InviteForm({ onSent }: { onSent: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteCreateInput>({
    resolver: zodResolver(inviteCreateSchema),
    defaultValues: { email: "", name: "", roleIds: [] },
  });

  const { data: roles, isError: rolesFailed } = useQuery({
    queryKey: accessKeys.roles,
    queryFn: rolesApi.list,
  });

  const send = useMutation({
    mutationFn: invitationsApi.create,
    onSuccess: (invitation) => {
      toast.success(`Invitation sent to ${invitation.email}.`);
      onSent();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((values) => send.mutateAsync(values))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-name">Name</Label>
        <Input id="invite-name" {...register("name")} placeholder="Dr. Ayesha Khan" />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" type="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label>Roles</Label>
        {rolesFailed ? (
          <p className="text-destructive text-sm">
            Roles could not be loaded, so none can be assigned. Your account may be missing the{" "}
            <code>roles.read</code> permission.
          </p>
        ) : null}
        <Controller
          control={control}
          name="roleIds"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {roles?.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value.includes(role.id)}
                    onCheckedChange={(value) =>
                      field.onChange(
                        value === true
                          ? [...field.value, role.id]
                          : field.value.filter((id: string) => id !== role.id),
                      )
                    }
                  />
                  {role.name}
                </label>
              ))}
            </div>
          )}
        />
        <FieldError message={errors.roleIds?.message} />
      </div>

      <Button type="submit" disabled={send.isPending}>
        {send.isPending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}

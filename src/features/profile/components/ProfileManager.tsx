"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { profileApi } from "@/features/profile/api";
import {
  passwordChangeSchema,
  profileUpdateSchema,
  type PasswordChangeInput,
  type ProfileDto,
  type ProfileUpdateInput,
} from "@/features/profile/schemas";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { FieldError } from "@/shared/ui/FieldError";

export function ProfileManager({ profile }: { profile: ProfileDto }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DetailsCard profile={profile} />
      <div className="space-y-6">
        <PasswordCard />
        <AccessCard profile={profile} />
      </div>
    </div>
  );
}

function DetailsCard({ profile }: { profile: ProfileDto }) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { name: profile.name, image: profile.image ?? "" },
  });

  const save = useMutation({
    mutationFn: profileApi.update,
    onSuccess: async () => {
      toast.success("Profile updated.");
      // Refresh the JWT so the header greeting reflects the new name.
      await updateSession();
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-muted-foreground text-xs">
              Ask an administrator to change the email your account signs in with.
            </p>
          </div>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const change = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed.");
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((values) => change.mutateAsync(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            <FieldError message={errors.currentPassword?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register("newPassword")}
            />
            <FieldError message={errors.newPassword?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Repeat new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </div>

          <Button type="submit" disabled={change.isPending}>
            {change.isPending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AccessCard({ profile }: { profile: ProfileDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="mb-1.5 font-medium">Roles</p>
          {profile.roles.length === 0 ? (
            <p className="text-muted-foreground">
              No roles yet — ask an administrator to grant you access.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {profile.roles.map((role) => (
                <Badge key={role.id} variant="secondary">
                  {role.name}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            Only an administrator can change these.
          </p>
        </div>

        {profile.lastLoginAt ? (
          <div>
            <p className="mb-0.5 font-medium">Last signed in</p>
            <p className="text-muted-foreground">
              {new Date(profile.lastLoginAt).toLocaleString()}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

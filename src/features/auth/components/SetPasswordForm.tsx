"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/shared/api/http";
import {
  inviteAcceptSchema,
  passwordResetSchema,
  type InviteAcceptInput,
  type PasswordResetInput,
} from "@/features/auth/schemas";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { FieldError } from "@/shared/ui/FieldError";

type Mode = "invite" | "reset";

/**
 * Shared by the invitation-accept and password-reset screens — both are "prove
 * you hold this token, then choose a password", differing only in the endpoint
 * and the wording.
 */
export function SetPasswordForm({ mode, token }: { mode: Mode; token: string }) {
  const router = useRouter();
  const isInvite = mode === "invite";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteAcceptInput | PasswordResetInput>({
    resolver: zodResolver(isInvite ? inviteAcceptSchema : passwordResetSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const submit = useMutation({
    // The two endpoints return different bodies; neither is used, so the
    // result is discarded rather than widened into a union.
    mutationFn: async (values: InviteAcceptInput | PasswordResetInput) => {
      if (isInvite) {
        await apiFetch<{ email: string }>("/api/public/invitations/accept", {
          method: "POST",
          body: values,
        });
        return;
      }
      await apiFetch<void>("/api/public/password-reset", { method: "PUT", body: values });
    },
    onSuccess: () => {
      toast.success(isInvite ? "Account created — please sign in." : "Password updated.");
      router.push("/login");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => submit.mutateAsync(values))}
      className="bg-card space-y-4 rounded-xl border p-6 shadow-sm"
    >
      <input type="hidden" {...register("token")} />

      <div className="space-y-2">
        <Label htmlFor="password">{isInvite ? "Choose a password" : "New password"}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Repeat password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={submit.isPending}>
        {submit.isPending ? "Saving…" : isInvite ? "Create my account" : "Set new password"}
      </Button>
    </form>
  );
}

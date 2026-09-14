"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/shared/api/http";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestInput,
} from "@/features/auth/schemas";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { FieldError } from "@/shared/ui/FieldError";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" },
  });

  const request = useMutation({
    mutationFn: (values: PasswordResetRequestInput) =>
      apiFetch<void>("/api/public/password-reset", { method: "POST", body: values }),
    // Success either way: the endpoint deliberately doesn't reveal whether the
    // address has an account, and the UI must not leak it either.
    onSettled: () => setSent(true),
  });

  if (sent) {
    return (
      <div className="bg-card space-y-2 rounded-xl border p-6 text-sm shadow-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="text-muted-foreground">
          If that address has an account, a reset link is on its way. It expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => request.mutateAsync(values))}
      className="bg-card space-y-4 rounded-xl border p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register("email")}
          placeholder="you@smileon.pk"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <Button type="submit" className="w-full" disabled={request.isPending}>
        {request.isPending ? "Sending…" : "Email me a reset link"}
      </Button>
    </form>
  );
}

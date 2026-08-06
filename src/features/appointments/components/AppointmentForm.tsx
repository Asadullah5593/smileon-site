"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "@/shared/api/http";
import {
  appointmentRequestSchema,
  type AppointmentRequestInput,
} from "@/features/appointments/schemas";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Alert, AlertDescription } from "@/shared/ui/primitives/alert";

type Service = { id: string; title: string; slug: string };

export function AppointmentForm({ services }: { services: Service[] }) {
  const searchParams = useSearchParams();
  const preselected = services.find((s) => s.slug === searchParams.get("service"));
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentRequestInput>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: { serviceId: preselected?.id ?? "" },
  });

  async function onSubmit(values: AppointmentRequestInput) {
    setError(null);
    try {
      await apiFetch("/api/public/appointments", { method: "POST", body: values });
      setDone(true);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (done) {
    return (
      <Alert>
        <AlertDescription>
          Thank you — your request has been received. Our front desk will call you shortly to
          confirm.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <input
        {...register("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone / WhatsApp</Label>
          <Input id="phone" type="tel" {...register("phone")} placeholder="03xx xxxxxxx" />
          {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email ? <p className="text-destructive text-sm">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceId">Treatment</Label>
          <select
            id="serviceId"
            {...register("serviceId")}
            className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">Not sure yet</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredDate">Preferred date</Label>
          <Input id="preferredDate" type="date" {...register("preferredDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredTime">Preferred time</Label>
          <Input id="preferredTime" {...register("preferredTime")} placeholder="Afternoon" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Anything we should know?</Label>
        <Textarea id="message" rows={4} {...register("message")} />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Request appointment"}
      </Button>
    </form>
  );
}

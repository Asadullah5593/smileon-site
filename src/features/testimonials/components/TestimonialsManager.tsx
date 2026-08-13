"use client";

import { useState } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { testimonialKeys, testimonialsApi } from "@/features/testimonials/api";
import {
  testimonialCreateSchema,
  type TestimonialCreateInput,
  type TestimonialDto,
  type TestimonialFormValues,
} from "@/features/testimonials/schemas";
import { MediaPickerField } from "@/features/media/components/MediaPickerField";
import type { ServiceOption } from "@/features/services/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { PublishingCard } from "@/shared/content/PublishingCard";
import { StatusFilter } from "@/shared/content/StatusFilter";
import { useResourceFilters } from "@/shared/content/use-resource-filters";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { FieldError } from "@/shared/ui/FieldError";

const NONE = "none";

export function TestimonialsManager({ services }: { services: ServiceOption[] }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [editing, setEditing] = useState<TestimonialDto | null | undefined>(undefined);

  const { filters, setFilters, params } = useResourceFilters();

  const { data, isPending, error } = useQuery({
    queryKey: testimonialKeys.list(params),
    queryFn: () => testimonialsApi.list(params),
  });

  const remove = useMutation({
    mutationFn: testimonialsApi.remove,
    onSuccess: () => {
      toast.success("Testimonial deleted.");
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<TestimonialDto>[] = [
    {
      header: "Patient",
      cell: (testimonial) => (
        <>
          <span className="font-medium">{testimonial.patientName}</span>
          <span className="text-muted-foreground line-clamp-2 block max-w-md text-xs">
            {testimonial.quote}
          </span>
        </>
      ),
    },
    {
      header: "Rating",
      className: "hidden sm:table-cell",
      cell: (testimonial) => (
        <span className="flex items-center gap-0.5" aria-label={`${testimonial.rating} of 5`}>
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="fill-warning text-warning size-3.5" aria-hidden />
          ))}
        </span>
      ),
    },
    {
      header: "Treatment",
      className: "hidden md:table-cell",
      cell: (testimonial) => testimonial.serviceTitle ?? "—",
    },
    { header: "Status", cell: (testimonial) => <StatusBadge status={testimonial.status} /> },
  ];

  return (
    <>
      <ResourceTable
        columns={columns}
        rows={data?.items}
        isPending={isPending}
        error={error}
        emptyMessage="No testimonials yet."
        toolbar={
          <>
            <Input
              placeholder="Search patients or quotes…"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
              className="max-w-xs"
            />
            <StatusFilter
              value={filters.status}
              onChange={(status) => setFilters({ status, page: 1 })}
            />
            <Can permission="testimonials.create">
              <Button className="ml-auto" onClick={() => setEditing(null)}>
                <Plus className="size-4" /> New testimonial
              </Button>
            </Can>
          </>
        }
        rowActions={(testimonial) => (
          <>
            {can("testimonials.update") ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() => setEditing(testimonial)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Can permission="testimonials.delete">
              <ConfirmDialog
                title={`Delete the testimonial from ${testimonial.patientName}?`}
                description="This cannot be undone."
                onConfirm={() => remove.mutateAsync(testimonial.id)}
              >
                <Button variant="ghost" size="icon" aria-label="Delete">
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </ConfirmDialog>
            </Can>
          </>
        )}
        pagination={
          data
            ? {
                page: data.page,
                pageCount: data.pageCount,
                total: data.total,
                onPageChange: (page) => setFilters({ page }),
              }
            : undefined
        }
      />

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit testimonial" : "New testimonial"}</DialogTitle>
          </DialogHeader>
          {editing !== undefined ? (
            <TestimonialForm
              testimonial={editing}
              services={services}
              onSaved={() => {
                setEditing(undefined);
                queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TestimonialForm({
  testimonial,
  services,
  onSaved,
}: {
  testimonial: TestimonialDto | null;
  services: ServiceOption[];
  onSaved: () => void;
}) {
  const form = useForm<TestimonialFormValues, unknown, TestimonialCreateInput>({
    resolver: zodResolver(testimonialCreateSchema),
    defaultValues: {
      patientName: testimonial?.patientName ?? "",
      quote: testimonial?.quote ?? "",
      rating: testimonial?.rating ?? 5,
      photoId: testimonial?.photoId ?? null,
      serviceId: testimonial?.serviceId ?? null,
      sortOrder: testimonial?.sortOrder ?? 0,
      status: testimonial?.status ?? "DRAFT",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const save = useMutation({
    mutationFn: (values: TestimonialCreateInput) =>
      testimonial ? testimonialsApi.update(testimonial.id, values) : testimonialsApi.create(values),
    onSuccess: () => {
      toast.success(testimonial ? "Testimonial updated." : "Testimonial created.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patientName">Patient name</Label>
          <Input id="patientName" {...register("patientName")} placeholder="Farah S." />
          <p className="text-muted-foreground text-xs">
            Use whatever the patient agreed to — an initial for the surname is common.
          </p>
          <FieldError message={errors.patientName?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quote">Quote</Label>
          <Textarea id="quote" rows={4} {...register("quote")} />
          <FieldError message={errors.quote?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="rating"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select value={String(field.value)} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={String(rating)}>
                        {rating} star{rating === 1 ? "" : "s"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            control={control}
            name="serviceId"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Treatment (optional)</Label>
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(value) => field.onChange(value === NONE ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Not linked" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not linked</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>

        <Controller
          control={control}
          name="photoId"
          render={({ field }) => (
            <MediaPickerField
              label="Photo (optional)"
              folder="testimonials"
              value={field.value ?? null}
              previewUrl={testimonial?.photoUrl}
              onChange={(id) => field.onChange(id)}
            />
          )}
        />

        <PublishingCard
          resource="testimonials"
          submitLabel={testimonial ? "Save changes" : "Create testimonial"}
          pending={save.isPending}
          currentStatus={testimonial?.status}
        />
      </form>
    </FormProvider>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { galleryApi, galleryKeys } from "@/features/gallery/api";
import {
  galleryCreateSchema,
  type GalleryCaseDto,
  type GalleryCreateInput,
  type GalleryFormValues,
} from "@/features/gallery/schemas";
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

/** Small paired thumbnail so the list shows the actual before/after at a glance. */
function PairPreview({ before, after }: { before: string | null; after: string | null }) {
  return (
    <div className="flex gap-1">
      {[before, after].map((url, i) => (
        <div key={i} className="bg-muted relative size-10 overflow-hidden rounded">
          {url ? (
            <Image src={url} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <ImageOff
              className="text-muted-foreground absolute inset-0 m-auto size-3.5"
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function GalleryManager({ services }: { services: ServiceOption[] }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [editing, setEditing] = useState<GalleryCaseDto | null | undefined>(undefined);

  const { filters, setFilters, params } = useResourceFilters();

  const { data, isPending, error } = useQuery({
    queryKey: galleryKeys.list(params),
    queryFn: () => galleryApi.list(params),
  });

  const remove = useMutation({
    mutationFn: galleryApi.remove,
    onSuccess: () => {
      toast.success("Case deleted.");
      queryClient.invalidateQueries({ queryKey: galleryKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<GalleryCaseDto>[] = [
    {
      header: "Case",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <PairPreview before={item.beforeUrl} after={item.afterUrl} />
          <div>
            <span className="font-medium">{item.title}</span>
            {item.description ? (
              <span className="text-muted-foreground line-clamp-1 block max-w-sm text-xs">
                {item.description}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      header: "Treatment",
      className: "hidden md:table-cell",
      cell: (item) => item.serviceTitle ?? "—",
    },
    { header: "Order", className: "hidden sm:table-cell", cell: (item) => item.sortOrder },
    { header: "Status", cell: (item) => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <ResourceTable
        columns={columns}
        rows={data?.items}
        isPending={isPending}
        error={error}
        emptyMessage="No before & after cases yet."
        toolbar={
          <>
            <Input
              placeholder="Search cases…"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
              className="max-w-xs"
            />
            <StatusFilter
              value={filters.status}
              onChange={(status) => setFilters({ status, page: 1 })}
            />
            <Can permission="gallery.create">
              <Button className="ml-auto" onClick={() => setEditing(null)}>
                <Plus className="size-4" /> New case
              </Button>
            </Can>
          </>
        }
        rowActions={(item) => (
          <>
            {can("gallery.update") ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() => setEditing(item)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Can permission="gallery.delete">
              <ConfirmDialog
                title={`Delete “${item.title}”?`}
                description="The images stay in the media library. This cannot be undone."
                onConfirm={() => remove.mutateAsync(item.id)}
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
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit case" : "New case"}</DialogTitle>
          </DialogHeader>
          {editing !== undefined ? (
            <GalleryForm
              item={editing}
              services={services}
              onSaved={() => {
                setEditing(undefined);
                queryClient.invalidateQueries({ queryKey: galleryKeys.all });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GalleryForm({
  item,
  services,
  onSaved,
}: {
  item: GalleryCaseDto | null;
  services: ServiceOption[];
  onSaved: () => void;
}) {
  const form = useForm<GalleryFormValues, unknown, GalleryCreateInput>({
    resolver: zodResolver(galleryCreateSchema),
    defaultValues: {
      title: item?.title ?? "",
      description: item?.description ?? "",
      beforeMediaId: item?.beforeMediaId ?? null,
      afterMediaId: item?.afterMediaId ?? null,
      serviceId: item?.serviceId ?? null,
      sortOrder: item?.sortOrder ?? 0,
      status: item?.status ?? "DRAFT",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const save = useMutation({
    mutationFn: (values: GalleryCreateInput) =>
      item ? galleryApi.update(item.id, values) : galleryApi.create(values),
    onSuccess: () => {
      toast.success(item ? "Case updated." : "Case created.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} placeholder="Upper veneers, 6 units" />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            {...register("description")}
            placeholder="What was done, and over how long."
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="beforeMediaId"
            render={({ field }) => (
              <MediaPickerField
                label="Before"
                folder="gallery"
                value={field.value ?? null}
                previewUrl={item?.beforeUrl}
                onChange={(id) => field.onChange(id)}
              />
            )}
          />
          <Controller
            control={control}
            name="afterMediaId"
            render={({ field }) => (
              <MediaPickerField
                label="After"
                folder="gallery"
                value={field.value ?? null}
                previewUrl={item?.afterUrl}
                onChange={(id) => field.onChange(id)}
              />
            )}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Both images are required before a case can be published.
        </p>

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

        <PublishingCard
          resource="gallery"
          submitLabel={item ? "Save changes" : "Create case"}
          pending={save.isPending}
          currentStatus={item?.status}
        />
      </form>
    </FormProvider>
  );
}

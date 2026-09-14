"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { bannerKeys, bannersApi } from "@/features/banners/api";
import {
  bannerCreateSchema,
  type BannerCreateInput,
  type BannerDto,
  type BannerFormValues,
} from "@/features/banners/schemas";
import { MediaPickerField } from "@/features/media/components/MediaPickerField";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Switch } from "@/shared/ui/primitives/switch";
import { Badge } from "@/shared/ui/primitives/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FieldError } from "@/shared/ui/FieldError";

export function BannersManager() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [editing, setEditing] = useState<BannerDto | null | undefined>(undefined);

  const { data, isPending, error } = useQuery({
    queryKey: bannerKeys.all,
    queryFn: bannersApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: bannerKeys.all });

  const remove = useMutation({
    mutationFn: bannersApi.remove,
    onSuccess: () => {
      toast.success("Banner deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      bannersApi.update(id, { isActive }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<BannerDto>[] = [
    {
      header: "Banner",
      cell: (banner) => (
        <div className="flex items-center gap-3">
          <div className="bg-muted relative h-10 w-16 shrink-0 overflow-hidden rounded">
            {banner.mediaUrl ? (
              <Image src={banner.mediaUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <ImageOff
                className="text-muted-foreground absolute inset-0 m-auto size-3.5"
                aria-hidden
              />
            )}
          </div>
          <div>
            <span className="font-medium">{banner.heading}</span>
            {banner.subheading ? (
              <span className="text-muted-foreground line-clamp-1 block max-w-sm text-xs">
                {banner.subheading}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      header: "Call to action",
      className: "hidden md:table-cell",
      cell: (banner) =>
        banner.ctaLabel ? (
          <span className="text-sm">
            {banner.ctaLabel}
            <span className="text-muted-foreground block text-xs">{banner.ctaHref ?? "—"}</span>
          </span>
        ) : (
          "—"
        ),
    },
    { header: "Order", className: "hidden sm:table-cell", cell: (banner) => banner.sortOrder },
    {
      header: "Active",
      cell: (banner) =>
        can("banners.update") ? (
          <Switch
            checked={banner.isActive}
            onCheckedChange={(isActive) => toggle.mutate({ id: banner.id, isActive })}
            aria-label={banner.isActive ? "Deactivate" : "Activate"}
          />
        ) : (
          <Badge variant={banner.isActive ? "default" : "outline"}>
            {banner.isActive ? "active" : "off"}
          </Badge>
        ),
    },
  ];

  return (
    <>
      <ResourceTable
        columns={columns}
        rows={data}
        isPending={isPending}
        error={error}
        emptyMessage="No banners yet — the homepage falls back to its default hero."
        toolbar={
          <Can permission="banners.create">
            <Button className="ml-auto" onClick={() => setEditing(null)}>
              <Plus className="size-4" /> New banner
            </Button>
          </Can>
        }
        rowActions={(banner) => (
          <>
            {can("banners.update") ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() => setEditing(banner)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Can permission="banners.delete">
              <ConfirmDialog
                title={`Delete “${banner.heading}”?`}
                description="This cannot be undone."
                onConfirm={() => remove.mutateAsync(banner.id)}
              >
                <Button variant="ghost" size="icon" aria-label="Delete">
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </ConfirmDialog>
            </Can>
          </>
        )}
      />

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit banner" : "New banner"}</DialogTitle>
          </DialogHeader>
          {editing !== undefined ? (
            <BannerForm
              banner={editing}
              onSaved={() => {
                setEditing(undefined);
                invalidate();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function BannerForm({ banner, onSaved }: { banner: BannerDto | null; onSaved: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BannerFormValues, unknown, BannerCreateInput>({
    resolver: zodResolver(bannerCreateSchema),
    defaultValues: {
      heading: banner?.heading ?? "",
      subheading: banner?.subheading ?? "",
      mediaId: banner?.mediaId ?? null,
      ctaLabel: banner?.ctaLabel ?? "",
      ctaHref: banner?.ctaHref ?? "",
      sortOrder: banner?.sortOrder ?? 0,
      isActive: banner?.isActive ?? true,
    },
  });

  const save = useMutation({
    mutationFn: (values: BannerCreateInput) =>
      banner ? bannersApi.update(banner.id, values) : bannersApi.create(values),
    onSuccess: () => {
      toast.success(banner ? "Banner updated." : "Banner created.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Heading</Label>
        <Input
          id="heading"
          {...register("heading")}
          placeholder="A healthier smile, handled by specialists"
        />
        <FieldError message={errors.heading?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheading">Subheading</Label>
        <Textarea id="subheading" rows={2} {...register("subheading")} />
        <FieldError message={errors.subheading?.message} />
      </div>

      <Controller
        control={control}
        name="mediaId"
        render={({ field }) => (
          <MediaPickerField
            label="Background image"
            folder="banners"
            value={field.value ?? null}
            previewUrl={banner?.mediaUrl}
            onChange={(id) => field.onChange(id)}
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ctaLabel">Button label</Label>
          <Input id="ctaLabel" {...register("ctaLabel")} placeholder="Book an appointment" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctaHref">Button link</Label>
          <Input id="ctaHref" {...register("ctaHref")} placeholder="/contact" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input id="sortOrder" type="number" {...register("sortOrder")} />
        </div>
        <div className="flex items-center justify-between self-end pb-2">
          <Label htmlFor="isActive">Active</Label>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : banner ? "Save changes" : "Create banner"}
      </Button>
    </form>
  );
}

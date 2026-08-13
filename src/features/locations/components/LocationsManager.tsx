"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { locationKeys, locationsApi } from "@/features/locations/api";
import {
  locationCreateSchema,
  type LocationCreateInput,
  type LocationDto,
  type LocationFormValues,
} from "@/features/locations/schemas";
import { OpeningHoursField } from "@/features/locations/components/OpeningHoursField";
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

export function LocationsManager() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [editing, setEditing] = useState<LocationDto | null | undefined>(undefined);

  const { data, isPending, error } = useQuery({
    queryKey: locationKeys.all,
    queryFn: locationsApi.list,
  });

  const remove = useMutation({
    mutationFn: locationsApi.remove,
    onSuccess: () => {
      toast.success("Location deleted.");
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<LocationDto>[] = [
    {
      header: "Location",
      cell: (location) => (
        <>
          <span className="flex items-center gap-1.5 font-medium">
            {location.isPrimary ? (
              <Star className="fill-warning text-warning size-3.5" aria-label="Primary" />
            ) : null}
            {location.name}
          </span>
          <span className="text-muted-foreground block text-xs">{location.address}</span>
        </>
      ),
    },
    {
      header: "Contact",
      className: "hidden md:table-cell",
      cell: (location) => (
        <span className="text-sm">
          {location.phone ?? "—"}
          {location.whatsapp ? (
            <span className="text-muted-foreground block text-xs">
              WhatsApp {location.whatsapp}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      header: "Primary",
      cell: (location) =>
        location.isPrimary ? (
          <Badge>primary</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
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
        emptyMessage="No locations yet."
        toolbar={
          <Can permission="locations.create">
            <Button className="ml-auto" onClick={() => setEditing(null)}>
              <Plus className="size-4" /> New location
            </Button>
          </Can>
        }
        rowActions={(location) => (
          <>
            {can("locations.update") ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() => setEditing(location)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Can permission="locations.delete">
              <ConfirmDialog
                title={`Delete “${location.name}”?`}
                description={
                  location.isPrimary
                    ? "This is the primary location — another one will be promoted automatically."
                    : "This cannot be undone."
                }
                onConfirm={() => remove.mutateAsync(location.id)}
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
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit location" : "New location"}</DialogTitle>
          </DialogHeader>
          {editing !== undefined ? (
            <LocationForm
              location={editing}
              onSaved={() => {
                setEditing(undefined);
                queryClient.invalidateQueries({ queryKey: locationKeys.all });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function LocationForm({
  location,
  onSaved,
}: {
  location: LocationDto | null;
  onSaved: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormValues, unknown, LocationCreateInput>({
    resolver: zodResolver(locationCreateSchema),
    defaultValues: {
      name: location?.name ?? "",
      address: location?.address ?? "",
      city: location?.city ?? "",
      phone: location?.phone ?? "",
      whatsapp: location?.whatsapp ?? "",
      email: location?.email ?? "",
      mapEmbedUrl: location?.mapEmbedUrl ?? "",
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      openingHours: location?.openingHours ?? null,
      isPrimary: location?.isPrimary ?? false,
      sortOrder: location?.sortOrder ?? 0,
    },
  });

  const save = useMutation({
    mutationFn: (values: LocationCreateInput) =>
      location ? locationsApi.update(location.id, values) : locationsApi.create(values),
    onSuccess: () => {
      toast.success(location ? "Location updated." : "Location created.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="SmileOn Johar Town" />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="Lahore" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={2} {...register("address")} />
        <FieldError message={errors.address?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+92 300 0000000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" {...register("whatsapp")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mapEmbedUrl">Map embed URL</Label>
        <Input id="mapEmbedUrl" {...register("mapEmbedUrl")} placeholder="https://…" />
        <p className="text-muted-foreground text-xs">
          The <code>src</code> from a Google Maps embed. Shown on the contact page.
        </p>
      </div>

      <Controller
        control={control}
        name="openingHours"
        render={({ field }) => (
          <OpeningHoursField value={field.value ?? null} onChange={field.onChange} />
        )}
      />

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="isPrimary">Primary location</Label>
          <p className="text-muted-foreground text-xs">
            Drives the header phone number, the footer and the contact page.
          </p>
        </div>
        <Controller
          control={control}
          name="isPrimary"
          render={({ field }) => (
            <Switch id="isPrimary" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : location ? "Save changes" : "Create location"}
        </Button>
      </div>
    </form>
  );
}

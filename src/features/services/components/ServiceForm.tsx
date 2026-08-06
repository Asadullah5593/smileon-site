"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  serviceCreateSchema,
  type ServiceCreateInput,
  type ServiceDto,
  type ServiceFormValues,
} from "@/features/services/schemas";
import { serviceKeys, servicesApi } from "@/features/services/api";
import { MediaPickerField } from "@/features/media/components/MediaPickerField";
import { RichTextEditor } from "@/shared/editor/RichTextEditor";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Switch } from "@/shared/ui/primitives/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-destructive text-sm">{message}</p> : null;
}

/**
 * One form for create and edit. The very same zod schema validates here and in
 * the route handler, so client and server can never disagree.
 */
export function ServiceForm({ service }: { service?: ServiceDto }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    // Three type args: form values (schema input), context, parsed output.
  } = useForm<ServiceFormValues, unknown, ServiceCreateInput>({
    resolver: zodResolver(serviceCreateSchema),
    defaultValues: {
      title: service?.title ?? "",
      slug: service?.slug ?? "",
      summary: service?.summary ?? "",
      bodyHtml: service?.bodyHtml ?? "",
      imageId: service?.imageId ?? null,
      priceFrom: service?.priceFrom ?? null,
      duration: service?.duration ?? "",
      isFeatured: service?.isFeatured ?? false,
      sortOrder: service?.sortOrder ?? 0,
      status: service?.status ?? "DRAFT",
      seoTitle: service?.seoTitle ?? "",
      seoDescription: service?.seoDescription ?? "",
      noIndex: service?.noIndex ?? false,
    },
  });

  const save = useMutation({
    mutationFn: (values: ServiceCreateInput) =>
      service ? servicesApi.update(service.id, values) : servicesApi.create(values),
    onSuccess: (saved) => {
      toast.success(service ? "Treatment updated." : "Treatment created.");
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      router.push(`/admin/services/${saved.id}`);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => save.mutateAsync(values))}
      className="grid gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Treatment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Dental implants" />
              <FieldError message={errors.title?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input id="slug" {...register("slug")} placeholder="dental-implants" />
              <p className="text-muted-foreground text-xs">
                Leave blank to generate one from the title.
              </p>
              <FieldError message={errors.slug?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={3}
                {...register("summary")}
                placeholder="One or two sentences shown on cards and search results."
              />
              <FieldError message={errors.summary?.message} />
            </div>

            <Controller
              control={control}
              name="bodyHtml"
              render={({ field }) => (
                <RichTextEditor
                  label="Description"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Explain the treatment, what to expect, aftercare…"
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search engine listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" {...register("seoTitle")} />
              <FieldError message={errors.seoTitle?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">Meta description</Label>
              <Textarea id="seoDescription" rows={2} {...register("seoDescription")} />
              <FieldError message={errors.seoDescription?.message} />
            </div>
            <Controller
              control={control}
              name="noIndex"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label htmlFor="noIndex">Hide from search engines</Label>
                  <Switch id="noIndex" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Feature on the homepage</Label>
                  <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" type="number" {...register("sortOrder")} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || save.isPending}>
              {save.isPending ? "Saving…" : service ? "Save changes" : "Create treatment"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media & pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              control={control}
              name="imageId"
              render={({ field }) => (
                <MediaPickerField
                  label="Feature image"
                  folder="services"
                  value={field.value ?? null}
                  previewUrl={service?.imageUrl}
                  onChange={(id) => field.onChange(id)}
                />
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="priceFrom">Price from (PKR)</Label>
              <Input id="priceFrom" type="number" step="1" {...register("priceFrom")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Typical duration</Label>
              <Input id="duration" {...register("duration")} placeholder="45–60 minutes" />
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

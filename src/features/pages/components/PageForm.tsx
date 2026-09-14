"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  pageCreateSchema,
  type PageCreateInput,
  type PageDto,
  type PageFormValues,
} from "@/features/pages/schemas";
import { pageKeys, pagesApi } from "@/features/pages/api";
import { BlockEditor, type BannerOption } from "@/features/pages/components/BlockEditor";
import { PublishingCard } from "@/shared/content/PublishingCard";
import { SeoCard } from "@/shared/content/SeoCard";
import { RichTextEditor } from "@/shared/editor/RichTextEditor";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { FieldError } from "@/shared/ui/FieldError";

/** Live preview of where the page will live, so nested slugs aren't a surprise. */
function SlugPreview() {
  const slug = useWatch({ name: "slug" }) as string | undefined;
  return (
    <p className="text-muted-foreground text-xs">
      Address: <code>/{slug || "…"}</code>. Use <code>/</code> to nest, e.g.{" "}
      <code>about/our-values</code>.
    </p>
  );
}

export function PageForm({
  page,
  banners,
  faqGroups,
}: {
  page?: PageDto;
  banners: BannerOption[];
  faqGroups: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<PageFormValues, unknown, PageCreateInput>({
    resolver: zodResolver(pageCreateSchema),
    defaultValues: {
      title: page?.title ?? "",
      slug: page?.slug ?? "",
      excerpt: page?.excerpt ?? "",
      bodyHtml: page?.bodyHtml ?? "",
      blocks: page?.blocks ?? [],
      status: page?.status ?? "DRAFT",
      seoTitle: page?.seoTitle ?? "",
      seoDescription: page?.seoDescription ?? "",
      noIndex: page?.noIndex ?? false,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const save = useMutation({
    mutationFn: (values: PageCreateInput) =>
      page ? pagesApi.update(page.id, values) : pagesApi.create(values),
    onSuccess: (saved) => {
      toast.success(page ? "Page updated." : "Page created.");
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
      router.push(`/admin/pages/${saved.id}`);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit((values) => save.mutateAsync(values))}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} placeholder="About the clinic" />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Address</Label>
                <Input id="slug" {...register("slug")} placeholder="about" />
                <SlugPreview />
                <FieldError message={errors.slug?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={2}
                  {...register("excerpt")}
                  placeholder="A sentence used in listings and link previews."
                />
                <FieldError message={errors.excerpt?.message} />
              </div>

              <Controller
                control={control}
                name="bodyHtml"
                render={({ field }) => (
                  <RichTextEditor
                    label="Body"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Write the page…"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Controller
            control={control}
            name="blocks"
            render={({ field }) => (
              <BlockEditor
                value={field.value ?? []}
                onChange={field.onChange}
                banners={banners}
                faqGroups={faqGroups}
              />
            )}
          />

          <SeoCard />
        </div>

        <div className="space-y-6">
          <PublishingCard
            resource="pages"
            submitLabel={page ? "Save changes" : "Create page"}
            pending={save.isPending}
            currentStatus={page?.status}
            showSortOrder={false}
          />
        </div>
      </form>
    </FormProvider>
  );
}

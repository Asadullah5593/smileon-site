"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  postCreateSchema,
  type PostCreateInput,
  type PostDto,
  type PostFormValues,
} from "@/features/posts/schemas";
import { postKeys, postsApi } from "@/features/posts/api";
import { MediaPickerField } from "@/features/media/components/MediaPickerField";
import { PublishingCard } from "@/shared/content/PublishingCard";
import { SeoCard } from "@/shared/content/SeoCard";
import { RichTextEditor } from "@/shared/editor/RichTextEditor";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { FieldError } from "@/shared/ui/FieldError";
import { MultiSelectField, type SelectOption } from "@/shared/ui/MultiSelectField";

export function PostForm({
  post,
  categories,
  tags,
}: {
  post?: PostDto;
  categories: SelectOption[];
  tags: SelectOption[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<PostFormValues, unknown, PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      bodyHtml: post?.bodyHtml ?? "",
      coverId: post?.coverId ?? null,
      categoryIds: post?.categoryIds ?? [],
      tagIds: post?.tagIds ?? [],
      status: post?.status ?? "DRAFT",
      seoTitle: post?.seoTitle ?? "",
      seoDescription: post?.seoDescription ?? "",
      noIndex: post?.noIndex ?? false,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const save = useMutation({
    mutationFn: (values: PostCreateInput) =>
      post ? postsApi.update(post.id, values) : postsApi.create(values),
    onSuccess: (saved) => {
      toast.success(post ? "Post updated." : "Post created.");
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      router.push(`/admin/posts/${saved.id}`);
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
              <CardTitle className="text-base">Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} placeholder="How much do braces cost?" />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input id="slug" {...register("slug")} placeholder="braces-cost" />
                <p className="text-muted-foreground text-xs">
                  Leave blank to generate one from the title.
                </p>
                <FieldError message={errors.slug?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={2}
                  {...register("excerpt")}
                  placeholder="Shown on the blog index and in link previews."
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
                    placeholder="Write the post…"
                  />
                )}
              />
              <p className="text-muted-foreground text-xs">
                Reading time is worked out from the body — no need to enter it.
              </p>
            </CardContent>
          </Card>

          <SeoCard />
        </div>

        <div className="space-y-6">
          <PublishingCard
            resource="posts"
            submitLabel={post ? "Save changes" : "Create post"}
            pending={save.isPending}
            currentStatus={post?.status}
            showSortOrder={false}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={control}
                name="categoryIds"
                render={({ field }) => (
                  <MultiSelectField
                    label="Categories"
                    options={categories}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    emptyMessage="Add categories under Categories & tags."
                  />
                )}
              />
              <Controller
                control={control}
                name="tagIds"
                render={({ field }) => (
                  <MultiSelectField
                    label="Tags"
                    options={tags}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    emptyMessage="Add tags under Categories & tags."
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cover image</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="coverId"
                render={({ field }) => (
                  <MediaPickerField
                    label="Cover"
                    folder="blog"
                    value={field.value ?? null}
                    previewUrl={post?.coverUrl}
                    onChange={(id) => field.onChange(id)}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}

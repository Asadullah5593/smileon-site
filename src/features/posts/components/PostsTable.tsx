"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { postKeys, postsApi } from "@/features/posts/api";
import type { PostDto } from "@/features/posts/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { StatusFilter } from "@/shared/content/StatusFilter";
import { useResourceFilters } from "@/shared/content/use-resource-filters";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Badge } from "@/shared/ui/primitives/badge";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/StatusBadge";

const columns: ResourceColumn<PostDto>[] = [
  {
    header: "Title",
    cell: (post) => (
      <>
        <span className="font-medium">{post.title}</span>
        <span className="text-muted-foreground block text-xs">
          /{post.slug}
          {post.readMinutes ? ` · ${post.readMinutes} min read` : ""}
        </span>
      </>
    ),
  },
  {
    header: "Categories",
    className: "hidden lg:table-cell",
    cell: (post) =>
      post.categoryNames.length === 0 ? (
        "—"
      ) : (
        <span className="flex flex-wrap gap-1">
          {post.categoryNames.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </span>
      ),
  },
  {
    header: "Author",
    className: "hidden md:table-cell",
    cell: (post) => post.authorName ?? "—",
  },
  {
    header: "Published",
    className: "hidden sm:table-cell",
    cell: (post) => (post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"),
  },
  { header: "Status", cell: (post) => <StatusBadge status={post.status} /> },
];

export function PostsTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { filters, setFilters, params } = useResourceFilters();

  const { data, isPending, error } = useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postsApi.list(params),
  });

  const remove = useMutation({
    mutationFn: postsApi.remove,
    onSuccess: () => {
      toast.success("Post deleted.");
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ResourceTable
      columns={columns}
      rows={data?.items}
      isPending={isPending}
      error={error}
      emptyMessage="No posts yet."
      toolbar={
        <>
          <Input
            placeholder="Search posts…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
            className="max-w-xs"
          />
          <StatusFilter
            value={filters.status}
            onChange={(status) => setFilters({ status, page: 1 })}
          />
          <Can permission="posts.create">
            <Button asChild className="ml-auto">
              <Link href="/admin/posts/new">
                <Plus className="size-4" /> New post
              </Link>
            </Button>
          </Can>
        </>
      }
      rowActions={(post) => (
        <>
          {can("posts.update") ? (
            <Button variant="ghost" size="icon" asChild aria-label="Edit">
              <Link href={`/admin/posts/${post.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Can permission="posts.delete">
            <ConfirmDialog
              title={`Delete “${post.title}”?`}
              description="This removes the post from the blog. It cannot be undone."
              onConfirm={() => remove.mutateAsync(post.id)}
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
  );
}

"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { pageKeys, pagesApi } from "@/features/pages/api";
import type { PageDto } from "@/features/pages/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { StatusFilter } from "@/shared/content/StatusFilter";
import { useResourceFilters } from "@/shared/content/use-resource-filters";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/StatusBadge";

const columns: ResourceColumn<PageDto>[] = [
  {
    header: "Title",
    cell: (page) => (
      <>
        <span className="font-medium">{page.title}</span>
        <span className="text-muted-foreground block text-xs">/{page.slug}</span>
      </>
    ),
  },
  {
    header: "Excerpt",
    className: "hidden lg:table-cell",
    cell: (page) => (
      <span className="text-muted-foreground line-clamp-1 block max-w-sm text-sm">
        {page.excerpt ?? "—"}
      </span>
    ),
  },
  {
    header: "Updated",
    className: "hidden sm:table-cell",
    cell: (page) => new Date(page.updatedAt).toLocaleDateString(),
  },
  { header: "Status", cell: (page) => <StatusBadge status={page.status} /> },
];

export function PagesTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { filters, setFilters, params } = useResourceFilters();

  const { data, isPending, error } = useQuery({
    queryKey: pageKeys.list(params),
    queryFn: () => pagesApi.list(params),
  });

  const remove = useMutation({
    mutationFn: pagesApi.remove,
    onSuccess: () => {
      toast.success("Page deleted.");
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ResourceTable
      columns={columns}
      rows={data?.items}
      isPending={isPending}
      error={error}
      emptyMessage="No pages yet."
      toolbar={
        <>
          <Input
            placeholder="Search pages…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
            className="max-w-xs"
          />
          <StatusFilter
            value={filters.status}
            onChange={(status) => setFilters({ status, page: 1 })}
          />
          <Can permission="pages.create">
            <Button asChild className="ml-auto">
              <Link href="/admin/pages/new">
                <Plus className="size-4" /> New page
              </Link>
            </Button>
          </Can>
        </>
      }
      rowActions={(page) => (
        <>
          {can("pages.update") ? (
            <Button variant="ghost" size="icon" asChild aria-label="Edit">
              <Link href={`/admin/pages/${page.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Can permission="pages.delete">
            <ConfirmDialog
              title={`Delete “${page.title}”?`}
              description={`Anyone visiting /${page.slug} will get a 404. This cannot be undone.`}
              onConfirm={() => remove.mutateAsync(page.id)}
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

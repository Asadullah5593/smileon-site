"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { serviceKeys, servicesApi } from "@/features/services/api";
import type { ServiceDto } from "@/features/services/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { StatusFilter } from "@/shared/content/StatusFilter";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

const columns: ResourceColumn<ServiceDto>[] = [
  {
    header: "Title",
    cell: (service) => (
      <>
        <span className="font-medium">{service.title}</span>
        <span className="text-muted-foreground block text-xs">/{service.slug}</span>
      </>
    ),
  },
  {
    header: "Category",
    className: "hidden md:table-cell",
    cell: (service) => service.categoryName ?? "—",
  },
  {
    header: "Order",
    className: "hidden sm:table-cell",
    cell: (service) => service.sortOrder,
  },
  { header: "Status", cell: (service) => <StatusBadge status={service.status} /> },
];

/**
 * The reference admin list: URL-synced filters, server pagination, and
 * invalidation on delete. Copy this file when adding the next resource — the
 * table shell itself lives in `shared/ui/ResourceTable`.
 */
export function ServicesTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
    status: parseAsString.withDefault(""),
  });

  const params = {
    page: filters.page,
    pageSize: 20,
    q: filters.q || undefined,
    status: filters.status || undefined,
  };

  const { data, isPending, error } = useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => servicesApi.list(params),
  });

  const remove = useMutation({
    mutationFn: servicesApi.remove,
    onSuccess: () => {
      toast.success("Treatment deleted.");
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ResourceTable
      columns={columns}
      rows={data?.items}
      isPending={isPending}
      error={error}
      emptyMessage="No treatments yet."
      toolbar={
        <>
          <Input
            placeholder="Search treatments…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
            className="max-w-xs"
          />
          <StatusFilter
            value={filters.status}
            onChange={(status) => setFilters({ status, page: 1 })}
          />
          <Can permission="services.create">
            <Button asChild className="ml-auto">
              <Link href="/admin/services/new">
                <Plus className="size-4" /> New treatment
              </Link>
            </Button>
          </Can>
        </>
      }
      rowActions={(service) => (
        <>
          {can("services.update") ? (
            <Button variant="ghost" size="icon" asChild aria-label="Edit">
              <Link href={`/admin/services/${service.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Can permission="services.delete">
            <ConfirmDialog
              title={`Delete “${service.title}”?`}
              description="This removes the treatment from the website. It cannot be undone."
              onConfirm={() => remove.mutateAsync(service.id)}
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

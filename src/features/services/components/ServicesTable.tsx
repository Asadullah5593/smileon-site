"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { serviceKeys, servicesApi } from "@/features/services/api";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/primitives/table";
import { Skeleton } from "@/shared/ui/primitives/skeleton";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

const ALL = "all";

/**
 * The reference admin list: URL-synced filters + server pagination + optimistic
 * invalidation. Copy this file when adding the next resource.
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

  const { data, isPending, isError, error } = useQuery({
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search treatments…"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
          className="max-w-xs"
        />
        <Select
          value={filters.status || ALL}
          onValueChange={(value) => setFilters({ status: value === ALL ? null : value, page: 1 })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Can permission="services.create">
          <Button asChild className="ml-auto">
            <Link href="/admin/services/new">
              <Plus className="size-4" /> New treatment
            </Link>
          </Button>
        </Can>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                  No treatments yet.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <span className="font-medium">{service.title}</span>
                    <span className="text-muted-foreground block text-xs">/{service.slug}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {service.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{service.sortOrder}</TableCell>
                  <TableCell>
                    <StatusBadge status={service.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {data.page} of {data.pageCount} · {data.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setFilters({ page: data.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.pageCount}
              onClick={() => setFilters({ page: data.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

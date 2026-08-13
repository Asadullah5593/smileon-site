"use client";

import type { ReactNode } from "react";
import { Button } from "@/shared/ui/primitives/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/primitives/table";
import { Skeleton } from "@/shared/ui/primitives/skeleton";
import { cn } from "@/shared/utils/cn";

export type ResourceColumn<T> = {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Applied to both the header and the body cell — e.g. "hidden md:table-cell". */
  className?: string;
};

type ResourceTableProps<T> = {
  columns: ResourceColumn<T>[];
  rows: T[] | undefined;
  isPending: boolean;
  error?: Error | null;
  /** Shown when the query succeeded but returned nothing. */
  emptyMessage: string;
  /** Filters and the "New …" button. Rendered above the table. */
  toolbar?: ReactNode;
  /** Right-aligned per-row buttons. Omit for a read-only table. */
  rowActions?: (row: T) => ReactNode;
  pagination?: {
    page: number;
    pageCount: number;
    total: number;
    onPageChange: (page: number) => void;
  };
};

/**
 * The presentation half of an admin list: toolbar, table shell, loading /
 * error / empty states, and pagination.
 *
 * Deliberately does no data fetching. Each module keeps its own `useQuery` and
 * `useMutation` so the queries stay readable at the call site instead of
 * disappearing behind a generic.
 */
export function ResourceTable<T extends { id: string }>({
  columns,
  rows,
  isPending,
  error,
  emptyMessage,
  toolbar,
  rowActions,
  pagination,
}: ResourceTableProps<T>) {
  const columnCount = columns.length + (rowActions ? 1 : 0);

  return (
    <div className="space-y-4">
      {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {rowActions ? <TableHead className="w-24 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columnCount}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-destructive py-8 text-center">
                  {error.message}
                </TableCell>
              </TableRow>
            ) : !rows || rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="text-muted-foreground py-10 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column, i) => (
                    <TableCell key={i} className={cn(column.className)}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                  {rowActions ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">{rowActions(row)}</div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

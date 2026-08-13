"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { Download } from "lucide-react";
import { auditApi, auditKeys } from "@/features/audit/api";
import type { AuditEntryDto, AuditFacets } from "@/features/audit/schemas";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";

const ALL = "all";

/** `diffOf` produces `{ field: { from, to } }`, or `{ created: {...} }`. */
type DiffMap = Record<string, { from?: unknown; to?: unknown }>;

function isDiffMap(diff: unknown): diff is DiffMap {
  return Boolean(diff) && typeof diff === "object" && !Array.isArray(diff);
}

function render(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AuditLogTable({ facets }: { facets: AuditFacets }) {
  const [open, setOpen] = useState<AuditEntryDto | null>(null);

  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
    actorId: parseAsString.withDefault(""),
    entity: parseAsString.withDefault(""),
    action: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const params = {
    page: filters.page,
    pageSize: 25,
    q: filters.q || undefined,
    actorId: filters.actorId || undefined,
    entity: filters.entity || undefined,
    action: filters.action || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };

  const { data, isPending, error } = useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.list(params),
  });

  const columns: ResourceColumn<AuditEntryDto>[] = [
    {
      header: "When",
      cell: (entry) => (
        <button
          type="button"
          onClick={() => setOpen(entry)}
          className="text-left text-sm hover:underline"
        >
          {new Date(entry.createdAt).toLocaleString()}
        </button>
      ),
    },
    {
      header: "Who",
      cell: (entry) =>
        entry.actorName ?? <span className="text-muted-foreground italic">deleted user</span>,
    },
    {
      header: "What",
      cell: (entry) => (
        <>
          <Badge variant="secondary">{entry.action}</Badge>
          <span className="text-muted-foreground block text-xs">{entry.summary ?? "—"}</span>
        </>
      ),
    },
    {
      header: "Record",
      className: "hidden lg:table-cell",
      cell: (entry) => (
        <span className="text-muted-foreground text-xs">
          {entry.entity}
          {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ""}
        </span>
      ),
    },
  ];

  return (
    <>
      <ResourceTable
        columns={columns}
        rows={data?.items}
        isPending={isPending}
        error={error}
        emptyMessage="Nothing recorded yet."
        toolbar={
          <>
            <Input
              placeholder="Search summaries…"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
              className="max-w-xs"
            />

            <Select
              value={filters.actorId || ALL}
              onValueChange={(value) =>
                setFilters({ actorId: value === ALL ? null : value, page: 1 })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Anyone</SelectItem>
                {facets.actors.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    {actor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.action || ALL}
              onValueChange={(value) =>
                setFilters({ action: value === ALL ? null : value, page: 1 })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Any action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any action</SelectItem>
                {facets.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Label htmlFor="from" className="text-muted-foreground text-xs">
                From
              </Label>
              <Input
                id="from"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ from: e.target.value || null, page: 1 })}
                className="w-40"
              />
              <Label htmlFor="to" className="text-muted-foreground text-xs">
                To
              </Label>
              <Input
                id="to"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ to: e.target.value || null, page: 1 })}
                className="w-40"
              />
            </div>

            <Button variant="outline" asChild className="ml-auto">
              <a href={auditApi.exportUrl({ ...params, page: undefined, pageSize: undefined })}>
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
          </>
        }
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

      <Dialog open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle>{open.action}</DialogTitle>
              </DialogHeader>

              <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                <dt className="text-muted-foreground">When</dt>
                <dd>{new Date(open.createdAt).toLocaleString()}</dd>
                <dt className="text-muted-foreground">Who</dt>
                <dd>{open.actorName ?? "deleted user"}</dd>
                <dt className="text-muted-foreground">Record</dt>
                <dd>
                  {open.entity}
                  {open.entityId ? ` · ${open.entityId}` : ""}
                </dd>
                <dt className="text-muted-foreground">Summary</dt>
                <dd>{open.summary ?? "—"}</dd>
              </dl>

              <div>
                <p className="mb-2 text-sm font-medium">Changes</p>
                {isDiffMap(open.diff) && Object.keys(open.diff).length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left font-medium">Field</th>
                          <th className="p-2 text-left font-medium">Before</th>
                          <th className="p-2 text-left font-medium">After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(open.diff).map(([field, change]) => (
                          <tr key={field} className="border-t">
                            <td className="p-2 font-medium">{field}</td>
                            <td className="text-muted-foreground max-w-48 truncate p-2">
                              {render(change?.from)}
                            </td>
                            <td className="max-w-48 truncate p-2">{render(change?.to)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No field-level detail was recorded for this action.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

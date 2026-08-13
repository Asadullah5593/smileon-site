"use client";

import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { teamApi, teamKeys } from "@/features/team/api";
import type { TeamMemberDto } from "@/features/team/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { StatusFilter } from "@/shared/content/StatusFilter";
import { useResourceFilters } from "@/shared/content/use-resource-filters";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/StatusBadge";

export function TeamTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const { filters, setFilters, params } = useResourceFilters();

  const { data, isPending, error } = useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => teamApi.list(params),
  });

  const remove = useMutation({
    mutationFn: teamApi.remove,
    onSuccess: () => {
      toast.success("Team member removed.");
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<TeamMemberDto>[] = [
    {
      header: "Name",
      cell: (member) => (
        <div className="flex items-center gap-3">
          <div className="bg-muted relative size-9 shrink-0 overflow-hidden rounded-full">
            {member.photoUrl ? (
              <Image src={member.photoUrl} alt="" fill sizes="36px" className="object-cover" />
            ) : (
              <User className="text-muted-foreground absolute inset-0 m-auto size-4" aria-hidden />
            )}
          </div>
          <div>
            <span className="font-medium">{member.name}</span>
            <span className="text-muted-foreground block text-xs">{member.designation ?? "—"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Specialties",
      className: "hidden lg:table-cell",
      cell: (member) => (member.specialties.length > 0 ? member.specialties.join(", ") : "—"),
    },
    { header: "Order", className: "hidden sm:table-cell", cell: (member) => member.sortOrder },
    { header: "Status", cell: (member) => <StatusBadge status={member.status} /> },
  ];

  return (
    <ResourceTable
      columns={columns}
      rows={data?.items}
      isPending={isPending}
      error={error}
      emptyMessage="No team members yet."
      toolbar={
        <>
          <Input
            placeholder="Search name or role…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
            className="max-w-xs"
          />
          <StatusFilter
            value={filters.status}
            onChange={(status) => setFilters({ status, page: 1 })}
          />
          <Can permission="team.create">
            <Button asChild className="ml-auto">
              <Link href="/admin/team/new">
                <Plus className="size-4" /> New team member
              </Link>
            </Button>
          </Can>
        </>
      }
      rowActions={(member) => (
        <>
          {can("team.update") ? (
            <Button variant="ghost" size="icon" asChild aria-label="Edit">
              <Link href={`/admin/team/${member.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Can permission="team.delete">
            <ConfirmDialog
              title={`Remove ${member.name}?`}
              description="They will disappear from the website. This cannot be undone."
              onConfirm={() => remove.mutateAsync(member.id)}
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

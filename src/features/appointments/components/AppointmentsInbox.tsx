"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Download, MessageCircle, Phone, Trash2 } from "lucide-react";
import { appointmentKeys, appointmentsApi } from "@/features/appointments/api";
import type { AppointmentDto } from "@/features/appointments/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/StatusBadge";

const STATUSES = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
const ALL = "all";

/** Digits only — what `tel:` and `wa.me` both want. */
const dial = (phone: string) => phone.replace(/[^\d+]/g, "");
const whatsapp = (phone: string) => dial(phone).replace(/^\+/, "");

export function AppointmentsInbox() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
    appointmentStatus: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const params = {
    page: filters.page,
    pageSize: 20,
    q: filters.q || undefined,
    appointmentStatus: filters.appointmentStatus || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };

  const { data, isPending, error } = useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentsApi.list(params),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.setStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: appointmentsApi.remove,
    onSuccess: () => {
      toast.success("Request deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<AppointmentDto>[] = [
    {
      header: "Patient",
      cell: (appointment) => (
        <>
          <span className="font-medium">{appointment.name}</span>
          <span className="text-muted-foreground block text-xs">
            {appointment.phone}
            {appointment.email ? ` · ${appointment.email}` : ""}
          </span>
          {appointment.message ? (
            <span className="text-muted-foreground mt-1 block max-w-md text-xs">
              {appointment.message}
            </span>
          ) : null}
        </>
      ),
    },
    {
      header: "Treatment",
      className: "hidden md:table-cell",
      cell: (appointment) => appointment.serviceTitle ?? "—",
    },
    {
      header: "Preferred",
      className: "hidden sm:table-cell",
      cell: (appointment) =>
        `${
          appointment.preferredDate ? new Date(appointment.preferredDate).toLocaleDateString() : "—"
        } ${appointment.preferredTime ?? ""}`.trim(),
    },
    { header: "Status", cell: (appointment) => <StatusBadge status={appointment.status} /> },
    {
      header: "Set status",
      className: "w-40",
      cell: (appointment) =>
        can("appointments.update") ? (
          <Select
            value={appointment.status}
            onValueChange={(status) => setStatus.mutate({ id: appointment.id, status })}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null,
    },
  ];

  return (
    <ResourceTable
      columns={columns}
      rows={data?.items}
      isPending={isPending}
      error={error}
      emptyMessage="No requests yet."
      toolbar={
        <>
          <Input
            placeholder="Search name, phone or email…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
            className="max-w-xs"
          />
          <Select
            value={filters.appointmentStatus || ALL}
            onValueChange={(value) =>
              setFilters({ appointmentStatus: value === ALL ? null : value, page: 1 })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.toLowerCase()}
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

          <Can permission="appointments.export">
            <Button variant="outline" asChild className="ml-auto">
              {/* A download, not a fetch — let the browser handle it. */}
              <a
                href={appointmentsApi.exportUrl({
                  ...params,
                  page: undefined,
                  pageSize: undefined,
                })}
              >
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
          </Can>
        </>
      }
      rowActions={(appointment) => (
        <>
          <Button variant="ghost" size="icon" asChild aria-label="Call" title="Call">
            <a href={`tel:${dial(appointment.phone)}`}>
              <Phone className="size-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="WhatsApp" title="WhatsApp">
            <a
              href={`https://wa.me/${whatsapp(appointment.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
            </a>
          </Button>
          <Can permission="appointments.delete">
            <ConfirmDialog
              title={`Delete the request from ${appointment.name}?`}
              description="Appointment requests are a business record. This cannot be undone."
              onConfirm={() => remove.mutateAsync(appointment.id)}
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

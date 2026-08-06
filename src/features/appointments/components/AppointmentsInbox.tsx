"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { apiFetch, toQueryString } from "@/shared/api/http";
import type { Paginated } from "@/shared/api/response";
import { usePermissions } from "@/shared/auth/permissions-context";
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
import { StatusBadge } from "@/shared/ui/StatusBadge";

type Appointment = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  serviceTitle: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

const STATUSES = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
const ALL = "all";

export function AppointmentsInbox() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
    appointmentStatus: parseAsString.withDefault(""),
  });

  const params = {
    page: filters.page,
    pageSize: 20,
    q: filters.q || undefined,
    appointmentStatus: filters.appointmentStatus || undefined,
  };

  const { data, isPending } = useQuery({
    queryKey: ["appointments", params],
    queryFn: () =>
      apiFetch<Paginated<Appointment>>(`/api/admin/appointments${toQueryString(params)}`),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/admin/appointments/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: () => {
      toast.success("Status updated.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden md:table-cell">Treatment</TableHead>
              <TableHead className="hidden sm:table-cell">Preferred</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40 text-right">Set status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                  No requests yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {appointment.serviceTitle ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {appointment.preferredDate
                      ? new Date(appointment.preferredDate).toLocaleDateString()
                      : "—"}{" "}
                    {appointment.preferredTime ?? ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={appointment.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {can("appointments.update") ? (
                      <Select
                        value={appointment.status}
                        onValueChange={(status) => setStatus.mutate({ id: appointment.id, status })}
                      >
                        <SelectTrigger className="ml-auto w-36">
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
                    ) : null}
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

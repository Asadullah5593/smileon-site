"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { messageKeys, messagesApi } from "@/features/messages/api";
import type { MessageDto } from "@/features/messages/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Badge } from "@/shared/ui/primitives/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/primitives/dialog";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { cn } from "@/shared/utils/cn";

const ALL = "all";

export function MessagesInbox() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [open, setOpen] = useState<MessageDto | null>(null);

  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
    read: parseAsString.withDefault(""),
  });

  const params = {
    page: filters.page,
    pageSize: 20,
    q: filters.q || undefined,
    read: (filters.read || undefined) as "true" | "false" | undefined,
  };

  const { data, isPending, error } = useQuery({
    queryKey: messageKeys.list(params),
    queryFn: () => messagesApi.list(params),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: messageKeys.all });

  const setRead = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      messagesApi.setRead(id, isRead),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: messagesApi.remove,
    onSuccess: () => {
      toast.success("Message deleted.");
      setOpen(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Opening a message marks it read, the way an inbox is expected to behave. */
  function openMessage(message: MessageDto) {
    setOpen(message);
    if (!message.isRead && can("messages.update")) {
      setRead.mutate({ id: message.id, isRead: true });
    }
  }

  const columns: ResourceColumn<MessageDto>[] = [
    {
      header: "From",
      cell: (message) => (
        <button
          type="button"
          onClick={() => openMessage(message)}
          className="text-left hover:underline"
        >
          <span className={cn("block", !message.isRead && "font-semibold")}>{message.name}</span>
          <span className="text-muted-foreground block text-xs">{message.email}</span>
        </button>
      ),
    },
    {
      header: "Subject",
      className: "hidden md:table-cell",
      cell: (message) => (
        <button
          type="button"
          onClick={() => openMessage(message)}
          className="max-w-md text-left hover:underline"
        >
          <span className={cn("block", !message.isRead && "font-medium")}>
            {message.subject ?? "(no subject)"}
          </span>
          <span className="text-muted-foreground line-clamp-1 block text-xs">
            {message.message}
          </span>
        </button>
      ),
    },
    {
      header: "Received",
      className: "hidden sm:table-cell",
      cell: (message) => new Date(message.createdAt).toLocaleDateString(),
    },
    {
      header: "Status",
      cell: (message) =>
        message.isRead ? (
          <Badge variant="outline">read</Badge>
        ) : (
          <Badge variant="default">new</Badge>
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
        emptyMessage="No messages yet."
        toolbar={
          <>
            <Input
              placeholder="Search name, email or message…"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
              className="max-w-xs"
            />
            <Select
              value={filters.read || ALL}
              onValueChange={(value) => setFilters({ read: value === ALL ? null : value, page: 1 })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All messages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All messages</SelectItem>
                <SelectItem value="false">Unread</SelectItem>
                <SelectItem value="true">Read</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        rowActions={(message) => (
          <>
            <Can permission="messages.update">
              <Button
                variant="ghost"
                size="icon"
                aria-label={message.isRead ? "Mark as unread" : "Mark as read"}
                title={message.isRead ? "Mark as unread" : "Mark as read"}
                onClick={() => setRead.mutate({ id: message.id, isRead: !message.isRead })}
              >
                {message.isRead ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
              </Button>
            </Can>
            <Can permission="messages.delete">
              <ConfirmDialog
                title={`Delete the message from ${message.name}?`}
                description="This cannot be undone."
                onConfirm={() => remove.mutateAsync(message.id)}
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

      <Dialog open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle>{open.subject ?? "(no subject)"}</DialogTitle>
                <DialogDescription>
                  {open.name} · {open.email}
                  {open.phone ? ` · ${open.phone}` : ""} ·{" "}
                  {new Date(open.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <p className="max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">{open.message}</p>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(null)}>
                  Close
                </Button>
                <Button asChild>
                  <a
                    href={`mailto:${open.email}?subject=${encodeURIComponent(
                      `Re: ${open.subject ?? "your enquiry"}`,
                    )}`}
                  >
                    Reply by email
                  </a>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

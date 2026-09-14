"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Plus, Trash2, Upload } from "lucide-react";
import { redirectKeys, redirectsApi } from "@/features/redirects/api";
import {
  redirectCreateSchema,
  type RedirectCreateInput,
  type RedirectDto,
  type RedirectFormValues,
} from "@/features/redirects/schemas";
import { Can } from "@/shared/auth/permissions-context";
import { useResourceFilters } from "@/shared/content/use-resource-filters";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Switch } from "@/shared/ui/primitives/switch";
import { Badge } from "@/shared/ui/primitives/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FieldError } from "@/shared/ui/FieldError";

export function RedirectsManager() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const { filters, setFilters, params } = useResourceFilters();
  const listParams = { page: params.page, pageSize: params.pageSize, q: params.q };

  const { data, isPending, error } = useQuery({
    queryKey: redirectKeys.list(listParams),
    queryFn: () => redirectsApi.list(listParams),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: redirectKeys.all });

  const remove = useMutation({
    mutationFn: redirectsApi.remove,
    onSuccess: () => {
      toast.success("Redirect deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<RedirectDto>[] = [
    {
      header: "From",
      cell: (redirect) => <code className="text-sm">{redirect.source}</code>,
    },
    {
      header: "",
      className: "w-8",
      cell: () => <ArrowRight className="text-muted-foreground size-4" aria-hidden />,
    },
    {
      header: "To",
      cell: (redirect) => <code className="text-sm">{redirect.target}</code>,
    },
    {
      header: "Type",
      cell: (redirect) => (
        <Badge variant={redirect.permanent ? "default" : "secondary"}>
          {redirect.permanent ? "301" : "302"}
        </Badge>
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
        emptyMessage="No redirects yet."
        toolbar={
          <>
            <Input
              placeholder="Search paths…"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
              className="max-w-xs"
            />
            <Can permission="redirects.create">
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={() => setImporting(true)}>
                  <Upload className="size-4" /> Bulk import
                </Button>
                <Button onClick={() => setAdding(true)}>
                  <Plus className="size-4" /> New redirect
                </Button>
              </div>
            </Can>
          </>
        }
        rowActions={(redirect) => (
          <Can permission="redirects.delete">
            <ConfirmDialog
              title="Delete this redirect?"
              description={`${redirect.source} → ${redirect.target}`}
              onConfirm={() => remove.mutateAsync(redirect.id)}
            >
              <Button variant="ghost" size="icon" aria-label="Delete">
                <Trash2 className="text-destructive size-4" />
              </Button>
            </ConfirmDialog>
          </Can>
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

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New redirect</DialogTitle>
          </DialogHeader>
          <RedirectForm
            onSaved={() => {
              setAdding(false);
              invalidate();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={importing} onOpenChange={setImporting}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk import</DialogTitle>
          </DialogHeader>
          <ImportForm
            onDone={() => {
              setImporting(false);
              invalidate();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function RedirectForm({ onSaved }: { onSaved: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RedirectFormValues, unknown, RedirectCreateInput>({
    resolver: zodResolver(redirectCreateSchema),
    defaultValues: { source: "", target: "", permanent: true },
  });

  const save = useMutation({
    mutationFn: redirectsApi.create,
    onSuccess: () => {
      toast.success("Redirect created.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="source">From</Label>
        <Input id="source" {...register("source")} placeholder="/old-page" />
        <FieldError message={errors.source?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target">To</Label>
        <Input id="target" {...register("target")} placeholder="/services/dental-implants" />
        <FieldError message={errors.target?.message} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="permanent">Permanent (301)</Label>
          <p className="text-muted-foreground text-xs">
            Permanent passes search ranking to the new address. Use temporary (302) if the move
            might be reversed.
          </p>
        </div>
        <Controller
          control={control}
          name="permanent"
          render={({ field }) => (
            <Switch
              id="permanent"
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Create redirect"}
      </Button>
    </form>
  );
}

function ImportForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");

  const run = useMutation({
    mutationFn: () => redirectsApi.import(text),
    onSuccess: (result) => {
      const parts = [`${result.created} added`];
      if (result.skipped > 0) parts.push(`${result.skipped} already existed`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} skipped as invalid`);
      toast.success(parts.join(", "));

      // Leave the bad lines in the box so they can be corrected and re-pasted.
      if (result.errors.length > 0) {
        setText(result.errors.map((e) => `# ${e.reason}\n${e.text}`).join("\n"));
      } else {
        onDone();
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bulk">One redirect per line</Label>
        <Textarea
          id="bulk"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"/old-page,/new-page\n/another,/somewhere-else,false"}
          className="font-mono text-xs"
        />
        <p className="text-muted-foreground text-xs">
          <code>from,to</code> — add <code>,false</code> for a temporary redirect. Lines starting
          with <code>#</code> are ignored.
        </p>
      </div>

      <Button onClick={() => run.mutate()} disabled={run.isPending || text.trim().length === 0}>
        {run.isPending ? "Importing…" : "Import"}
      </Button>
    </div>
  );
}

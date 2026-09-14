"use client";

import { useState } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { faqKeys, faqsApi } from "@/features/faqs/api";
import {
  faqCreateSchema,
  type FaqCreateInput,
  type FaqDto,
  type FaqFormValues,
} from "@/features/faqs/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { PublishingCard } from "@/shared/content/PublishingCard";
import { StatusFilter } from "@/shared/content/StatusFilter";
import { RichTextEditor } from "@/shared/editor/RichTextEditor";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/primitives/dialog";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { FieldError } from "@/shared/ui/FieldError";
import { useResourceFilters } from "@/shared/content/use-resource-filters";

export function FaqsManager({ groups }: { groups: string[] }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [editing, setEditing] = useState<FaqDto | null | undefined>(undefined);

  const { filters, setFilters, params } = useResourceFilters();

  const { data, isPending, error } = useQuery({
    queryKey: faqKeys.list(params),
    queryFn: () => faqsApi.list(params),
  });

  const remove = useMutation({
    mutationFn: faqsApi.remove,
    onSuccess: () => {
      toast.success("FAQ deleted.");
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<FaqDto>[] = [
    {
      header: "Question",
      cell: (faq) => <span className="font-medium">{faq.question}</span>,
    },
    {
      header: "Group",
      className: "hidden md:table-cell",
      cell: (faq) => <Badge variant="secondary">{faq.group}</Badge>,
    },
    { header: "Order", className: "hidden sm:table-cell", cell: (faq) => faq.sortOrder },
    { header: "Status", cell: (faq) => <StatusBadge status={faq.status} /> },
  ];

  return (
    <>
      <ResourceTable
        columns={columns}
        rows={data?.items}
        isPending={isPending}
        error={error}
        emptyMessage="No FAQs yet."
        toolbar={
          <>
            <Input
              placeholder="Search questions…"
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
              className="max-w-xs"
            />
            <StatusFilter
              value={filters.status}
              onChange={(status) => setFilters({ status, page: 1 })}
            />
            <Can permission="faqs.create">
              <Button className="ml-auto" onClick={() => setEditing(null)}>
                <Plus className="size-4" /> New FAQ
              </Button>
            </Can>
          </>
        }
        rowActions={(faq) => (
          <>
            {can("faqs.update") ? (
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(faq)}>
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Can permission="faqs.delete">
              <ConfirmDialog
                title="Delete this FAQ?"
                description={faq.question}
                onConfirm={() => remove.mutateAsync(faq.id)}
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

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "New FAQ"}</DialogTitle>
          </DialogHeader>
          {editing !== undefined ? (
            <FaqForm
              faq={editing}
              groups={groups}
              onSaved={() => {
                setEditing(undefined);
                queryClient.invalidateQueries({ queryKey: faqKeys.all });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FaqForm({
  faq,
  groups,
  onSaved,
}: {
  faq: FaqDto | null;
  groups: string[];
  onSaved: () => void;
}) {
  const form = useForm<FaqFormValues, unknown, FaqCreateInput>({
    resolver: zodResolver(faqCreateSchema),
    defaultValues: {
      question: faq?.question ?? "",
      answerHtml: faq?.answerHtml ?? "",
      group: faq?.group ?? "general",
      sortOrder: faq?.sortOrder ?? 0,
      status: faq?.status ?? "DRAFT",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const save = useMutation({
    mutationFn: (values: FaqCreateInput) =>
      faq ? faqsApi.update(faq.id, values) : faqsApi.create(values),
    onSuccess: () => {
      toast.success(faq ? "FAQ updated." : "FAQ created.");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((values) => save.mutateAsync(values))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Input id="question" {...register("question")} placeholder="Does the treatment hurt?" />
          <FieldError message={errors.question?.message} />
        </div>

        <Controller
          control={control}
          name="answerHtml"
          render={({ field }) => (
            <div className="space-y-1">
              <RichTextEditor
                label="Answer"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Answer the way you would at the front desk…"
              />
              <FieldError message={errors.answerHtml?.message} />
            </div>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="group">Group</Label>
          <Input id="group" list="faq-groups" {...register("group")} placeholder="general" />
          <datalist id="faq-groups">
            {groups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
          <p className="text-muted-foreground text-xs">
            FAQs are shown together by group. Type a new name to start one.
          </p>
          <FieldError message={errors.group?.message} />
        </div>

        <PublishingCard
          resource="faqs"
          submitLabel={faq ? "Save changes" : "Create FAQ"}
          pending={save.isPending}
          currentStatus={faq?.status}
        />
      </form>
    </FormProvider>
  );
}

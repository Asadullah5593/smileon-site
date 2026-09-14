"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { taxonomyApi, taxonomyKeys } from "@/features/taxonomy/api";
import {
  TAXONOMY_KINDS,
  TAXONOMY_LABELS,
  type TaxonomyKind,
  type TaxonomyTermDto,
} from "@/features/taxonomy/schemas";
import { Can, usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Badge } from "@/shared/ui/primitives/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";
import { ResourceTable, type ResourceColumn } from "@/shared/ui/ResourceTable";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

type Draft = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

const emptyDraft: Draft = { id: null, name: "", slug: "", description: "", sortOrder: 0 };

export function TaxonomyManager() {
  return (
    <Tabs defaultValue="category">
      <TabsList>
        {TAXONOMY_KINDS.map((kind) => (
          <TabsTrigger key={kind} value={kind}>
            {TAXONOMY_LABELS[kind].plural}
          </TabsTrigger>
        ))}
      </TabsList>
      {TAXONOMY_KINDS.map((kind) => (
        <TabsContent key={kind} value={kind} className="pt-4">
          <TermList kind={kind} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function TermList({ kind }: { kind: TaxonomyKind }) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [draft, setDraft] = useState<Draft | null>(null);

  const labels = TAXONOMY_LABELS[kind];
  const hasDescription = kind !== "tag";

  const { data, isPending, error } = useQuery({
    queryKey: taxonomyKeys.list(kind),
    queryFn: () => taxonomyApi.list(kind),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });

  const save = useMutation({
    mutationFn: (value: Draft) =>
      value.id
        ? taxonomyApi.update(value.id, {
            kind,
            name: value.name,
            slug: value.slug || undefined,
            description: hasDescription ? value.description : undefined,
            sortOrder: value.sortOrder,
          })
        : taxonomyApi.create({
            kind,
            name: value.name,
            slug: value.slug || undefined,
            description: hasDescription ? value.description : undefined,
            sortOrder: value.sortOrder,
          }),
    onSuccess: () => {
      toast.success(`${labels.singular} saved.`);
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => taxonomyApi.remove(id, kind),
    onSuccess: () => {
      toast.success(`${labels.singular} deleted.`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ResourceColumn<TaxonomyTermDto>[] = [
    {
      header: "Name",
      cell: (term) => (
        <>
          <span className="font-medium">{term.name}</span>
          <span className="text-muted-foreground block text-xs">/{term.slug}</span>
        </>
      ),
    },
    ...(hasDescription
      ? [
          {
            header: "Description",
            className: "hidden md:table-cell",
            cell: (term: TaxonomyTermDto) => term.description ?? "—",
          },
        ]
      : []),
    {
      header: "In use",
      cell: (term) =>
        term.usageCount > 0 ? (
          <Badge variant="secondary">{term.usageCount}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {draft ? (
        <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Input
              autoFocus
              value={draft.name}
              placeholder={`${labels.singular} name`}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <Input
            value={draft.slug}
            placeholder="Slug (optional)"
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          {hasDescription ? (
            <>
              <Input
                value={draft.description}
                placeholder="Description (optional)"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <Input
                type="number"
                value={draft.sortOrder}
                placeholder="Sort order"
                onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
              />
            </>
          ) : null}
          <div className="flex gap-2 sm:col-span-2">
            <Button
              size="sm"
              onClick={() => save.mutate(draft)}
              disabled={save.isPending || draft.name.trim().length < 2}
            >
              <Check className="size-4" /> {save.isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDraft(null)}>
              <X className="size-4" /> Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <ResourceTable
        columns={columns}
        rows={data}
        isPending={isPending}
        error={error}
        emptyMessage={`No ${labels.plural.toLowerCase()} yet.`}
        toolbar={
          draft ? undefined : (
            <Can permission="taxonomy.create">
              <Button size="sm" onClick={() => setDraft(emptyDraft)}>
                <Plus className="size-4" /> New {labels.singular.toLowerCase()}
              </Button>
            </Can>
          )
        }
        rowActions={(term) => (
          <>
            {can("taxonomy.update") ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() =>
                  setDraft({
                    id: term.id,
                    name: term.name,
                    slug: term.slug,
                    description: term.description ?? "",
                    sortOrder: term.sortOrder,
                  })
                }
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Can permission="taxonomy.delete">
              <ConfirmDialog
                title={`Delete “${term.name}”?`}
                description={
                  term.usageCount > 0
                    ? `${term.usageCount} record(s) still use this — reassign them first.`
                    : "This cannot be undone."
                }
                onConfirm={() => remove.mutateAsync(term.id)}
              >
                <Button variant="ghost" size="icon" aria-label="Delete">
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </ConfirmDialog>
            </Can>
          </>
        )}
      />
    </div>
  );
}

"use client";

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  emptyBlock,
  type BlockType,
  type PageBlock,
} from "@/features/pages/blocks";
import { RichTextEditor } from "@/shared/editor/RichTextEditor";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

export type BannerOption = { id: string; heading: string };

const ANY = "any";

/**
 * Assembles a page from typed sections.
 *
 * Reorder is up/down buttons rather than drag-and-drop: it needs no dependency,
 * works from the keyboard, and a page has a handful of blocks, not fifty.
 */
export function BlockEditor({
  value,
  onChange,
  banners,
  faqGroups,
}: {
  value: PageBlock[];
  onChange: (next: PageBlock[]) => void;
  banners: BannerOption[];
  faqGroups: string[];
}) {
  function add(type: BlockType) {
    onChange([...value, emptyBlock(type, crypto.randomUUID())]);
  }

  function update(id: string, patch: Partial<PageBlock>) {
    onChange(
      value.map((block) => (block.id === id ? ({ ...block, ...patch } as PageBlock) : block)),
    );
  }

  function remove(id: string) {
    onChange(value.filter((block) => block.id !== id));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Sections</CardTitle>
          <p className="text-muted-foreground text-sm">
            Rendered down the page in this order, after the body text above.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" type="button">
              <Plus className="size-4" /> Add section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            {BLOCK_TYPES.map((entry) => (
              <DropdownMenuItem key={entry.type} onSelect={() => add(entry.type)}>
                <div>
                  <p className="font-medium">{entry.label}</p>
                  <p className="text-muted-foreground text-xs">{entry.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {value.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            No sections yet. Add one to pull in your team, testimonials, FAQs, before &amp; after
            cases, a banner or the appointment form.
          </p>
        ) : (
          value.map((block, index) => (
            <div key={block.id} className="rounded-lg border">
              <div className="bg-muted/40 flex items-center gap-2 border-b px-3 py-2">
                <GripVertical className="text-muted-foreground size-4" aria-hidden />
                <Badge variant="secondary">{BLOCK_LABELS[block.type]}</Badge>

                <div className="ml-auto flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Move down"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove section"
                    onClick={() => remove(block.id)}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <BlockSettings
                  block={block}
                  banners={banners}
                  faqGroups={faqGroups}
                  onChange={(patch) => update(block.id, patch)}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BlockSettings({
  block,
  banners,
  faqGroups,
  onChange,
}: {
  block: PageBlock;
  banners: BannerOption[];
  faqGroups: string[];
  onChange: (patch: Partial<PageBlock>) => void;
}) {
  // A heading is optional on every block that has one; blank means no heading.
  const headingField =
    "heading" in block ? (
      <div className="space-y-2">
        <Label htmlFor={`heading-${block.id}`}>Heading (optional)</Label>
        <Input
          id={`heading-${block.id}`}
          value={block.heading ?? ""}
          onChange={(e) => onChange({ heading: e.target.value } as Partial<PageBlock>)}
          placeholder="Meet the team"
        />
      </div>
    ) : null;

  switch (block.type) {
    case "richText":
      return (
        <RichTextEditor
          label="Text"
          value={block.html}
          onChange={(html) => onChange({ html } as Partial<PageBlock>)}
          placeholder="Write this section…"
        />
      );

    case "banner":
      return (
        <div className="space-y-2">
          <Label>Banner</Label>
          <Select
            value={block.bannerId ?? ANY}
            onValueChange={(value) =>
              onChange({ bannerId: value === ANY ? null : value } as Partial<PageBlock>)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="First active banner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>First active banner</SelectItem>
              {banners.map((banner) => (
                <SelectItem key={banner.id} value={banner.id}>
                  {banner.heading}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">Banners are managed under Site → Banners.</p>
        </div>
      );

    case "faqs":
      return (
        <>
          {headingField}
          <div className="space-y-2">
            <Label>Group</Label>
            <Select
              value={block.group || ANY}
              onValueChange={(value) =>
                onChange({ group: value === ANY ? null : value } as Partial<PageBlock>)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All groups</SelectItem>
                {faqGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case "appointmentForm":
      return headingField;

    // team · testimonials · gallery all take a heading and a count.
    default:
      return (
        <>
          {headingField}
          <div className="space-y-2">
            <Label htmlFor={`limit-${block.id}`}>How many to show</Label>
            <Input
              id={`limit-${block.id}`}
              type="number"
              min={1}
              value={block.limit}
              onChange={(e) => onChange({ limit: Number(e.target.value) } as Partial<PageBlock>)}
              className="w-32"
            />
          </div>
        </>
      );
  }
}

"use client";

import { Check } from "lucide-react";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";
import { cn } from "@/shared/utils/cn";

export type SelectOption = { id: string; name: string };

/**
 * Toggle-chip multi-select for short option lists — post categories and tags.
 * A dropdown would hide the options; a clinic has a handful of each, so showing
 * them all is faster and needs no extra popover state.
 */
export function MultiSelectField({
  label,
  options,
  value,
  onChange,
  emptyMessage = "None available yet.",
}: {
  label: string;
  options: SelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyMessage?: string;
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {options.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const selected = value.includes(option.id);
            return (
              <li key={option.id}>
                <button type="button" onClick={() => toggle(option.id)}>
                  <Badge
                    variant={selected ? "default" : "outline"}
                    className={cn("cursor-pointer gap-1", !selected && "hover:bg-accent")}
                    aria-pressed={selected}
                  >
                    {selected ? <Check className="size-3" aria-hidden /> : null}
                    {option.name}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Badge } from "@/shared/ui/primitives/badge";

/**
 * Editor for a list of short strings stored as a JSON column — qualifications,
 * specialties, and the like. A plain JSON textarea would be the quick option
 * and a reliable way for an editor to save invalid JSON.
 */
export function StringListField({
  label,
  value,
  onChange,
  placeholder,
  description,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  description?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const entry = draft.trim();
    if (!entry || value.includes(entry)) {
      setDraft("");
      return;
    }
    onChange([...value, entry]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((entry) => (
            <li key={entry}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {entry}
                <button
                  type="button"
                  aria-label={`Remove ${entry}`}
                  onClick={() => onChange(value.filter((item) => item !== entry))}
                  className="hover:text-destructive rounded-sm"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds an entry; it must not submit the surrounding form.
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
    </div>
  );
}

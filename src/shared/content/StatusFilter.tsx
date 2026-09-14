"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

const ALL = "all";

/**
 * The publish-status dropdown shared by every content list. `value` is the raw
 * URL value: an empty string means "no filter".
 */
export function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string | null) => void;
}) {
  return (
    <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All statuses</SelectItem>
        <SelectItem value="PUBLISHED">Published</SelectItem>
        <SelectItem value="DRAFT">Draft</SelectItem>
        <SelectItem value="ARCHIVED">Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}

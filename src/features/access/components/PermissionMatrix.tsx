"use client";

import { useMemo } from "react";
import {
  PERMISSION_GROUPS,
  PERMISSION_RESOURCES,
  type PermissionGroup,
} from "@/shared/auth/permission-registry";
import { Checkbox } from "@/shared/ui/primitives/checkbox";
import { Button } from "@/shared/ui/primitives/button";
import { cn } from "@/shared/utils/cn";

/**
 * Resource × action grid driven straight off the permission registry, so a new
 * permission in code shows up here with no UI changes.
 */
export function PermissionMatrix({
  selected,
  onChange,
  disabled = false,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const chosen = useMemo(() => new Set(selected), [selected]);

  function toggle(name: string, on: boolean) {
    const next = new Set(chosen);
    if (on) next.add(name);
    else next.delete(name);
    onChange([...next]);
  }

  function toggleRow(names: string[], on: boolean) {
    const next = new Set(chosen);
    for (const name of names) {
      if (on) next.add(name);
      else next.delete(name);
    }
    onChange([...next]);
  }

  const grouped = Object.keys(PERMISSION_GROUPS).map((group) => ({
    group: group as PermissionGroup,
    label: PERMISSION_GROUPS[group as PermissionGroup],
    resources: PERMISSION_RESOURCES.filter((r) => r.group === group),
  }));

  return (
    <div className="space-y-6">
      {grouped.map(({ group, label, resources }) => (
        <section key={group}>
          <h3 className="mb-2 text-sm font-semibold tracking-tight">{label}</h3>
          <div className="divide-y rounded-lg border">
            {resources.map((resource) => {
              const names = resource.actions.map((a) => `${resource.resource}.${a.action}`);
              const allOn = names.every((n) => chosen.has(n));

              return (
                <div
                  key={resource.resource}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3"
                >
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-medium">{resource.label}</p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      disabled={disabled}
                      className="h-auto p-0 text-xs"
                      onClick={() => toggleRow(names, !allOn)}
                    >
                      {allOn ? "Clear all" : "Select all"}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {resource.actions.map((action) => {
                      const name = `${resource.resource}.${action.action}`;
                      const id = `perm-${name}`;
                      return (
                        <label
                          key={name}
                          htmlFor={id}
                          title={action.description}
                          className={cn(
                            "flex items-center gap-2 text-sm capitalize",
                            disabled ? "opacity-60" : "cursor-pointer",
                          )}
                        >
                          <Checkbox
                            id={id}
                            disabled={disabled}
                            checked={chosen.has(name)}
                            onCheckedChange={(value) => toggle(name, value === true)}
                          />
                          {action.action}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

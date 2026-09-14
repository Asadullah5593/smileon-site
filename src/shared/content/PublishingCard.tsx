"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";

/**
 * The "Publishing" card shared by every publishable content form: status,
 * sort order, and the submit button.
 *
 * Reads the surrounding form through `useFormContext`, so the parent must wrap
 * its `<form>` in `<FormProvider>`.
 *
 * The status options are filtered by `<resource>.publish`. That is a courtesy,
 * not the gate — `assertCanSetStatus` in the repository is what actually
 * enforces it, and it runs whatever the browser sends.
 */
export function PublishingCard({
  resource,
  submitLabel,
  pending,
  currentStatus,
  showSortOrder = true,
  children,
}: {
  /** Permission resource, e.g. "services" — used for `<resource>.publish`. */
  resource: string;
  submitLabel: string;
  pending: boolean;
  /** The saved record's status; omit when creating. */
  currentStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** Pages and posts have no `sortOrder` column — they order by date. */
  showSortOrder?: boolean;
  /** Resource-specific extras, e.g. a "feature on the homepage" switch. */
  children?: ReactNode;
}) {
  const { control, register } = useFormContext();
  const { can } = usePermissions();

  const mayPublish = can(`${resource}.publish`);
  // Visibility is what `publish` governs: someone without it can still move a
  // record between the two non-public states.
  const isLive = currentStatus === "PUBLISHED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Publishing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT" disabled={isLive && !mayPublish}>
                    Draft
                  </SelectItem>
                  <SelectItem value="PUBLISHED" disabled={!isLive && !mayPublish}>
                    Published
                  </SelectItem>
                  <SelectItem value="ARCHIVED" disabled={isLive && !mayPublish}>
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
              {!mayPublish ? (
                <p className="text-muted-foreground text-xs">
                  You can edit this, but someone with publishing rights has to change whether it
                  appears on the website.
                </p>
              ) : null}
            </div>
          )}
        />

        {children}

        {showSortOrder ? (
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input id="sortOrder" type="number" {...register("sortOrder")} />
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

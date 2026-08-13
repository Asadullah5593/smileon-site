"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Switch } from "@/shared/ui/primitives/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { FieldError } from "@/shared/ui/FieldError";

/**
 * The "Search engine listing" card, shared by every publishable content form.
 *
 * Reads the surrounding form through `useFormContext`, so the parent must wrap
 * its `<form>` in `<FormProvider>`. The field names come from
 * `publishableSchema`, which every publishable resource spreads.
 */
export function SeoCard() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Search engine listing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" {...register("seoTitle")} />
          <FieldError message={errors.seoTitle?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">Meta description</Label>
          <Textarea id="seoDescription" rows={2} {...register("seoDescription")} />
          <FieldError message={errors.seoDescription?.message} />
        </div>

        <Controller
          control={control}
          name="noIndex"
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <Label htmlFor="noIndex">Hide from search engines</Label>
              <Switch
                id="noIndex"
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}

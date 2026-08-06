"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { mediaApi, mediaKeys } from "@/features/media/api";
import type { MediaDto } from "@/features/media/schemas";
import { MediaBrowser } from "@/features/media/components/MediaPickerField";
import { Can } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Card, CardContent } from "@/shared/ui/primitives/card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";

/** Browse + inspect: selecting a file opens its details panel. */
export function MediaLibrary() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MediaDto | null>(null);
  const [alt, setAlt] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: mediaKeys.all });

  const update = useMutation({
    mutationFn: (media: MediaDto) => mediaApi.update(media.id, { alt }),
    onSuccess: (media) => {
      toast.success("Saved.");
      setSelected(media);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => mediaApi.remove(id),
    onSuccess: () => {
      toast.success("File deleted.");
      setSelected(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <MediaBrowser
        onSelect={(media) => {
          setSelected(media);
          setAlt(media.alt ?? "");
        }}
      />

      {selected ? (
        <Card className="h-fit">
          <CardContent className="space-y-4 pt-6">
            {selected.mimeType.startsWith("image/") ? (
              <div className="bg-muted relative aspect-video overflow-hidden rounded-md">
                <Image
                  src={selected.url}
                  alt={selected.alt ?? ""}
                  fill
                  sizes="320px"
                  className="object-contain"
                />
              </div>
            ) : null}

            <div className="text-muted-foreground space-y-0.5 text-xs">
              <p className="text-foreground font-medium break-all">{selected.originalName}</p>
              <p>{selected.mimeType}</p>
              <p>
                {(selected.size / 1024).toFixed(0)} KB
                {selected.width ? ` · ${selected.width}×${selected.height}` : ""}
              </p>
            </div>

            <Can permission="media.update">
              <div className="space-y-2">
                <Label htmlFor="media-alt">Alt text</Label>
                <Input
                  id="media-alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe the image for screen readers"
                />
                <Button
                  size="sm"
                  onClick={() => update.mutate(selected)}
                  disabled={update.isPending}
                >
                  Save
                </Button>
              </div>
            </Can>

            <Can permission="media.delete">
              <ConfirmDialog
                title="Delete this file?"
                description="Content that used it will keep working with an empty image slot."
                onConfirm={() => remove.mutateAsync(selected.id)}
              >
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="size-4" /> Delete file
                </Button>
              </ConfirmDialog>
            </Can>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-sm">Select a file to see its details.</p>
      )}
    </div>
  );
}

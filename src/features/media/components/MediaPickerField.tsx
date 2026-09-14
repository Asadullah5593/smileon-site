"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { mediaApi, mediaKeys } from "@/features/media/api";
import type { MediaDto } from "@/features/media/schemas";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/primitives/select";
import { cn } from "@/shared/utils/cn";

const ALL_FOLDERS = "all";

type Props = {
  label: string;
  value: string | null;
  previewUrl?: string | null;
  onChange: (mediaId: string | null, media: MediaDto | null) => void;
  folder?: string;
};

/** Image field used by every content form: pick from the library or upload. */
export function MediaPickerField({ label, value, previewUrl, onChange, folder }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl ?? null);

  function select(media: MediaDto | null) {
    setPreview(media?.thumbnailUrl ?? media?.url ?? null);
    onChange(media?.id ?? null, media);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-md border">
          {preview ? (
            <Image src={preview} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <div className="text-muted-foreground grid h-full place-items-center">
              <ImagePlus className="size-6" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {value ? "Change image" : "Choose image"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Media library</DialogTitle>
              </DialogHeader>
              <MediaBrowser folder={folder} onSelect={select} />
            </DialogContent>
          </Dialog>

          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => select(null)}>
              <Trash2 className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Browse and pick from the media library.
 *
 * `folder` says where files uploaded *from here* are filed — it does not
 * limit what is listed. Filtering the list by it was a bug: an image uploaded
 * on the Media library page lands in `uploads`, so every picker (`services`,
 * `team`, …) hid it, and an image uploaded from one picker was invisible to
 * the others. The whole library is browsable; the folder dropdown narrows it
 * only when the user asks.
 */
export function MediaBrowser({
  folder,
  onSelect,
}: {
  folder?: string;
  onSelect: (media: MediaDto) => void;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [folderFilter, setFolderFilter] = useState(ALL_FOLDERS);

  const params = {
    page: 1,
    pageSize: 24,
    q: q || undefined,
    folder: folderFilter === ALL_FOLDERS ? undefined : folderFilter,
  };
  const { data, isPending } = useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => mediaApi.list(params),
  });

  const { data: folders } = useQuery({
    queryKey: mediaKeys.folders,
    queryFn: mediaApi.folders,
  });

  const upload = useMutation({
    mutationFn: (file: File) => mediaApi.upload(file, folder),
    onSuccess: (media) => {
      toast.success("Uploaded.");
      // `mediaKeys.all` is a prefix of `mediaKeys.folders`, so this refreshes
      // the folder list too — a brand-new folder shows up immediately.
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      onSelect(media);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search files…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FOLDERS}>All folders</SelectItem>
            {folders?.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          disabled={upload.isPending}
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="size-4" /> {upload.isPending ? "Uploading…" : "Upload"}
        </Button>
      </div>

      <div className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-6">
        {isPending ? (
          <p className="text-muted-foreground col-span-full py-8 text-center text-sm">Loading…</p>
        ) : data?.items.length === 0 ? (
          <p className="text-muted-foreground col-span-full py-8 text-center text-sm">
            {q || folderFilter !== ALL_FOLDERS
              ? "Nothing matches that search."
              : "Nothing here yet — upload your first file."}
          </p>
        ) : (
          data?.items.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={() => onSelect(media)}
              title={media.originalName}
              className={cn(
                "bg-muted relative aspect-square overflow-hidden rounded-md border",
                "hover:ring-primary focus-visible:ring-primary hover:ring-2 focus-visible:ring-2 focus-visible:outline-none",
              )}
            >
              {media.mimeType.startsWith("image/") ? (
                <Image
                  src={media.thumbnailUrl ?? media.url}
                  alt={media.alt ?? media.originalName}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : (
                <span className="text-muted-foreground grid h-full place-items-center p-1 text-[10px] break-all">
                  {media.originalName}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

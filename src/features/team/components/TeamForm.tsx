"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  teamCreateSchema,
  type TeamCreateInput,
  type TeamFormValues,
  type TeamMemberDto,
} from "@/features/team/schemas";
import { teamApi, teamKeys } from "@/features/team/api";
import { MediaPickerField } from "@/features/media/components/MediaPickerField";
import { PublishingCard } from "@/shared/content/PublishingCard";
import { RichTextEditor } from "@/shared/editor/RichTextEditor";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { FieldError } from "@/shared/ui/FieldError";
import { StringListField } from "@/shared/ui/StringListField";

const SOCIALS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
] as const;

export function TeamForm({ member }: { member?: TeamMemberDto }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<TeamFormValues, unknown, TeamCreateInput>({
    resolver: zodResolver(teamCreateSchema),
    defaultValues: {
      name: member?.name ?? "",
      slug: member?.slug ?? "",
      designation: member?.designation ?? "",
      bioHtml: member?.bioHtml ?? "",
      photoId: member?.photoId ?? null,
      qualifications: member?.qualifications ?? [],
      specialties: member?.specialties ?? [],
      socials: member?.socials ?? { facebook: "", instagram: "", linkedin: "", x: "" },
      sortOrder: member?.sortOrder ?? 0,
      status: member?.status ?? "DRAFT",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const save = useMutation({
    mutationFn: (values: TeamCreateInput) =>
      member ? teamApi.update(member.id, values) : teamApi.create(values),
    onSuccess: (saved) => {
      toast.success(member ? "Team member updated." : "Team member added.");
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      router.push(`/admin/team/${saved.id}`);
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit((values) => save.mutateAsync(values))}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register("name")} placeholder="Dr. Ayesha Khan" />
                  <FieldError message={errors.name?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...register("designation")}
                    placeholder="Consultant Orthodontist"
                  />
                  <FieldError message={errors.designation?.message} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <Input id="slug" {...register("slug")} placeholder="dr-ayesha-khan" />
                <p className="text-muted-foreground text-xs">
                  Leave blank to generate one from the name.
                </p>
                <FieldError message={errors.slug?.message} />
              </div>

              <Controller
                control={control}
                name="bioHtml"
                render={({ field }) => (
                  <RichTextEditor
                    label="Biography"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Training, experience, and what patients can expect…"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Controller
                control={control}
                name="qualifications"
                render={({ field }) => (
                  <StringListField
                    label="Qualifications"
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="BDS, University of Lahore"
                    description="Shown in order on the profile."
                  />
                )}
              />
              <Controller
                control={control}
                name="specialties"
                render={({ field }) => (
                  <StringListField
                    label="Specialties"
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Implants"
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {SOCIALS.map((social) => (
                <div key={social.key} className="space-y-2">
                  <Label htmlFor={`socials.${social.key}`}>{social.label}</Label>
                  <Input
                    id={`socials.${social.key}`}
                    {...register(`socials.${social.key}` as const)}
                    placeholder="https://…"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PublishingCard
            resource="team"
            submitLabel={member ? "Save changes" : "Add team member"}
            pending={save.isPending}
            currentStatus={member?.status}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="photoId"
                render={({ field }) => (
                  <MediaPickerField
                    label="Profile photo"
                    folder="team"
                    value={field.value ?? null}
                    previewUrl={member?.photoUrl}
                    onChange={(id) => field.onChange(id)}
                  />
                )}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}

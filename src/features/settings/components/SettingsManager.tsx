"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsApi } from "@/features/settings/api";
import {
  SETTING_KEYS,
  SETTING_LABELS,
  type SettingKey,
  type SettingValues,
} from "@/features/settings/schemas";
import { usePermissions } from "@/shared/auth/permissions-context";
import { Button } from "@/shared/ui/primitives/button";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Switch } from "@/shared/ui/primitives/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/primitives/tabs";

/** Field descriptors per group — label, and which control to render. */
type FieldSpec = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "switch";
  hint?: string;
};

const FIELDS: Record<SettingKey, FieldSpec[]> = {
  brand: [
    { name: "name", label: "Clinic name" },
    { name: "tagline", label: "Tagline" },
  ],
  contact: [
    { name: "phone", label: "Phone" },
    { name: "emergencyPhone", label: "Emergency phone" },
    { name: "whatsapp", label: "WhatsApp" },
    { name: "email", label: "Public email" },
    {
      name: "notificationInbox",
      label: "Notification inbox",
      hint: "Where appointment requests and contact messages are emailed.",
    },
  ],
  social: [
    { name: "facebook", label: "Facebook" },
    { name: "instagram", label: "Instagram" },
    { name: "youtube", label: "YouTube" },
    { name: "tiktok", label: "TikTok" },
  ],
  seo: [
    { name: "titleTemplate", label: "Title template", hint: "%s is replaced by the page title." },
    { name: "defaultDescription", label: "Default meta description", type: "textarea" },
    { name: "searchConsoleToken", label: "Search Console token" },
    {
      name: "noIndexSite",
      label: "Hide the entire site from search engines",
      type: "switch",
      hint: "Use while the site is being built. Remember to turn it off before launch.",
    },
  ],
  analytics: [
    { name: "ga4Id", label: "GA4 measurement id", hint: "G-XXXXXXX" },
    { name: "gtmId", label: "Google Tag Manager id", hint: "GTM-XXXXXX" },
    { name: "metaPixelId", label: "Meta pixel id", hint: "Digits only." },
  ],
};

export function SettingsManager({ settings }: { settings: SettingValues }) {
  return (
    <Tabs defaultValue="brand">
      <TabsList>
        {SETTING_KEYS.map((key) => (
          <TabsTrigger key={key} value={key}>
            {SETTING_LABELS[key].title}
          </TabsTrigger>
        ))}
      </TabsList>
      {SETTING_KEYS.map((key) => (
        <TabsContent key={key} value={key} className="pt-4">
          <SettingGroup settingKey={key} initial={settings[key]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function SettingGroup<K extends SettingKey>({
  settingKey,
  initial,
}: {
  settingKey: K;
  initial: SettingValues[K];
}) {
  const { can } = usePermissions();
  const [values, setValues] = useState<Record<string, unknown>>(
    initial as unknown as Record<string, unknown>,
  );

  const mayEdit = can("settings.manage");
  const labels = SETTING_LABELS[settingKey];

  const save = useMutation({
    mutationFn: () => settingsApi.update(settingKey, values as SettingValues[K]),
    onSuccess: (saved) => {
      // Take the server's parsed value back, so defaults and trimming show.
      setValues(saved as unknown as Record<string, unknown>);
      toast.success(`${labels.title} settings saved.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{labels.title}</CardTitle>
        <p className="text-muted-foreground text-sm">{labels.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {FIELDS[settingKey].map((field) => {
          const id = `${settingKey}-${field.name}`;
          const value = values[field.name];

          if (field.type === "switch") {
            return (
              <div key={field.name} className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor={id}>{field.label}</Label>
                  {field.hint ? (
                    <p className="text-muted-foreground text-xs">{field.hint}</p>
                  ) : null}
                </div>
                <Switch
                  id={id}
                  checked={Boolean(value)}
                  disabled={!mayEdit}
                  onCheckedChange={(next) => setValues({ ...values, [field.name]: next })}
                />
              </div>
            );
          }

          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={id}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={id}
                  rows={2}
                  value={String(value ?? "")}
                  disabled={!mayEdit}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              ) : (
                <Input
                  id={id}
                  value={String(value ?? "")}
                  disabled={!mayEdit}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              )}
              {field.hint ? <p className="text-muted-foreground text-xs">{field.hint}</p> : null}
            </div>
          );
        })}

        {mayEdit ? (
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">
            You can view these settings but not change them.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

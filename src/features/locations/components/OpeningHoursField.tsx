"use client";

import { DEFAULT_OPENING_HOURS, WEEKDAYS, type OpeningHours } from "@/features/locations/schemas";
import { Input } from "@/shared/ui/primitives/input";
import { Label } from "@/shared/ui/primitives/label";
import { Switch } from "@/shared/ui/primitives/switch";

/**
 * A row per weekday rather than a raw JSON textarea — the column is JSON, but
 * asking a receptionist to hand-write it is asking for a parse error on the
 * contact page.
 */
export function OpeningHoursField({
  value,
  onChange,
}: {
  value: OpeningHours | null;
  onChange: (next: OpeningHours) => void;
}) {
  const hours = value ?? DEFAULT_OPENING_HOURS;

  function setDay(day: (typeof WEEKDAYS)[number], patch: Partial<OpeningHours[typeof day]>) {
    onChange({ ...hours, [day]: { ...hours[day], ...patch } });
  }

  return (
    <div className="space-y-2">
      <Label>Opening hours</Label>
      <ul className="divide-y rounded-lg border">
        {WEEKDAYS.map((day) => {
          const entry = hours[day];
          return (
            <li key={day} className="flex flex-wrap items-center gap-3 p-3">
              <span className="w-24 text-sm font-medium capitalize">{day}</span>

              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={!entry.closed}
                  onCheckedChange={(open) => setDay(day, { closed: !open })}
                  aria-label={`${day} open`}
                />
                <span className="text-muted-foreground">{entry.closed ? "Closed" : "Open"}</span>
              </label>

              {entry.closed ? null : (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    aria-label={`${day} opening time`}
                    value={entry.open ?? ""}
                    onChange={(e) => setDay(day, { open: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    aria-label={`${day} closing time`}
                    value={entry.close ?? ""}
                    onChange={(e) => setDay(day, { close: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

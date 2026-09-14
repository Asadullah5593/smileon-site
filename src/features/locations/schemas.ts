import { z } from "zod";

/**
 * Opening hours are stored as a JSON column. One entry per weekday, each
 * either closed or an open/close pair in 24-hour `HH:MM`.
 */
export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time, e.g. 09:30.");

/**
 * `closed` is required rather than defaulted: a default would make it optional
 * on the schema's *input* type and required on its output, so the form values
 * and the editor component would disagree. The editor always writes all seven
 * days explicitly, so nothing needs the default.
 */
export const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: timeSchema.nullish(),
  close: timeSchema.nullish(),
});

export const openingHoursSchema = z.object(
  Object.fromEntries(WEEKDAYS.map((day) => [day, dayHoursSchema])) as Record<
    Weekday,
    typeof dayHoursSchema
  >,
);

export type DayHours = z.output<typeof dayHoursSchema>;
export type OpeningHours = Record<Weekday, DayHours>;

export const DEFAULT_OPENING_HOURS: OpeningHours = Object.fromEntries(
  WEEKDAYS.map((day) => [day, { closed: day === "sunday", open: "11:00", close: "21:00" }]),
) as OpeningHours;

export const locationCreateSchema = z.object({
  name: z.string().trim().min(2, "Give the location a name.").max(160),
  address: z.string().trim().min(5, "An address helps patients find you.").max(500),
  city: z.string().trim().max(120).nullish(),
  phone: z.string().trim().max(30).nullish(),
  whatsapp: z.string().trim().max(30).nullish(),
  email: z.union([z.email(), z.literal("")]).nullish(),
  mapEmbedUrl: z.string().trim().max(1000).nullish(),
  latitude: z.coerce.number().min(-90).max(90).nullish(),
  longitude: z.coerce.number().min(-180).max(180).nullish(),
  openingHours: openingHoursSchema.nullish(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const locationUpdateSchema = locationCreateSchema.partial();

export type LocationCreateInput = z.output<typeof locationCreateSchema>;
export type LocationUpdateInput = z.output<typeof locationUpdateSchema>;
export type LocationFormValues = z.input<typeof locationCreateSchema>;

export type LocationDto = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  mapEmbedUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: OpeningHours | null;
  isPrimary: boolean;
  sortOrder: number;
};

/**
 * Read the JSON column leniently: older rows may hold a different shape, and a
 * malformed value should not take the contact page down.
 */
export function parseOpeningHours(value: unknown): OpeningHours | null {
  const result = openingHoursSchema.safeParse(value);
  return result.success ? result.data : null;
}

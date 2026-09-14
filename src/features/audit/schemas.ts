import { z } from "zod";
import { listQuerySchema } from "@/shared/api/list-query";

export const auditListQuerySchema = listQuerySchema.extend({
  actorId: z.string().optional(),
  entity: z.string().max(60).optional(),
  action: z.string().max(60).optional(),
  /** Inclusive `createdAt` bounds, as `YYYY-MM-DD`. */
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;

export type AuditEntryDto = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string | null;
  /** Shallow before/after map, or `{ created: … }` — see `diffOf`. */
  diff: unknown;
  createdAt: string;
};

/** Distinct values in the log, so the filters offer only what exists. */
export type AuditFacets = {
  actions: string[];
  entities: string[];
  actors: { id: string; name: string }[];
};

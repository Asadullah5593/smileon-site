import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { sanitizeHtml } from "@/shared/editor/sanitize";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { assertCanSetStatus } from "@/shared/auth/publish-guard";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type { Viewer } from "@/shared/auth/permissions";
import type { FaqCreateInput, FaqDto, FaqListQuery, FaqUpdateInput } from "@/features/faqs/schemas";
import type { FaqItem, Prisma } from "@/generated/prisma/client";

/** All `FaqItem` data access. Nothing outside this file touches `prisma.faqItem`. */

function toFaqDto(faq: FaqItem): FaqDto {
  return {
    id: faq.id,
    question: faq.question,
    answerHtml: faq.answerHtml,
    group: faq.group,
    sortOrder: faq.sortOrder,
    status: faq.status,
    updatedAt: faq.updatedAt.toISOString(),
  };
}

const SORTABLE = ["sortOrder", "createdAt", "updatedAt", "status"] as const;

export async function listFaqs(query: FaqListQuery) {
  const where: Prisma.FaqItemWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.group ? { group: query.group } : {}),
    ...(query.q ? { question: { contains: query.q } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.faqItem.findMany({
      where,
      orderBy: query.sort
        ? toOrderBy(query, SORTABLE, { sortOrder: "asc" })
        : [{ group: "asc" }, { sortOrder: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.faqItem.count({ where }),
  ]);

  return paginate(rows.map(toFaqDto), total, query.page, query.pageSize);
}

export async function getFaqById(id: string): Promise<FaqDto> {
  const faq = await prisma.faqItem.findUnique({ where: { id } });
  if (!faq) throw new NotFoundError("FAQ");
  return toFaqDto(faq);
}

/** The distinct groups actually in use, for the filter and the form's datalist. */
export async function listFaqGroups(): Promise<string[]> {
  const rows = await prisma.faqItem.findMany({
    distinct: ["group"],
    select: { group: true },
    orderBy: { group: "asc" },
  });
  return rows.map((row) => row.group);
}

export async function createFaq(input: FaqCreateInput, viewer: Viewer): Promise<FaqDto> {
  assertCanSetStatus(viewer, "faqs", input.status);

  const faq = await prisma.faqItem.create({
    // Required scalars restated so Prisma sees them as definitely present —
    // `toWriteData` is shaped for the partial update input.
    data: {
      ...toWriteData(input),
      question: input.question,
      answerHtml: sanitizeHtml(input.answerHtml),
    },
  });

  await recordAudit({
    actorId: viewer.id,
    action: "faqs.create",
    entity: "FaqItem",
    entityId: faq.id,
    summary: faq.question,
  });
  revalidateContent(CACHE_TAGS.faqs);

  return toFaqDto(faq);
}

export async function updateFaq(
  id: string,
  input: FaqUpdateInput,
  viewer: Viewer,
): Promise<FaqDto> {
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("FAQ");

  assertCanSetStatus(viewer, "faqs", input.status, existing.status);

  const faq = await prisma.faqItem.update({ where: { id }, data: toWriteData(input) });

  await recordAudit({
    actorId: viewer.id,
    action: "faqs.update",
    entity: "FaqItem",
    entityId: id,
    summary: faq.question,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      faq as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.faqs);

  return toFaqDto(faq);
}

export async function deleteFaq(id: string, viewer: Viewer) {
  const faq = await prisma.faqItem.delete({ where: { id } }).catch(() => null);
  if (!faq) throw new NotFoundError("FAQ");

  await recordAudit({
    actorId: viewer.id,
    action: "faqs.delete",
    entity: "FaqItem",
    entityId: id,
    summary: faq.question,
  });
  revalidateContent(CACHE_TAGS.faqs);
}

function toWriteData(input: FaqUpdateInput) {
  return {
    question: input.question,
    // Answers are authored in Tiptap; sanitise on write so rendering stays safe.
    answerHtml: input.answerHtml === undefined ? undefined : sanitizeHtml(input.answerHtml),
    group: input.group,
    sortOrder: input.sortOrder,
    status: input.status,
  };
}

import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { mediaUrl } from "@/shared/storage";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { assertCanSetStatus } from "@/shared/auth/publish-guard";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type { Viewer } from "@/shared/auth/permissions";
import type {
  TestimonialCreateInput,
  TestimonialDto,
  TestimonialListQuery,
  TestimonialUpdateInput,
} from "@/features/testimonials/schemas";
import type { Prisma } from "@/generated/prisma/client";

/** All `Testimonial` data access. Publishing is the moderation step. */

const withRelations = {
  photo: { select: { key: true } },
  service: { select: { title: true } },
} satisfies Prisma.TestimonialInclude;

type TestimonialRow = Prisma.TestimonialGetPayload<{ include: typeof withRelations }>;

function toTestimonialDto(testimonial: TestimonialRow): TestimonialDto {
  return {
    id: testimonial.id,
    patientName: testimonial.patientName,
    quote: testimonial.quote,
    rating: testimonial.rating,
    photoId: testimonial.photoId,
    photoUrl: mediaUrl(testimonial.photo?.key),
    serviceId: testimonial.serviceId,
    serviceTitle: testimonial.service?.title ?? null,
    sortOrder: testimonial.sortOrder,
    status: testimonial.status,
    updatedAt: testimonial.updatedAt.toISOString(),
  };
}

const SORTABLE = ["sortOrder", "rating", "createdAt", "updatedAt", "status"] as const;

export async function listTestimonials(query: TestimonialListQuery) {
  const where: Prisma.TestimonialWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.serviceId ? { serviceId: query.serviceId } : {}),
    ...(query.q
      ? { OR: [{ patientName: { contains: query.q } }, { quote: { contains: query.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      include: withRelations,
      orderBy: toOrderBy(query, SORTABLE, { sortOrder: "asc" }),
      ...toSkipTake(query),
    }),
    prisma.testimonial.count({ where }),
  ]);

  return paginate(rows.map(toTestimonialDto), total, query.page, query.pageSize);
}

export async function getTestimonialById(id: string): Promise<TestimonialDto> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!testimonial) throw new NotFoundError("Testimonial");
  return toTestimonialDto(testimonial);
}

export async function createTestimonial(
  input: TestimonialCreateInput,
  viewer: Viewer,
): Promise<TestimonialDto> {
  assertCanSetStatus(viewer, "testimonials", input.status);

  const testimonial = await prisma.testimonial.create({
    data: { ...toWriteData(input), patientName: input.patientName, quote: input.quote },
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "testimonials.create",
    entity: "Testimonial",
    entityId: testimonial.id,
    summary: testimonial.patientName,
  });
  revalidateContent(CACHE_TAGS.testimonials);

  return toTestimonialDto(testimonial);
}

export async function updateTestimonial(
  id: string,
  input: TestimonialUpdateInput,
  viewer: Viewer,
): Promise<TestimonialDto> {
  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Testimonial");

  assertCanSetStatus(viewer, "testimonials", input.status, existing.status);

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: toWriteData(input),
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "testimonials.update",
    entity: "Testimonial",
    entityId: id,
    summary: testimonial.patientName,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      testimonial as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.testimonials);

  return toTestimonialDto(testimonial);
}

export async function deleteTestimonial(id: string, viewer: Viewer) {
  const testimonial = await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  if (!testimonial) throw new NotFoundError("Testimonial");

  await recordAudit({
    actorId: viewer.id,
    action: "testimonials.delete",
    entity: "Testimonial",
    entityId: id,
    summary: testimonial.patientName,
  });
  revalidateContent(CACHE_TAGS.testimonials);
}

function toWriteData(input: TestimonialUpdateInput) {
  return {
    patientName: input.patientName,
    quote: input.quote,
    rating: input.rating,
    photoId: input.photoId ?? undefined,
    serviceId: input.serviceId ?? undefined,
    sortOrder: input.sortOrder,
    status: input.status,
  };
}

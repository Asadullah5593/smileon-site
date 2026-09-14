import "server-only";
import { prisma } from "@/shared/db/prisma";
import { paginate } from "@/shared/api/response";
import { toOrderBy, toSkipTake } from "@/shared/api/list-query";
import { NotFoundError } from "@/shared/api/errors";
import { mediaUrl } from "@/shared/storage";
import { uniqueSlug } from "@/shared/utils/slug";
import { sanitizeHtml } from "@/shared/editor/sanitize";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { assertCanSetStatus } from "@/shared/auth/publish-guard";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import type { Viewer } from "@/shared/auth/permissions";
import type {
  Socials,
  TeamCreateInput,
  TeamListQuery,
  TeamMemberDto,
  TeamUpdateInput,
} from "@/features/team/schemas";
import type { Prisma } from "@/generated/prisma/client";

/** All `TeamMember` data access. */

const withRelations = { photo: { select: { key: true } } } satisfies Prisma.TeamMemberInclude;

type TeamRow = Prisma.TeamMemberGetPayload<{ include: typeof withRelations }>;

/** JSON columns are `unknown` at the type level — narrow them at the boundary. */
function toStringList(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toSocials(value: Prisma.JsonValue | null): Socials | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Socials) : null;
}

function toTeamMemberDto(member: TeamRow): TeamMemberDto {
  return {
    id: member.id,
    slug: member.slug,
    name: member.name,
    designation: member.designation,
    bioHtml: member.bioHtml,
    photoId: member.photoId,
    photoUrl: mediaUrl(member.photo?.key),
    qualifications: toStringList(member.qualifications),
    specialties: toStringList(member.specialties),
    socials: toSocials(member.socials),
    sortOrder: member.sortOrder,
    status: member.status,
    updatedAt: member.updatedAt.toISOString(),
  };
}

const SORTABLE = ["name", "sortOrder", "createdAt", "updatedAt", "status"] as const;

export async function listTeamMembers(query: TeamListQuery) {
  const where: Prisma.TeamMemberWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? { OR: [{ name: { contains: query.q } }, { designation: { contains: query.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.teamMember.findMany({
      where,
      include: withRelations,
      orderBy: toOrderBy(query, SORTABLE, { sortOrder: "asc" }),
      ...toSkipTake(query),
    }),
    prisma.teamMember.count({ where }),
  ]);

  return paginate(rows.map(toTeamMemberDto), total, query.page, query.pageSize);
}

export async function getTeamMemberById(id: string): Promise<TeamMemberDto> {
  const member = await prisma.teamMember.findUnique({ where: { id }, include: withRelations });
  if (!member) throw new NotFoundError("Team member");
  return toTeamMemberDto(member);
}

export async function createTeamMember(
  input: TeamCreateInput,
  viewer: Viewer,
): Promise<TeamMemberDto> {
  assertCanSetStatus(viewer, "team", input.status);

  const slug = await uniqueSlug(input.slug || input.name, slugTaken);

  const member = await prisma.teamMember.create({
    data: { ...toWriteData(input), name: input.name, slug },
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "team.create",
    entity: "TeamMember",
    entityId: member.id,
    summary: member.name,
  });
  revalidateContent(CACHE_TAGS.team);

  return toTeamMemberDto(member);
}

export async function updateTeamMember(
  id: string,
  input: TeamUpdateInput,
  viewer: Viewer,
): Promise<TeamMemberDto> {
  const existing = await prisma.teamMember.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Team member");

  assertCanSetStatus(viewer, "team", input.status, existing.status);

  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, (candidate) => slugTaken(candidate, id))
      : undefined;

  const member = await prisma.teamMember.update({
    where: { id },
    data: { ...toWriteData(input), ...(slug ? { slug } : {}) },
    include: withRelations,
  });

  await recordAudit({
    actorId: viewer.id,
    action: "team.update",
    entity: "TeamMember",
    entityId: id,
    summary: member.name,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      member as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.team);

  return toTeamMemberDto(member);
}

export async function deleteTeamMember(id: string, viewer: Viewer) {
  const member = await prisma.teamMember.delete({ where: { id } }).catch(() => null);
  if (!member) throw new NotFoundError("Team member");

  await recordAudit({
    actorId: viewer.id,
    action: "team.delete",
    entity: "TeamMember",
    entityId: id,
    summary: member.name,
  });
  revalidateContent(CACHE_TAGS.team);
}

function toWriteData(input: TeamUpdateInput) {
  return {
    name: input.name,
    designation: input.designation ?? undefined,
    bioHtml: input.bioHtml === undefined ? undefined : sanitizeHtml(input.bioHtml ?? ""),
    photoId: input.photoId ?? undefined,
    qualifications: input.qualifications ?? undefined,
    specialties: input.specialties ?? undefined,
    socials: input.socials ?? undefined,
    sortOrder: input.sortOrder,
    status: input.status,
  };
}

async function slugTaken(slug: string, exceptId?: string) {
  const found = await prisma.teamMember.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(found && found.id !== exceptId);
}

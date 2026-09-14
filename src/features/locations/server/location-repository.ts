import "server-only";
import { prisma } from "@/shared/db/prisma";
import { NotFoundError } from "@/shared/api/errors";
import { diffOf, recordAudit } from "@/shared/audit/audit-log";
import { CACHE_TAGS, revalidateContent } from "@/shared/content/cache-tags";
import {
  parseOpeningHours,
  type LocationCreateInput,
  type LocationDto,
  type LocationUpdateInput,
} from "@/features/locations/schemas";
import type { Viewer } from "@/shared/auth/permissions";
import type { Location, Prisma } from "@/generated/prisma/client";

/** All `Location` data access. Locations are not publishable — plain CRUD. */

function toLocationDto(location: Location): LocationDto {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    phone: location.phone,
    whatsapp: location.whatsapp,
    email: location.email,
    mapEmbedUrl: location.mapEmbedUrl,
    // Prisma Decimal → number, so the DTO stays JSON-serialisable.
    latitude: location.latitude === null ? null : Number(location.latitude),
    longitude: location.longitude === null ? null : Number(location.longitude),
    openingHours: parseOpeningHours(location.openingHours),
    isPrimary: location.isPrimary,
    sortOrder: location.sortOrder,
  };
}

export async function listLocations(): Promise<LocationDto[]> {
  const rows = await prisma.location.findMany({
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toLocationDto);
}

export async function getLocationById(id: string): Promise<LocationDto> {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new NotFoundError("Location");
  return toLocationDto(location);
}

export async function createLocation(
  input: LocationCreateInput,
  viewer: Viewer,
): Promise<LocationDto> {
  const location = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) await clearPrimary(tx);
    return tx.location.create({
      data: { ...toWriteData(input), name: input.name, address: input.address },
    });
  });

  await recordAudit({
    actorId: viewer.id,
    action: "locations.create",
    entity: "Location",
    entityId: location.id,
    summary: location.name,
  });
  revalidateContent(CACHE_TAGS.locations);

  return toLocationDto(location);
}

export async function updateLocation(
  id: string,
  input: LocationUpdateInput,
  viewer: Viewer,
): Promise<LocationDto> {
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Location");

  const location = await prisma.$transaction(async (tx) => {
    // Exactly one primary: promoting this one demotes the rest.
    if (input.isPrimary) await clearPrimary(tx, id);
    return tx.location.update({ where: { id }, data: toWriteData(input) });
  });

  await recordAudit({
    actorId: viewer.id,
    action: "locations.update",
    entity: "Location",
    entityId: id,
    summary: location.name,
    diff: diffOf(
      existing as unknown as Record<string, unknown>,
      location as unknown as Record<string, unknown>,
    ),
  });
  revalidateContent(CACHE_TAGS.locations);

  return toLocationDto(location);
}

export async function deleteLocation(id: string, viewer: Viewer) {
  const location = await prisma.location.delete({ where: { id } }).catch(() => null);
  if (!location) throw new NotFoundError("Location");

  // Never leave the site with no primary location — the header phone number,
  // the footer and the contact page all read it.
  if (location.isPrimary) {
    const next = await prisma.location.findFirst({ orderBy: [{ sortOrder: "asc" }] });
    if (next) await prisma.location.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  await recordAudit({
    actorId: viewer.id,
    action: "locations.delete",
    entity: "Location",
    entityId: id,
    summary: location.name,
  });
  revalidateContent(CACHE_TAGS.locations);
}

function clearPrimary(tx: Prisma.TransactionClient, exceptId?: string) {
  return tx.location.updateMany({
    where: { isPrimary: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isPrimary: false },
  });
}

const blank = (value: string | null | undefined) =>
  value === undefined ? undefined : value === null || value === "" ? null : value;

function toWriteData(input: LocationUpdateInput) {
  return {
    name: input.name,
    address: input.address,
    city: blank(input.city),
    phone: blank(input.phone),
    whatsapp: blank(input.whatsapp),
    email: blank(input.email),
    mapEmbedUrl: blank(input.mapEmbedUrl),
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
    openingHours: input.openingHours ?? undefined,
    isPrimary: input.isPrimary,
    sortOrder: input.sortOrder,
  };
}

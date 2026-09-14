"use client";

import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

/**
 * The page / search / status filter trio every content list uses, synced to the
 * URL so a filtered view can be bookmarked and shared.
 *
 * `params` is the shape the list endpoints expect: empty strings become
 * `undefined` so they drop out of the querystring.
 */
export function useResourceFilters(pageSize = 20) {
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    q: parseAsString.withDefault(""),
    status: parseAsString.withDefault(""),
  });

  const params = {
    page: filters.page,
    pageSize,
    q: filters.q || undefined,
    status: filters.status || undefined,
  };

  return { filters, setFilters, params };
}

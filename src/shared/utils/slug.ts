import slugifyLib from "slugify";

export function slugify(input: string) {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

/**
 * Slugify a nested path, one segment at a time.
 *
 * `slugify` runs with `strict: true`, which strips `/` — so passing
 * "about-us/our-values" through it would silently produce
 * "about-usour-values". CMS pages may be nested, so they need this instead.
 */
export function slugifyPath(input: string) {
  return input.split("/").map(slugify).filter(Boolean).join("/");
}

/**
 * Turn `title` into a slug that isn't taken yet, appending `-2`, `-3`, … as
 * needed. `exists` is injected so this stays a pure, testable function;
 * `normalize` lets callers opt into path slugs.
 */
export async function uniqueSlug(
  input: string,
  exists: (candidate: string) => Promise<boolean>,
  normalize: (value: string) => string = slugify,
): Promise<string> {
  const base = normalize(input) || "item";
  let candidate = base;
  let suffix = 1;

  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

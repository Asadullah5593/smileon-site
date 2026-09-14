import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { ValidationError } from "@/shared/api/errors";
import { toErrorResponse } from "@/shared/api/error-response";
import { requireAnyPermission, requirePermission, type Viewer } from "@/shared/auth/permissions";
import { log } from "@/shared/observability/logger";
import type { PermissionName } from "@/shared/auth/permission-registry";

type Schemas<TBody, TQuery, TParams> = {
  body?: z.ZodType<TBody>;
  query?: z.ZodType<TQuery>;
  params?: z.ZodType<TParams>;
};

type HandlerContext<TBody, TQuery, TParams> = {
  req: NextRequest;
  body: TBody;
  query: TQuery;
  params: TParams;
  /** Present whenever the route declared a permission; `null` on public routes. */
  viewer: Viewer;
};

type Options<TBody, TQuery, TParams> = Schemas<TBody, TQuery, TParams> & {
  /** Requires every listed permission. */
  permission?: PermissionName | PermissionName[];
  /** Requires at least one of the listed permissions. */
  anyPermission?: PermissionName[];
};

type RouteArgs = { params: Promise<Record<string, string | string[]>> };

/**
 * Wraps a route handler with the concerns every endpoint shares: permission
 * enforcement, zod parsing of body/query/params, and error → HTTP mapping.
 *
 *   export const PATCH = createRouteHandler(
 *     { permission: "services.update", body: serviceUpdateSchema },
 *     async ({ body, params, viewer }) => ok(await updateService(params.id, body, viewer)),
 *   );
 */
export function createRouteHandler<TBody = undefined, TQuery = undefined, TParams = undefined>(
  options: Options<TBody, TQuery, TParams>,
  handler: (ctx: HandlerContext<TBody, TQuery, TParams>) => Promise<Response>,
) {
  return async (req: NextRequest, args?: RouteArgs): Promise<Response> => {
    // Correlates the access log line, the error log line and the `X-Request-Id`
    // the caller sees, so a user-reported failure is one grep away.
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    const startedAt = Date.now();

    try {
      let viewer = null as Viewer | null;
      if (options.permission) {
        const required = Array.isArray(options.permission)
          ? options.permission
          : [options.permission];
        viewer = await requirePermission(...required);
      } else if (options.anyPermission) {
        viewer = await requireAnyPermission(...options.anyPermission);
      }

      const rawParams = (await args?.params) ?? {};
      const params = options.params
        ? parse(options.params, rawParams, "params")
        : (rawParams as TParams);

      const query = options.query
        ? parse(options.query, Object.fromEntries(req.nextUrl.searchParams), "query")
        : (undefined as TQuery);

      const body = options.body
        ? parse(options.body, await readJson(req), "body")
        : (undefined as TBody);

      const response = await handler({ req, body, query, params, viewer: viewer as Viewer });
      response.headers.set("X-Request-Id", requestId);

      log.info("request", {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
        actorId: viewer?.id,
      });

      return response;
    } catch (error) {
      const response = toErrorResponse(error, requestId);
      response.headers.set("X-Request-Id", requestId);

      log.warn("request failed", {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: Date.now() - startedAt,
        // 5xx bodies are deliberately vague; the detail belongs here instead.
        ...(response.status >= 500 ? { error } : {}),
      });

      return response;
    }
  };
}

function parse<T>(schema: z.ZodType<T>, value: unknown, source: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      { source, issues: z.flattenError(result.error) },
      `Invalid request ${source}.`,
    );
  }
  return result.data;
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError({ source: "body" }, "Request body must be valid JSON.");
  }
}

export { toErrorResponse };

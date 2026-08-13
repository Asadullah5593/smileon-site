import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ConflictError, HttpError, NotFoundError, ValidationError } from "@/shared/api/errors";
import type { ApiFailure } from "@/shared/api/response";

/**
 * Error → HTTP mapping, kept in its own module (free of auth/db imports) so it
 * stays cheap to unit-test and safe to reuse from any handler.
 */
/**
 * `requestId` is echoed in the body for 5xx so a user can quote it and the
 * matching log line can be found — the message itself stays deliberately vague.
 */
export function toErrorResponse(error: unknown, requestId?: string): NextResponse<ApiFailure> {
  const mapped = normalizeError(error);

  return NextResponse.json<ApiFailure>(
    {
      error: {
        message: mapped.message,
        code: mapped.code,
        ...(mapped.details === undefined ? {} : { details: mapped.details }),
        ...(mapped.status >= 500 && requestId ? { requestId } : {}),
      },
    },
    { status: mapped.status },
  );
}

function normalizeError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  if (error instanceof z.ZodError) {
    return new ValidationError(z.flattenError(error));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ");
      return new ConflictError(
        target ? `That ${target} is already in use.` : "That value is already in use.",
      );
    }
    if (error.code === "P2025") return new NotFoundError();
    if (error.code === "P2003") {
      return new ConflictError("That record is still referenced by other content.");
    }
  }

  // Never leak an internal message (it may contain a connection string).
  return new HttpError(500, "Something went wrong. Please try again.", "internal_error");
}

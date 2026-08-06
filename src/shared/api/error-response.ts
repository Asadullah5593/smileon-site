import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ConflictError, HttpError, NotFoundError, ValidationError } from "@/shared/api/errors";
import type { ApiFailure } from "@/shared/api/response";

/**
 * Error → HTTP mapping, kept in its own module (free of auth/db imports) so it
 * stays cheap to unit-test and safe to reuse from any handler.
 */
export function toErrorResponse(error: unknown): NextResponse<ApiFailure> {
  const mapped = normalizeError(error);

  // 5xx means we got it wrong, not the caller — make sure it reaches the logs.
  if (mapped.status >= 500) console.error("[api] unhandled error", error);

  return NextResponse.json<ApiFailure>(
    {
      error: {
        message: mapped.message,
        code: mapped.code,
        ...(mapped.details === undefined ? {} : { details: mapped.details }),
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

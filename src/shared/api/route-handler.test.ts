import { describe, expect, it } from "vitest";
import { toErrorResponse } from "@/shared/api/error-response";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/api/errors";

async function body(response: Response) {
  return (await response.json()) as { error: { message: string; code: string; details?: unknown } };
}

describe("toErrorResponse", () => {
  it("maps UnauthorizedError to 401", async () => {
    const response = toErrorResponse(new UnauthorizedError());
    expect(response.status).toBe(401);
    expect((await body(response)).error.code).toBe("unauthorized");
  });

  it("maps ForbiddenError to 403 and reports the required permissions", async () => {
    const response = toErrorResponse(new ForbiddenError(undefined, ["services.update"]));
    expect(response.status).toBe(403);
    expect((await body(response)).error.details).toEqual({
      requiredPermissions: ["services.update"],
    });
  });

  it("maps NotFoundError to 404", () => {
    expect(toErrorResponse(new NotFoundError("Service")).status).toBe(404);
  });

  it("maps ConflictError to 409", () => {
    expect(toErrorResponse(new ConflictError()).status).toBe(409);
  });

  it("maps ValidationError to 422", () => {
    expect(toErrorResponse(new ValidationError({ field: "title" })).status).toBe(422);
  });

  it("hides unexpected errors behind a generic 500", async () => {
    const response = toErrorResponse(new Error("connection string: user:password@host"));
    expect(response.status).toBe(500);
    const payload = await body(response);
    expect(payload.error.code).toBe("internal_error");
    expect(payload.error.message).not.toContain("password");
  });
});

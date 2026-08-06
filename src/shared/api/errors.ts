/** Errors the route-handler wrapper knows how to turn into HTTP responses. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "You must be signed in.") {
    super(401, message, "unauthorized");
  }
}

export class ForbiddenError extends HttpError {
  constructor(
    message = "You do not have permission to do that.",
    readonly requiredPermissions: string[] = [],
  ) {
    super(403, message, "forbidden", { requiredPermissions });
  }
}

export class NotFoundError extends HttpError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found.`, "not_found");
  }
}

export class ConflictError extends HttpError {
  constructor(message = "That value is already taken.") {
    super(409, message, "conflict");
  }
}

export class ValidationError extends HttpError {
  constructor(details: unknown, message = "The submitted data is invalid.") {
    super(422, message, "validation_failed", details);
  }
}

export class RateLimitError extends HttpError {
  constructor(message = "Too many requests. Please try again shortly.") {
    super(429, message, "rate_limited");
  }
}

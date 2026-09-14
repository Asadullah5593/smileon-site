/**
 * Structured JSON logging.
 *
 * One line per event, machine-parseable, so `docker logs` can be shipped
 * straight into anything that reads JSON. Deliberately dependency-free: a
 * logging library would be the app's only reason to add one.
 *
 * Never log a value that could carry a password, token or patient detail —
 * pass ids and let the reader look them up.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const threshold =
  LEVELS[
    (process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === "production" ? "info" : "debug")
  ] ?? LEVELS.info;

export type LogFields = Record<string, unknown> & { requestId?: string };

function emit(level: Level, message: string, fields: LogFields = {}) {
  if (LEVELS[level] < threshold) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...fields,
    ...(fields.error instanceof Error
      ? {
          error: {
            name: fields.error.name,
            message: fields.error.message,
            stack: fields.error.stack,
          },
        }
      : {}),
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};

/**
 * Seam for an error tracker (Sentry and friends). Nothing is wired up — this
 * exists so adding one later is a single edit rather than a sweep through every
 * catch block.
 */
export function captureException(error: unknown, context?: LogFields) {
  log.error("unhandled exception", { ...context, error });
}

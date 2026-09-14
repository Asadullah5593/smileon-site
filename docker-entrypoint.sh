#!/bin/sh
# Container entrypoint: bring the schema up to date, then serve.
#
# `set -e` matters here — if migrations fail we must NOT start the app. A
# container serving against a half-migrated database produces confusing errors
# at the first query instead of a loud, obvious failure at startup.
set -e

echo "{\"level\":\"info\",\"message\":\"applying migrations\"}"
npx prisma migrate deploy

# Opt-in: seeds the permission registry, system roles and the first admin.
# Safe to run repeatedly (it is idempotent), but off by default so a redeploy
# never silently recreates content someone deleted on purpose.
if [ "${RUN_SEED}" = "1" ]; then
  echo "{\"level\":\"info\",\"message\":\"running seed\"}"
  npx tsx prisma/seed.ts
fi

echo "{\"level\":\"info\",\"message\":\"starting server\"}"
# `exec` replaces the shell so node becomes PID 1 and receives SIGTERM directly
# — without it, docker stop would wait out the full timeout and then kill.
exec "$@"

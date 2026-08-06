import "@testing-library/jest-dom/vitest";

// Environment the server modules validate at import time.
process.env.DATABASE_URL ??= "mysql://root:test@localhost:3306/smileon_test";
process.env.AUTH_SECRET ??= "test-secret-value-at-least-16-chars";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";

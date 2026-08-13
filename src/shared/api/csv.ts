/**
 * Minimal RFC 4180 CSV writer for admin exports.
 *
 * Two things it deliberately handles:
 *
 * 1. **Formula injection.** Export rows contain values typed by the public
 *    (patient names, free-text messages). A cell starting with `=`, `+`, `-`,
 *    `@` or a control character is executed as a formula when the file is
 *    opened in Excel or Sheets, which is a route to data exfiltration from the
 *    person who opened it. Such values get a leading apostrophe so the
 *    spreadsheet treats them as text.
 * 2. **A UTF-8 BOM**, without which Excel mangles non-ASCII names.
 */

const NEEDS_QUOTING = /[",\r\n]/;
const RISKY_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (RISKY_PREFIX.test(text)) text = `'${text}`;
  if (NEEDS_QUOTING.test(text)) text = `"${text.replace(/"/g, '""')}"`;

  return text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ];
  // CRLF is what RFC 4180 specifies and what Excel expects.
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** A CSV download response with the filename the browser should save as. */
export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}

import { describe, expect, it } from "vitest";
import { toCsv } from "@/shared/api/csv";

const body = (csv: string) => csv.replace("﻿", "").trimEnd().split("\r\n");

describe("toCsv", () => {
  it("writes a header row and CRLF line endings", () => {
    const csv = toCsv(["Name", "Phone"], [["Ayesha", "0300"]]);
    expect(body(csv)).toEqual(["Name,Phone", "Ayesha,0300"]);
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("starts with a BOM so Excel reads UTF-8", () => {
    expect(toCsv(["Name"], [["Ayşe"]]).startsWith("﻿")).toBe(true);
  });

  it("quotes values containing commas, quotes or newlines", () => {
    expect(body(toCsv(["A"], [["one,two"]]))[1]).toBe('"one,two"');
    expect(body(toCsv(["A"], [['say "hi"']]))[1]).toBe('"say ""hi"""');
    expect(toCsv(["A"], [["line1\nline2"]])).toContain('"line1\nline2"');
  });

  it("renders null and undefined as empty cells", () => {
    expect(body(toCsv(["A", "B"], [[null, undefined]]))[1]).toBe(",");
  });

  // Export rows contain public form input; a spreadsheet would execute these.
  it("neutralises formula injection", () => {
    for (const risky of ["=1+1", "+1", "-1", "@SUM(A1)", '=HYPERLINK("http://x")']) {
      const cell = body(toCsv(["A"], [[risky]]))[1];
      expect(cell.replace(/^"|"$/g, "").startsWith("'")).toBe(true);
    }
  });

  it("still quotes a risky value that also needs quoting", () => {
    expect(body(toCsv(["A"], [["=cmd,x"]]))[1]).toBe(`"'=cmd,x"`);
  });

  it("leaves ordinary text untouched", () => {
    expect(body(toCsv(["A"], [["Dr. Ayesha Khan"]]))[1]).toBe("Dr. Ayesha Khan");
  });
});

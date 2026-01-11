import { describe, expect, it } from "vitest";
import { createDefaultDocument } from "../src/document";
import { validateDocument } from "../src/validate";

describe("validateDocument", () => {
  it("returns no issues for default document", () => {
    const doc = createDefaultDocument();
    const issues = validateDocument(doc);
    expect(issues.length).toBe(0);
  });

  it("detects missing root", () => {
    const doc = createDefaultDocument();
    doc.root = "missing";
    const issues = validateDocument(doc);
    expect(issues[0]?.level).toBe("error");
  });
});

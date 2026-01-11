import { describe, expect, it } from "vitest";
import { createDefaultDocument } from "../src/document";
import { exportToHtml } from "../src/exporter";

describe("exportToHtml", () => {
  it("exports HTML and CSS", () => {
    const doc = createDefaultDocument();
    const result = exportToHtml(doc);

    expect(result.html).toContain("<!doctype html>");
    expect(result.html).toContain("styles.css");
    expect(result.html).toContain("data-block-id=\"page-root\"");
    expect(result.css).toContain("body");
    expect(result.css).toContain("@media (max-width: 1199px)");
  });
});

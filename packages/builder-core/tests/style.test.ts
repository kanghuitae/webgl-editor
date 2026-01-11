import { describe, expect, it } from "vitest";
import { resolveStyle } from "../src/style";

const style = {
  base: { color: "#111", fontSize: "16px" },
  overrides: { mobile: { fontSize: "14px" } }
};

describe("resolveStyle", () => {
  it("returns base style when no override", () => {
    const resolved = resolveStyle(style, "desktop");
    expect(resolved).toEqual({ color: "#111", fontSize: "16px" });
  });

  it("merges breakpoint override", () => {
    const resolved = resolveStyle(style, "mobile");
    expect(resolved).toEqual({ color: "#111", fontSize: "14px" });
  });
});

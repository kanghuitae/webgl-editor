import { describe, expect, it } from "vitest";
import { instantiateSectionTemplate, sectionTemplates } from "../src/templates";

describe("sectionTemplates", () => {
  it("instantiates sections with remapped ids", () => {
    const template = sectionTemplates[0];
    const inst = instantiateSectionTemplate(template);

    expect(inst.blocks[inst.rootId]).toBeDefined();
    expect(Object.keys(inst.blocks).length).toBe(Object.keys(template.blocks).length);
    expect(inst.rootId).not.toBe(template.root);
  });
});

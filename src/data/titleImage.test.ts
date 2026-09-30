import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { titleImage } from "./titleImage.ts";
import { plateImages } from "./plateImages.ts";

describe("title image", () => {
  it("says it is AI-generated, in its visible label and its alt text", () => {
    assert.match(titleImage.label, /AI-generated/);
    assert.match(titleImage.label, /not a photograph/);
    assert.match(titleImage.alt, /^AI-generated/);
  });

  it("is not one of the post's plates", () => {
    assert.ok(!Object.values(plateImages).some((p) => p.src === titleImage.src));
  });

  it("exists", () => {
    assert.ok(existsSync(new URL(`../../public${titleImage.src}`, import.meta.url)));
  });
});

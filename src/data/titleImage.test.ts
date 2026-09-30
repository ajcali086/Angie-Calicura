import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plateById } from "./article.ts";
import { plateImages } from "./plateImages.ts";
import { titleImage } from "./titleImage.ts";

describe("title image", () => {
  it("is one of the post's plates, with an image", () => {
    assert.ok(plateById(titleImage.plate), titleImage.plate);
    assert.ok(plateImages[titleImage.plate], `${titleImage.plate} has no image`);
  });

  it("is the photo the post captions as a 1940s photo of Angie", () => {
    assert.match(plateById(titleImage.plate)!.caption, /1940s photo of Angie/);
  });
});

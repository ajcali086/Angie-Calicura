import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildDate, resolveSha } from "../../../scripts/build-info.mjs";

const footer = readFileSync(new URL("./SiteFooter.tsx", import.meta.url), "utf8");
/** Every page's own source, for the wording rules. */
const site = [
  footer,
  ...["index.tsx", "sources.tsx", "left-open.tsx", "archive.index.tsx"].map((f) =>
    readFileSync(new URL(`../../routes/${f}`, import.meta.url), "utf8"),
  ),
].join("\n");

describe("the credit line and the build line", () => {
  it("credit the system as presenting the museum, never authoring it", () => {
    assert.match(footer, /presented as a <span[^>]*>Museumwright<\/span>(\{" "\})?\s*museum/);
    assert.match(footer, /The text and captions are the author’s\./);
    assert.doesNotMatch(site, /powered by/i);
    assert.doesNotMatch(site, /Both Stand museum/i);
  });

  it("name the commit: Vercel's, else git's, else 'local', never nothing", () => {
    const git = () => "0123456789abcdef";
    assert.equal(resolveSha({ VERCEL_GIT_COMMIT_SHA: "8f3a2c1d4e5f" }, git), "8f3a2c1");
    assert.equal(resolveSha({}, git), "0123456");
    assert.equal(
      resolveSha({ VERCEL_GIT_COMMIT_SHA: " " }, () => ""),
      "local",
    );
    assert.equal(buildDate(new Date("2026-10-01T23:30:00Z")), "2026-10-01");
  });

  it("show the build in the footer, a size below the status line", () => {
    assert.match(footer, /build \{buildInfo\.sha\} · \{buildInfo\.date\}/);
    assert.match(footer, /text-\[0\.7rem\][^"]*">Design pilot · preview only/);
    assert.match(footer, /data-build className="[^"]*text-\[0\.62rem\]/);
  });
});

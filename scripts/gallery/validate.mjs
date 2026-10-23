import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { variants, validateData } from "./model.mjs";
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
assert.ok(variants.includes(config.variant));
assert.equal(config.portfolioUrl, "https://okorion.github.io/");
assert.equal(config.maxVisitors, 9);
assert.equal(config.contributionWeeks, 26);
validateData(JSON.parse(await readFile("assets/gallery/data.json", "utf8")));
for (const variant of variants)
  for (const theme of ["light", "dark"])
    for (const mobile of [false, true]) {
      const p = `assets/gallery/${variant}${mobile ? "-mobile" : ""}-${theme}.png`,
        b = await readFile(p);
      assert.equal(b.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", p);
      assert.equal(b.readUInt32BE(16), mobile ? 900 : 1600, p);
      assert.equal(b.readUInt32BE(20), mobile ? 900 : 700, p);
      assert.ok(b.length > 10000 && b.length < 3000000, p);
    }
const source = JSON.parse(await readFile("assets/gallery/source.json", "utf8"));
assert.equal(source.url, config.portfolioUrl);
const capture = await readFile("assets/gallery/portfolio.png");
assert.equal(createHash("sha256").update(capture).digest("hex"), source.sha256);
const darkCapture = await readFile("assets/gallery/portfolio-dark.png");
assert.equal(
  createHash("sha256").update(darkCapture).digest("hex"),
  source.darkSha256,
);
const readme = await readFile("README.md", "utf8");
for (const suffix of ["light", "dark", "mobile-light", "mobile-dark"])
  assert.ok(
    readme.includes(`./assets/gallery/${config.variant}-${suffix}.png`),
  );
assert.ok(readme.includes("issues/new?template=gallery.yml"));
assert.ok(readme.length < 1700);
console.log(
  "Gallery data, source capture, 12 rendered assets and README verified",
);

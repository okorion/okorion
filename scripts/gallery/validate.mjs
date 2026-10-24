import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { variants, stylesFor, assetName, imageSize, validateData } from "./model.mjs";
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
assert.ok(variants.includes(config.variant));
assert.ok(stylesFor(config.variant).includes(config.style));
assert.equal(typeof config.showSectionLabels, "boolean");
assert.equal(config.portfolioUrl, "https://okorion.github.io/");
assert.equal(config.maxVisitors, 9);
assert.equal(config.contributionWeeks, 26);
validateData(JSON.parse(await readFile("assets/gallery/data.json", "utf8")));
for (const variant of variants)
  for (const style of stylesFor(variant))
    for (const theme of ["light", "dark"])
      for (const mobile of [false, true]) {
        const p = `assets/gallery/${assetName(variant, style)}${mobile ? "-mobile" : ""}-${theme}.png`,
          b = await readFile(p);
        assert.equal(b.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", p);
        const size = imageSize(variant, mobile);
        assert.equal(b.readUInt32BE(16), size.width, p);
        assert.equal(b.readUInt32BE(20), size.height, p);
        assert.ok(b.length > 10000 && b.length < 3000000, p);
      }
const source = JSON.parse(await readFile("assets/gallery/source.json", "utf8"));
const font = await readFile("assets/fonts/PretendardVariable.woff2");
assert.equal(font.subarray(0, 4).toString(), "wOF2");
assert.equal(
  createHash("sha256").update(font).digest("hex"),
  "9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4",
);
assert.equal(source.url, config.portfolioUrl);
const capture = await readFile("assets/gallery/portfolio.png");
assert.equal(createHash("sha256").update(capture).digest("hex"), source.sha256);
const darkCapture = await readFile("assets/gallery/portfolio-dark.png");
assert.equal(
  createHash("sha256").update(darkCapture).digest("hex"),
  source.darkSha256,
);
const readme = await readFile("README.md", "utf8");
const portrait = config.orientation === "portrait" && config.variant === "wall";
const suffixes = portrait
  ? ["mobile-light", "mobile-dark"]
  : ["light", "dark", "mobile-light", "mobile-dark"];
for (const suffix of suffixes)
  assert.ok(
    readme.includes(
      `./assets/gallery/${assetName(config.variant, config.style)}-${suffix}.png`,
    ),
  );
if (portrait) {
  const v = assetName(config.variant, config.style);
  assert.ok(readme.includes(`src="./assets/gallery/${v}-mobile-light.png"`));
  assert.ok(
    readme.includes(`media="(prefers-color-scheme: dark)" srcset="./assets/gallery/${v}-mobile-dark.png"`),
  );
}
assert.ok(readme.includes("issues/new?template=gallery.yml"));
assert.ok(readme.length < 1700);
assert.equal(source.typography?.family, "Pretendard Variable");
assert.equal(source.typography.sampleSelector, ".hero__summary");
assert.ok(
  source.typography.sampleFonts.length > 0 &&
    source.typography.sampleFonts.every(
      (font) => font.isCustomFont && font.familyName.includes("Pretendard"),
    ),
);
console.log(
  `Gallery data, source typography, ${variants.reduce((n, v) => n + stylesFor(v).length, 0) * 4} rendered assets and README verified`,
);

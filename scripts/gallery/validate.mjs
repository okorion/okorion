import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { variants, stylesFor, assetName, imageSize, validateData } from "./model.mjs";
import { objects, archiveParts, archiveImageSize } from "./catalog.mjs";
import { readArchiveImage, readLicensedObjectFile } from "./licensed-files.mjs";
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
assert.ok(variants.includes(config.variant));
assert.ok(stylesFor(config.variant).includes(config.style));
assert.equal(typeof config.showSectionLabels, "boolean");
assert.equal(config.portfolioUrl, "https://okorion.github.io/");
assert.equal(config.anonymousGuestbookUrl, "https://okorion-guestbook.ok-or-orion.workers.dev/");
assert.equal(config.maxVisitors, 6);
assert.equal(config.retentionDays, 3);
assert.equal(config.orientation, "portrait");
validateData(JSON.parse(await readFile("assets/gallery/data.json", "utf8")));
for (const variant of variants.filter((variant) => variant !== "archive"))
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
if (config.variant === "archive") {
  for (const part of archiveParts) for (const theme of ["light", "dark"]) for (const mobile of [false, true]) {
    const filename = `archive-${part}${mobile ? "-mobile" : ""}-${theme}.png`;
    const bytes = await readArchiveImage(`assets/gallery/${filename}`);
    const size = archiveImageSize(part, mobile);
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", filename);
    assert.equal(bytes.readUInt32BE(16), size.width, filename);
    assert.equal(bytes.readUInt32BE(20), size.height, filename);
    assert.ok(bytes.length > 10000 && bytes.length < 3000000, filename);
    assert.ok(readme.includes(`./assets/gallery/${filename}`));
  }
  assert.equal((readme.match(/<picture>/g) || []).length, 2);
  assert.ok(readme.includes("### 소품으로 인사 남기기"));
  assert.ok(readme.includes("소품 9종(📷 🎮 🦆 📻 ⏱️ ♟️ 🐘 🐴 🐚) 중 하나로 인사를 남겨 주세요. 최근 인사 6개를 표시하며, 하나의 인사는 3일 동안 표시합니다."));
  assert.ok(readme.includes("### 프로젝트"));
  assert.ok(readme.includes(config.anonymousGuestbookUrl));
  assert.ok(!readme.includes("포트폴리오"));
  assert.ok(readme.includes("[익명으로 소품 고르기 ↗](https://okorion-guestbook.ok-or-orion.workers.dev/) · [GitHub 방식으로 남기기 ↗](https://github.com/okorion/okorion/issues/new?template=gallery.yml) · [소품 출처·사용 안내](./docs/gallery.md)"));
  assert.ok(!readme.includes("인사 작성 시각 확인"));
  assert.ok(!readme.includes("README 갱신:"));
  assert.ok(!readme.includes("이름·계정 없이 소품 고르기"));
  assert.ok(!readme.includes("GitHub 활동"));
  const mobileCapture = await readFile("assets/gallery/portfolio-mobile.png");
  assert.equal(createHash("sha256").update(mobileCapture).digest("hex"), source.mobileSha256);
  const mobileDarkCapture = await readFile("assets/gallery/portfolio-mobile-dark.png");
  assert.equal(createHash("sha256").update(mobileDarkCapture).digest("hex"), source.mobileDarkSha256);
  await assert.rejects(readLicensedObjectFile("../package.json"), /Unapproved model file/);
  await assert.rejects(readArchiveImage("assets/gallery/../package.json"), /Unknown archive image/);
  const sources = JSON.parse(await readFile("assets/gallery/objects/sources.json", "utf8"));
  assert.deepEqual(sources.map((asset) => asset.id), objects.map((asset) => asset.id));
  for (const asset of sources) {
    assert.equal(asset.license, "CC0-1.0");
    assert.equal(asset.source, `https://polyhaven.com/a/${asset.id}`);
    const model = await readLicensedObjectFile(`assets/gallery/objects/${asset.id}/${asset.id}.gltf`);
    assert.equal(createHash("sha256").update(model).digest("hex"), asset.sha256, asset.id);
    const gltf = JSON.parse(model);
    for (const dependency of asset.dependencies) {
      assert.ok(/^[A-Za-z0-9_./-]+$/.test(dependency.path) && !dependency.path.includes(".."));
      const bytes = await readLicensedObjectFile(`assets/gallery/objects/${asset.id}/${dependency.path}`);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), dependency.sha256, dependency.path);
    }
    for (const reference of [...(gltf.buffers || []), ...(gltf.images || [])]) {
      assert.ok(asset.dependencies.some((dependency) => dependency.path === reference.uri));
    }
  }
} else {
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
}
assert.ok(readme.includes("issues/new?template=gallery.yml"));
assert.ok(readme.length < 4000);
assert.ok(Number.isFinite(Date.parse(source.renderedAt)));
assert.equal(source.typography?.family, "Pretendard Variable");
assert.equal(source.typography.sampleSelector, ".project-row h3 a");
assert.deepEqual(source.presentation?.hiddenSelectors, [".hero__summary", ".project-row__description", ".project-media figcaption"]);
assert.ok(
  source.typography.sampleFonts.length > 0 &&
    source.typography.sampleFonts.every(
      (font) => font.isCustomFont && font.familyName.includes("Pretendard"),
    ),
);
console.log(
  "Gallery data, source typography, licensed model hashes, rendered images and README verified",
);

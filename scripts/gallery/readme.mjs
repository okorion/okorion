import { readFile, writeFile } from "node:fs/promises";
import { variants, styles, assetName } from "./model.mjs";
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
const selection = process.argv[2];
if (selection && !variants.includes(selection))
  throw new Error("Choose wall (C), gallery (A), island (B), or pavilion (D)");
const style = process.argv[3];
if (style && !styles.includes(style))
  throw new Error("Choose simple or advanced");
config.variant = selection || config.variant;
config.style =
  config.variant === "pavilion"
    ? "advanced"
    : style || config.style || "simple";
if (selection || style) {
  await writeFile(
    "config/gallery.json",
    JSON.stringify(config, null, 2) + "\n",
  );
}
if (!variants.includes(config.variant))
  throw new Error("Invalid gallery variant");
if (!styles.includes(config.style)) throw new Error("Invalid gallery style");
const v = assetName(config.variant, config.style);
const defaultImage =
  config.orientation === "portrait" && config.variant === "wall"
    ? `${v}-mobile`
    : v;
await writeFile(
  "README.md",
  `<a href="https://okorion.github.io/">
  <picture>
    <source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="./assets/gallery/${v}-mobile-dark.png" />
    <source media="(max-width: 600px)" srcset="./assets/gallery/${v}-mobile-light.png" />
    <source media="(prefers-color-scheme: dark)" srcset="./assets/gallery/${defaultImage}-dark.png" />
    <img alt="실제 포트폴리오 화면, GitHub 활동 지형, 방문자가 남긴 오브젝트로 구성한 전시관" src="./assets/gallery/${defaultImage}-light.png" width="100%" />
  </picture>
</a>

[포트폴리오 둘러보기 ↗](https://okorion.github.io/) · [오브젝트 남기기 +](https://github.com/okorion/okorion/issues/new?template=gallery.yml) · [README Gallery ↗](https://github.com/okorion/readme-gallery)
`,
);
console.log(`README uses ${v}`);

import { readFile, writeFile } from "node:fs/promises";
import { variants } from "./model.mjs";
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
const selection = process.argv[2];
if (selection && !variants.includes(selection))
  throw new Error("Choose wall (C), gallery (A), or island (B)");
if (selection) {
  config.variant = selection;
  await writeFile(
    "config/gallery.json",
    JSON.stringify(config, null, 2) + "\n",
  );
}
if (!variants.includes(config.variant))
  throw new Error("Invalid gallery variant");
const v = config.variant;
await writeFile(
  "README.md",
  `<a href="https://okorion.github.io/">
  <picture>
    <source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="./assets/gallery/${v}-mobile-dark.png" />
    <source media="(max-width: 600px)" srcset="./assets/gallery/${v}-mobile-light.png" />
    <source media="(prefers-color-scheme: dark)" srcset="./assets/gallery/${v}-dark.png" />
    <img alt="실제 포트폴리오 화면, GitHub 활동 지형, 방문자가 남긴 오브젝트로 구성한 전시관" src="./assets/gallery/${v}-light.png" width="100%" />
  </picture>
</a>

[포트폴리오 둘러보기 ↗](https://okorion.github.io/) · [오브젝트 남기기 +](https://github.com/okorion/okorion/issues/new?template=gallery.yml)
`,
);
console.log(`README uses ${v}`);

import { readFile, writeFile } from "node:fs/promises";
import { variants, styles, assetName } from "./model.mjs";
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
const selection = process.argv[2];
if (selection && !variants.includes(selection))
  throw new Error("Choose an existing gallery layout");
const style = process.argv[3];
if (style && !styles.includes(style))
  throw new Error("Choose simple or advanced");
config.variant = selection || config.variant;
config.style =
  ["pavilion", "archive"].includes(config.variant)
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
if (config.variant === "archive") {
  const guestbookUrl = config.anonymousGuestbookUrl || "https://github.com/okorion/okorion/issues/new?template=gallery.yml";
  if (!["https://okorion-guestbook.ok-or-orion.workers.dev/", "https://github.com/okorion/okorion/issues/new?template=gallery.yml"].includes(guestbookUrl)) throw new Error("Unapproved guestbook link");
  const picture = (part, alt) => `<picture>
    <source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="./assets/gallery/archive-${part}-mobile-dark.png" />
    <source media="(max-width: 600px)" srcset="./assets/gallery/archive-${part}-mobile-light.png" />
    <source media="(prefers-color-scheme: dark)" srcset="./assets/gallery/archive-${part}-dark.png" />
    <img alt="${alt}" src="./assets/gallery/archive-${part}-light.png" width="100%" />
  </picture>`;
  await writeFile("README.md", `### 프로젝트

<a href="https://okorion.github.io/">
  ${picture("portfolio", "프로젝트 화면과 썸네일")}
</a>

[프로젝트 둘러보기 ↗](https://okorion.github.io/)

### 소품으로 인사 남기기

<a href="${guestbookUrl}">
  ${picture("guestbook", "최근 3일의 인사만 소품으로 표시하는 유리 진열장 6칸")}
</a>

소품 9종 중 하나로 인사를 남겨 주세요. 최근 인사 6개를 작성 후 3일 동안 표시하며, 인사가 없는 진열장은 비워 둡니다.

[${config.anonymousGuestbookUrl ? "익명으로 소품 고르기" : "소품 고르고 인사 남기기"} ↗](${guestbookUrl})${config.anonymousGuestbookUrl ? " · [GitHub 방식으로 남기기 ↗](https://github.com/okorion/okorion/issues/new?template=gallery.yml)" : ""} · [소품 출처·사용 안내](./docs/gallery.md)
`);
  console.log("README uses split archive portfolio and guestbook");
  process.exit(0);
}
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
    <img alt="프로젝트 화면, GitHub 활동 지형, 방문자가 남긴 오브젝트로 구성한 전시관" src="./assets/gallery/${defaultImage}-light.png" width="100%" />
  </picture>
</a>

[프로젝트 둘러보기 ↗](https://okorion.github.io/) · [오브젝트 남기기 +](https://github.com/okorion/okorion/issues/new?template=gallery.yml) · [README Gallery ↗](https://github.com/okorion/readme-gallery)
`,
);
console.log(`README uses ${v}`);

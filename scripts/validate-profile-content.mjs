import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  assertNoBlockedProfileContent,
  loadProfileSurfaces,
  profileRepositoryRoot,
  retainedCleanPortfolioUrls,
} from "./profile-exclusion-policy.mjs";

function assertIncludes(content, expected, label) {
  if (!content.includes(expected)) {
    throw new Error(`${label}: required content is missing (${expected})`);
  }
}

function assertExcludes(content, unexpected, label) {
  if (content.includes(unexpected)) {
    throw new Error(`${label}: forbidden content is present (${unexpected})`);
  }
}

async function readRepositoryFile(relativePath) {
  return readFile(join(profileRepositoryRoot, relativePath), "utf8");
}

const heroAssets = [
  "assets/hero-light.svg",
  "assets/hero-dark.svg",
  "assets/hero-mobile-light.svg",
  "assets/hero-mobile-dark.svg",
];
const signalAssets = [
  "assets/lab-signal-light.svg",
  "assets/lab-signal-dark.svg",
];
const allSvgAssets = [...heroAssets, ...signalAssets];

const [readme, workflow, packageText, ...svgContents] = await Promise.all([
  readRepositoryFile("README.md"),
  readRepositoryFile(".github/workflows/update-profile-signals.yml"),
  readRepositoryFile("package.json"),
  ...allSvgAssets.map((relativePath) => readRepositoryFile(relativePath)),
]);
const svgByPath = new Map(
  allSvgAssets.map((relativePath, index) => [relativePath, svgContents[index]]),
);

assertNoBlockedProfileContent(
  await loadProfileSurfaces(),
  "career profile exclusion policy",
);

for (const retainedContent of [
  "Frontend / Application Engineer",
  "React·TypeScript·Three.js 기반의 2D·3D Editor·Builder와 지도 제품",
  "https://github.com/okorion/mermaid-sky-exporter",
  "https://github.com/okorion/codex-app-telegram-monitor",
  "https://github.com/okorion/self-improving-maintainer-bot",
  "https://github.com/okorion?tab=repositories",
  ...retainedCleanPortfolioUrls,
  "https://velog.io/@okorion",
  "Technical Writing",
]) {
  assertIncludes(readme, retainedContent, "README.md");
}

for (const removedStructure of [
  "### More from the lab",
  "## Signals from the lab",
  "**Exploring**",
  "Public Builds",
]) {
  assertExcludes(readme, removedStructure, "README.md");
}

const selectedWorkHeadings = [
  ...readme.matchAll(/^###\s+(\d{2})\s+—\s+\[([^\r\n]+?)\]\(/gmu),
];
const selectedWorkOrder = selectedWorkHeadings.map(([, index, title]) => ({
  index,
  title,
}));
const expectedSelectedWorkOrder = [
  { index: "01", title: "Mermaid Sky Exporter" },
  { index: "02", title: "Codex App Telegram Monitor" },
  { index: "03", title: "Self-Improving Maintainer Bot" },
];
if (
  JSON.stringify(selectedWorkOrder) !==
  JSON.stringify(expectedSelectedWorkOrder)
) {
  throw new Error(
    `README.md: retained Selected Work order changed (${JSON.stringify(selectedWorkOrder)})`,
  );
}

const localAssetReferences = [
  ...readme.matchAll(/(?:src|srcset)="\.\/([^"]+)"/gu),
].map(([, relativePath]) => relativePath);
const expectedAssetReferences = [...allSvgAssets];
for (const expectedAsset of expectedAssetReferences) {
  if (!localAssetReferences.includes(expectedAsset)) {
    throw new Error(`README.md: generated asset is not referenced (${expectedAsset})`);
  }
  await access(join(profileRepositoryRoot, expectedAsset));
}

if (/!?\[!\[[^\r\n]*https?:\/\//u.test(readme)) {
  throw new Error("README.md: remote project-card images must not be restored");
}

const externalUrls = readme.match(/https:\/\/[^\s<>'"\])]+/gu) ?? [];
for (const candidate of externalUrls) {
  const parsed = new URL(candidate);
  if (parsed.protocol !== "https:") {
    throw new Error(`README.md: only HTTPS links are allowed (${candidate})`);
  }
}

for (const [relativePath, svg] of svgByPath) {
  for (const requiredSvgContract of [
    "<svg",
    'role="img"',
    'aria-labelledby="title desc"',
    '<title id="title">',
    '<desc id="desc">',
    "</svg>",
  ]) {
    assertIncludes(svg, requiredSvgContract, relativePath);
  }
  for (const unsafeSvgContent of [
    "<script",
    "<foreignObject",
    "<image",
    "javascript:",
    "data:text/html",
  ]) {
    assertExcludes(svg, unsafeSvgContent, relativePath);
  }
  const externalSvgUrls = svg
    .replace('xmlns="http://www.w3.org/2000/svg"', "")
    .match(/https?:\/\//gu);
  if (externalSvgUrls?.length) {
    throw new Error(`${relativePath}: external SVG URL is present`);
  }
}

for (const heroAsset of heroAssets) {
  const svg = svgByPath.get(heroAsset);
  for (const approvedHeroCopy of [
    "Frontend / Application Engineer",
    "PRODUCT DELIVERY",
    "Runtime Integration",
    "SAVE / LOAD",
  ]) {
    assertIncludes(svg, approvedHeroCopy, heroAsset);
  }
}

for (const signalAsset of signalAssets) {
  const svg = svgByPath.get(signalAsset);
  for (const retainedSignal of [
    "tech-blog",
    "mermaid-sky-exporter",
    "codex-telegram-monitor",
    "maintainer-bot",
    "BUILD · VERIFY · SHIP",
  ]) {
    assertIncludes(svg, retainedSignal, signalAsset);
  }
}

const packageJson = JSON.parse(packageText);
for (const scriptName of [
  "check:career-catalog",
  "generate:hero",
  "generate:signals",
  "check:profile",
  "test",
]) {
  if (!packageJson.scripts?.[scriptName]) {
    throw new Error(`package.json: required script is missing (${scriptName})`);
  }
}

for (const workflowContract of [
  "pull_request:",
  "npm test",
  "npm run generate:hero",
  "npm run generate:signals",
]) {
  assertIncludes(workflow, workflowContract, "update-profile-signals.yml");
}
for (const generatedAsset of allSvgAssets) {
  assertIncludes(workflow, generatedAsset, "update-profile-signals.yml");
}

console.log(
  "Profile content, retained links, SVG safety, workflow, and exclusion checks passed.",
);

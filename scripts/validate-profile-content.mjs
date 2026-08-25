import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import {
  assertProfileSurfacePolicy,
  loadProfileSurfaces,
  profileEvidenceOnlyPaths,
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
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Callers provide fixed repository-relative validation targets.
  return readFile(join(profileRepositoryRoot, relativePath), "utf8");
}

async function readRepositoryBytes(relativePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Callers provide fixed evidence-only repository paths.
  return readFile(join(profileRepositoryRoot, relativePath));
}

function requiredSurface(surfaceByPath, relativePath) {
  const content = surfaceByPath.get(relativePath);
  if (typeof content !== "string") {
    throw new Error(`required active profile surface is missing (${relativePath})`);
  }
  return content;
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

const activeSurfaces = await loadProfileSurfaces();
const surfaceByPath = new Map(activeSurfaces);
const readme = requiredSurface(surfaceByPath, "README.md");
const workflow = requiredSurface(
  surfaceByPath,
  ".github/workflows/update-profile-signals.yml",
);
const packageText = requiredSurface(surfaceByPath, "package.json");

assertProfileSurfacePolicy(activeSurfaces, "career profile exclusion policy");

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
  requiredSurface(surfaceByPath, expectedAsset);
}

const externalUrls = readme.match(/https:\/\/[^\s<>'"\])]+/gu) ?? [];
for (const candidate of externalUrls) {
  const parsed = new URL(candidate);
  if (parsed.protocol !== "https:") {
    throw new Error(`README.md: only HTTPS links are allowed (${candidate})`);
  }
}

const svgSurfaces = activeSurfaces.filter(
  ([relativePath]) => extname(relativePath).toLocaleLowerCase("en-US") === ".svg",
);
for (const [relativePath, svg] of svgSurfaces) {
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
  const svg = requiredSurface(surfaceByPath, heroAsset);
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
  const svg = requiredSurface(surfaceByPath, signalAsset);
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
const packageScripts = new Set(Object.keys(packageJson.scripts ?? {}));
for (const scriptName of [
  "check:career-catalog",
  "generate:hero",
  "generate:signals",
  "check:profile",
  "test",
]) {
  if (!packageScripts.has(scriptName)) {
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

const evidenceReadmePath = profileEvidenceOnlyPaths.find((relativePath) =>
  relativePath.endsWith("/README.md"),
);
const evidenceImagePaths = profileEvidenceOnlyPaths.filter((relativePath) =>
  relativePath.endsWith(".png"),
);
if (!evidenceReadmePath || evidenceImagePaths.length !== 4) {
  throw new Error("profile evidence allowlist contract is incomplete");
}
const evidenceReadme = await readRepositoryFile(evidenceReadmePath);
const pngMagic = Buffer.from("89504e470d0a1a0a", "hex");
for (const evidenceImagePath of evidenceImagePaths) {
  const bytes = await readRepositoryBytes(evidenceImagePath);
  if (bytes.length < 24 || !bytes.subarray(0, pngMagic.length).equals(pngMagic)) {
    throw new Error(`${evidenceImagePath}: evidence is not an actual PNG`);
  }
  if (bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${evidenceImagePath}: PNG IHDR is missing`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== 1440 || height !== 1000) {
    throw new Error(
      `${evidenceImagePath}: expected 1440x1000, received ${width}x${height}`,
    );
  }
  const hash = createHash("sha256").update(bytes).digest("hex");
  const manifestRow = `| \`${basename(evidenceImagePath)}\` | \`image/png\` | \`1440×1000\` | \`${hash}\` |`;
  assertIncludes(evidenceReadme, manifestRow, evidenceReadmePath);
}

console.log(
  `Profile content, ${activeSurfaces.length} discovered surfaces, image/evidence safety, workflow, and exclusion checks passed.`,
);

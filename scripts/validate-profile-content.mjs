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

assertProfileSurfacePolicy(activeSurfaces, "personal project profile policy");

for (const retainedContent of [
  "개인 프로젝트에서는 AI-native 방식으로 작업합니다.",
  "저는 방향과 UI·UX를 정하고, 프롬프트를 구성하며 결과를 보고 수정 의견을 전달합니다.",
  "코드 구현과 내부 구조 설계는 AI가 수행합니다.",
  "https://okorion.github.io/?project=rust-lab",
  "https://okorion.github.io/?project=report-review-tool",
  "https://okorion.github.io/?project=aether-studio",
  "https://rust-3d-engine-lab.vercel.app",
  "https://aether-studio-nu.vercel.app/",
  "https://github.com/okorion/mermaid-sky-exporter",
  "https://github.com/okorion/vizport-studio",
  "https://github.com/okorion/localmesh-studio",
  ...retainedCleanPortfolioUrls,
  "가상 스튜디오 웹사이트",
  "사람이 내용을 검토·확정",
  "학습 아카이브 — 이전 강의·기술 학습 기록",
]) {
  assertIncludes(readme, retainedContent, "README.md");
}

for (const removedStructure of [
  "## About", "## Signals", "## Principles", "## Core & Practice",
  "Career Profile", "Frontend / Application Engineer", "Runtime Integration",
  "lab-signal", "github-readme-stats", "https://velog.io/", "notion.site",
  "https://okorion.github.io/?view=3d",
]) {
  assertExcludes(readme, removedStructure, "README.md");
}
const archiveUrl = "https://okorion.github.io/tech-blog/";
if (readme.split(archiveUrl).length - 1 !== 1) {
  throw new Error("README.md: the learning archive must appear once");
}
if (!readme.trimEnd().endsWith(`](${archiveUrl})`)) {
  throw new Error("README.md: the learning archive must be the last text link");
}

const selectedWorkHeadings = [
  ...readme.matchAll(/^###\s+(\d{2})\s+—\s+\[([^\r\n]+?)\]\(/gmu),
];
const selectedWorkOrder = selectedWorkHeadings.map(([, index, title]) => ({
  index,
  title,
}));
const expectedSelectedWorkOrder = [
  { index: "01", title: "Rust Lab" },
  { index: "02", title: "정기 재무 보고서 검토 지원 도구" },
  { index: "03", title: "Aether Studio" },
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
const expectedAssetReferences = [...heroAssets];
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
    "AI-native 개인 프로젝트", "AI-NATIVE PROJECTS", "개인 프로젝트 제작 역할",
    "내 역할", "방향 · UI/UX · 프롬프트 · 피드백",
    "AI 역할", "코드 구현 · 내부 구조 설계",
  ]) {
    assertIncludes(svg, approvedHeroCopy, heroAsset);
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
  "push:",
  "contents: read",
  "npm test",
  "npm run generate:hero",
]) {
  assertIncludes(workflow, workflowContract, "update-profile-signals.yml");
}
for (const generatedAsset of heroAssets) {
  assertIncludes(workflow, generatedAsset, "update-profile-signals.yml");
}

for (const retiredAutomation of [
  "schedule:", "npm run generate:signals", "contents: write",
  "git commit", "git push", "GITHUB_TOKEN", "lab-signal",
]) {
  assertExcludes(workflow, retiredAutomation, "update-profile-signals.yml");
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

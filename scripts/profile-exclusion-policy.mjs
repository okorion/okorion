import { lstat, readFile, readdir } from "node:fs/promises";
import { extname, isAbsolute, join, relative, sep, posix } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalizeGfmVisibleText,
  collectMarkdownImageTargets,
} from "./profile-markdown-policy.mjs";
import { normalizeProfileSurface } from "./profile-surface-normalization.mjs";
import { careerExclusionCatalog } from "./career-exclusion-catalog.mjs";
import { licensedObjectFilePaths } from "./gallery/licensed-files.mjs";
import {
  collectCareerExclusionAliases,
  collectCareerExclusionDerivedUrls,
} from "./career-exclusion-catalog-schema.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

// The 2026-10-22 personal-project showcase approval permits these two public
// projects here. Keep the career catalog snapshot and its integrity checks
// unchanged: this scope exception does not update career documents.
export const approvedShowcaseProjectIds = Object.freeze([
  "vizport-studio", "localmesh-studio",
]);
const profileBlockedCatalog = {
  ...careerExclusionCatalog,
  projects: careerExclusionCatalog.projects.filter(
    (project) => !approvedShowcaseProjectIds.includes(project.id),
  ),
};
const careerExclusionAliases = collectCareerExclusionAliases(profileBlockedCatalog);
const careerExclusionDerivedUrls = collectCareerExclusionDerivedUrls(profileBlockedCatalog);

// Legacy promotional copy remains excluded. Technology names are not ownership
// claims; the README states the human and AI roles separately.
const blockedDerivedProfileContent = [
  "Visual Systems Lab", "Visual Computing",
  "tools that think, render, and collaborate", "collaborative 3D editing",
  "explainable visualization and portable code", "data to visualization and code",
  "로컬 LLM 명령", "변경 축만 기록",
  "CSV·JSON을 브라우저에서 분석하고 적합한 차트를 추천", "LLM 프롬프트",
];

export const blockedProfileContent = [...new Set([
  ...careerExclusionAliases, ...careerExclusionDerivedUrls,
  ...blockedDerivedProfileContent,
])];

export const catalogBlockedProfileAliases = [...careerExclusionAliases];
export const catalogDerivedProfileUrls = [...careerExclusionDerivedUrls];
export const blockedProfileDerivedContent = [...blockedDerivedProfileContent];

// Public project pages and the separate personal introduction are the profile
// destinations. Private repository URLs are excluded from the showcase.
export const retainedCleanPortfolioUrls = ["https://okorion.github.io/?view=projects", "https://okorion.github.io/?view=about"];
export const blockedPrivateRepositoryUrls = [
  "github.com/okorion/ember-studio",
  "github.com/okorion/rust-3d-engine-lab",
  "github.com/okorion/aether-studio",
  "github.com/okorion/reusable-product-assets",
];

const textExtensions = new Set(
  ".adoc .asciidoc .cjs .css .cts .gltf .htm .html .js .json .jsonc .jsx .md .mjs .mts .ps1 .py .rst .sh .sql .svg .toml .ts .tsx .txt .xml .yaml .yml".split(
    " ",
  ),
);
const executableTextExtensions = new Set(
  ".cjs .cts .js .jsx .mjs .mts .ps1 .py .sh .ts .tsx".split(" "),
);
const activeSurfaceDirectories = new Set(".github assets docs guestbook public scripts static styles".split(" "));
const skippedRepositoryDirectories = new Set([".git", "node_modules"]);
const policyOnlyPaths = new Set(
  "scripts/career-exclusion-catalog-schema.mjs scripts/profile-exclusion-policy.mjs scripts/profile-surface-normalization.mjs".split(" "),
);
export const profileEvidenceDirectory = "docs/pr-evidence/github-profile-career-exclusions";
export const profileEvidenceOnlyPaths = Object.freeze([
  `${profileEvidenceDirectory}/README.md`, `${profileEvidenceDirectory}/hero-before.png`,
  `${profileEvidenceDirectory}/hero-after.png`,
  `${profileEvidenceDirectory}/selected-work-before.png`,
  `${profileEvidenceDirectory}/selected-work-after.png`,
]);
const evidenceOnlyPaths = new Set(profileEvidenceOnlyPaths);
const allowedProfileImageTargets = new Set(
  "assets/hero-light.svg assets/hero-dark.svg assets/hero-mobile-light.svg assets/hero-mobile-dark.svg".split(" "),
);
// The gallery contains only a fixed public-site capture and generated scenes.
export const galleryImagePaths = ["assets/gallery/portfolio.png", "assets/gallery/portfolio-dark.png", ...["wall", "gallery", "island", "wall-advanced", "gallery-advanced", "island-advanced", "pavilion"].flatMap(variant =>
  ["light", "dark"].flatMap(theme => [`assets/gallery/${variant}-${theme}.png`, `assets/gallery/${variant}-mobile-${theme}.png`]))];
galleryImagePaths.push("assets/gallery/portfolio-mobile.png", "assets/gallery/portfolio-mobile-dark.png",
  ...["portfolio", "guestbook"].flatMap(part => ["light", "dark"].flatMap(theme => [
    `assets/gallery/archive-${part}-${theme}.png`, `assets/gallery/archive-${part}-mobile-${theme}.png`,
  ])));
galleryImagePaths.push(...["Camera_01", "gamepad", "rubber_duck_toy", "boombox", "pocket_watch", "chess_set", "carved_wooden_elephant", "horse_head", "lambis_shell"].map((id) => `assets/gallery/choices/${id}.png`));
for (const path of galleryImagePaths) allowedProfileImageTargets.add(path);

export { normalizeProfileSurface };

function compactProfileSurface(value) {
  return normalizeProfileSurface(value).replace(/[\s\p{P}\p{S}]+/gu, "");
}

function includesBlockedValue(surfaceValue, blockedValue) {
  const normalizedSurface = normalizeProfileSurface(surfaceValue);
  const normalizedBlocked = normalizeProfileSurface(blockedValue);
  if (normalizedSurface.includes(normalizedBlocked)) {
    return true;
  }

  const compactBlocked = compactProfileSurface(blockedValue);
  return (
    compactBlocked.length >= 6 &&
    compactProfileSurface(surfaceValue).includes(compactBlocked)
  );
}

function assertPathInsideRoot(root, candidatePath) {
  const relativePath = relative(root, candidatePath);
  const escapesRoot =
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath);
  if (escapesRoot) {
    throw new Error(`profile surface scan escaped ${root} (${candidatePath})`);
  }
  return candidatePath;
}

export function assertSafeProfileRelativePath(candidatePath) {
  if (typeof candidatePath !== "string" || candidatePath.length === 0) {
    throw new Error("profile surface path must be a non-empty string");
  }
  const normalizedPath = candidatePath.split("\\").join("/");
  const pathSegments = normalizedPath.split("/");
  if (
    isAbsolute(candidatePath) ||
    /^[a-z]:\//iu.test(normalizedPath) ||
    normalizedPath.startsWith("/") ||
    normalizedPath.includes("\0") ||
    pathSegments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`profile surface path is unsafe (${candidatePath})`);
  }
  return normalizedPath;
}

function repositoryRelativePath(root, filePath) {
  return assertSafeProfileRelativePath(
    relative(root, filePath).split(sep).join("/"),
  );
}

function classifyReadmeName(normalizedName) {
  if (normalizedName === "readme") {
    return "supported";
  }
  if (!normalizedName.startsWith("readme.")) {
    return "unrelated";
  }
  const suffix = normalizedName.slice("readme.".length);
  return suffix.length > 0 &&
    [...suffix].every((character) => /[a-z0-9_-]/u.test(character))
    ? "supported"
    : "unsupported";
}

function isRootReadme(relativePath) {
  if (relativePath.includes("/")) {
    return false;
  }
  const readmeClassification = classifyReadmeName(
    relativePath.toLocaleLowerCase("en-US"),
  );
  if (readmeClassification === "unrelated") {
    return false;
  }
  if (readmeClassification === "unsupported") {
    throw new Error(`README surface path is unsupported (${relativePath})`);
  }
  const extension = extname(relativePath).toLocaleLowerCase("en-US");
  if (!extension) {
    return true;
  }
  if (!textExtensions.has(extension)) {
    throw new Error(`README surface type is unsupported (${relativePath})`);
  }
  return true;
}

function classifyEvidenceSurfacePath(relativePath) {
  if (!relativePath.startsWith(`${profileEvidenceDirectory}/`)) {
    return null;
  }
  if (!evidenceOnlyPaths.has(relativePath)) {
    throw new Error(`profile evidence entry is not allowlisted (${relativePath})`);
  }
  return "evidence-only";
}

function classifyOutsideActiveDirectories(relativePath, topLevelDirectory) {
  if (activeSurfaceDirectories.has(topLevelDirectory)) {
    return null;
  }
  const extension = extname(relativePath).toLocaleLowerCase("en-US");
  return executableTextExtensions.has(extension) ? "active" : "inactive";
}

function classifyGithubSurfacePath(relativePath, topLevelDirectory) {
  if (topLevelDirectory !== ".github") {
    return null;
  }
  const pathSegments = relativePath.split("/");
  if (pathSegments.at(1) !== "workflows") {
    return "inactive";
  }
  const extension = extname(relativePath).toLocaleLowerCase("en-US");
  if (pathSegments.length !== 3 || (extension !== ".yml" && extension !== ".yaml")) {
    throw new Error(`workflow surface path is unsupported (${relativePath})`);
  }
  return null;
}

export function classifyProfileSurfacePath(candidatePath) {
  const relativePath = assertSafeProfileRelativePath(candidatePath);
  const evidenceClassification = classifyEvidenceSurfacePath(relativePath);
  if (evidenceClassification) {
    return evidenceClassification;
  }
  if (policyOnlyPaths.has(relativePath)) {
    return "policy-only";
  }
  if (relativePath === "package.json" || isRootReadme(relativePath)) {
    return "active";
  }
  if (relativePath === "guestbook/.dev.vars") return "development-config";

  const [topLevelDirectory] = relativePath.split("/");
  const outsideClassification = classifyOutsideActiveDirectories(
    relativePath,
    topLevelDirectory,
  );
  if (outsideClassification) {
    return outsideClassification;
  }
  const githubClassification = classifyGithubSurfacePath(
    relativePath,
    topLevelDirectory,
  );
  if (githubClassification) {
    return githubClassification;
  }
  if (galleryImagePaths.includes(relativePath)) return "generated-gallery-image";
  if (licensedObjectFilePaths.has(relativePath)) return "licensed-gallery-model";
  if (relativePath === "assets/fonts/PretendardVariable.woff2") return "licensed-gallery-font";
  if (!textExtensions.has(extname(relativePath).toLocaleLowerCase("en-US"))) {
    throw new Error(`active profile surface type is unsupported (${relativePath})`);
  }
  return "active";
}

export function assertSupportedProfileEntry(entry, relativePath) {
  if (entry.isSymbolicLink()) {
    throw new Error(`profile surface symlink is unsupported (${relativePath})`);
  }
  if (!entry.isDirectory() && !entry.isFile()) {
    throw new Error(`profile surface filesystem entry is unsupported (${relativePath})`);
  }
}

async function readSurfaceContent(root, filePath) {
  const safeFilePath = assertPathInsideRoot(root, filePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The resolved path is constrained to the explicitly scanned root.
  const bytes = await readFile(safeFilePath);
  return bytes.toString("utf8");
}

async function collectTree(root, directory, surfaces) {
  const safeDirectory = assertPathInsideRoot(root, directory);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The resolved directory is constrained to the explicitly scanned root.
  for (const entry of await readdir(safeDirectory, { withFileTypes: true })) {
    const filePath = join(safeDirectory, entry.name);
    const relativePath = repositoryRelativePath(root, filePath);
    if (entry.isDirectory() && ["guestbook/node_modules", "guestbook/.wrangler", "guestbook/dist"].includes(relativePath)) continue;
    if (
      entry.isDirectory() &&
      !relativePath.includes("/") &&
      skippedRepositoryDirectories.has(relativePath)
    ) {
      continue;
    }
    assertSupportedProfileEntry(entry, relativePath);
    if (entry.isDirectory()) {
      await collectTree(root, filePath, surfaces);
      continue;
    }
    if (classifyProfileSurfacePath(relativePath) !== "active") {
      continue;
    }
    surfaces.push([
      relativePath,
      await readSurfaceContent(root, filePath),
    ]);
  }
  return surfaces;
}

async function readDiscoveredProfileSurfaces(root) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The caller-provided test root is validated before recursive discovery.
  const rootEntry = await lstat(root);
  if (rootEntry.isSymbolicLink() || !rootEntry.isDirectory()) {
    throw new Error(`profile repository root must be a real directory (${root})`);
  }
  return collectTree(root, root, []);
}

export async function loadProfileSurfaces({
  root = repositoryRoot,
  contentMutations = new Map(),
  contentReplacements = new Map(),
  virtualFiles = new Map(),
} = {}) {
  for (const [label, value] of [
    ["content mutations", contentMutations],
    ["content replacements", contentReplacements],
    ["virtual files", virtualFiles],
  ]) {
    if (!(value instanceof Map)) {
      throw new Error(`profile surface ${label} must be a Map`);
    }
  }

  const surfaces = new Map(await readDiscoveredProfileSurfaces(root));
  for (const [candidatePath, content] of virtualFiles) {
    const relativePath = assertSafeProfileRelativePath(candidatePath);
    if (classifyProfileSurfacePath(relativePath) !== "active") {
      throw new Error(`virtual profile surface is not active (${relativePath})`);
    }
    if (surfaces.has(relativePath)) {
      throw new Error(`virtual profile surface already exists (${relativePath})`);
    }
    surfaces.set(relativePath, String(content));
  }

  for (const [candidatePath, content] of contentReplacements) {
    const relativePath = assertSafeProfileRelativePath(candidatePath);
    if (!surfaces.has(relativePath)) {
      throw new Error(`profile surface replacement target is missing (${relativePath})`);
    }
    surfaces.set(relativePath, String(content));
  }
  for (const [candidatePath, mutation] of contentMutations) {
    const relativePath = assertSafeProfileRelativePath(candidatePath);
    if (!surfaces.has(relativePath)) {
      throw new Error(`profile surface mutation target is missing (${relativePath})`);
    }
    surfaces.set(relativePath, `${surfaces.get(relativePath)}\n${mutation}`);
  }
  return [...surfaces].sort(([left], [right]) => left.localeCompare(right));
}

export function assertNoBlockedProfileContent(surfaces, label) {
  for (const [surfaceLabel, content] of surfaces) {
    const searchableSurface = `${surfaceLabel}\n${content}`;
    const extension = extname(surfaceLabel).toLocaleLowerCase("en-US");
    const visibleSurface = extension === ".md" || extension === ".htm" || extension === ".html"
      ? `${surfaceLabel}\n${canonicalizeGfmVisibleText(content)}`
      : searchableSurface;
    for (const blockedContent of [...blockedProfileContent, ...blockedPrivateRepositoryUrls]) {
      if (
        includesBlockedValue(searchableSurface, blockedContent) ||
        includesBlockedValue(visibleSurface, blockedContent)
      ) {
        throw new Error(
          `${label}: forbidden content is present in ${surfaceLabel} (${blockedContent})`,
        );
      }
    }
  }
}

function assertAllowedProfileImageTarget(rawTarget, surfaceLabel, label) {
  const rawCanonicalTarget = String(rawTarget).trim().replace(/^<|>$/gu, "");
  const target = normalizeProfileSurface(rawCanonicalTarget).trim();
  if (target !== rawCanonicalTarget.toLocaleLowerCase("en-US")) {
    throw new Error(`${label}: image target must use canonical syntax in ${surfaceLabel}`);
  }
  if (/[?#]/u.test(target)) {
    throw new Error(`${label}: image target must match exactly in ${surfaceLabel}`);
  }
  if (
    target.startsWith("data:") ||
    target.startsWith("http:") ||
    target.startsWith("https:") ||
    target.startsWith("//") ||
    target.startsWith("/")
  ) {
    throw new Error(`${label}: external or embedded image is forbidden in ${surfaceLabel}`);
  }
  const canonicalTarget = target.startsWith("./") ? target.slice(2) : target;
  // Documentation may refer to a generated asset in the parent directory.
  // Resolve within the repository, then retain both traversal and exact-asset checks.
  const resolvedTarget = canonicalTarget.startsWith("../") && surfaceLabel.includes("/")
    ? posix.normalize(posix.join(posix.dirname(surfaceLabel), canonicalTarget))
    : canonicalTarget;
  const relativeTarget = assertSafeProfileRelativePath(resolvedTarget);
  if (!allowedProfileImageTargets.has(relativeTarget)) {
    throw new Error(
      `${label}: image target is not an approved generated asset in ${surfaceLabel} (${rawTarget})`,
    );
  }
}

function collectHtmlImageTargets(content) {
  const targets = [];
  for (const tag of content.match(/<(?:img|source)\b[^>]*>/giu) ?? []) {
    for (const match of tag.matchAll(
      /\b(src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu,
    )) {
      const [, attribute, doubleQuoted, singleQuoted, unquoted] = match;
      const value = doubleQuoted ?? singleQuoted ?? unquoted;
      if (attribute.toLocaleLowerCase("en-US") === "srcset") {
        for (const candidate of value.split(",")) {
          const [target] = candidate.trim().split(/\s+/u);
          if (target) {
            targets.push(target);
          }
        }
      } else {
        targets.push(value.trim());
      }
    }
  }
  return targets;
}

function assertSafeCssResources(content, surfaceLabel, label) {
  const normalizedContent = normalizeProfileSurface(content);
  if (/@import\b/iu.test(normalizedContent)) {
    throw new Error(`${label}: CSS import is forbidden in ${surfaceLabel}`);
  }
  for (const match of normalizedContent.matchAll(
    /url\(\s*(["']?)(.*?)\1\s*\)/giu,
  )) {
    const target = match[2].trim();
    // This build-owned path is copied from the hash-verified gallery font.
    if (surfaceLabel === "guestbook/public/styles.css" && target === "/font.woff2") continue;
    if (!target.startsWith("#")) {
      throw new Error(`${label}: CSS external asset is forbidden in ${surfaceLabel}`);
    }
  }
}

function collectAlternativeReadmeImageTargets(content, extension) {
  if (extension === ".rst") {
    return [...content.matchAll(/^\s*\.\.\s+(?:image|figure)::\s+(\S+)/gimu)]
      .map(([, target]) => target);
  }
  if (extension === ".adoc" || extension === ".asciidoc") {
    return [...content.matchAll(/image::?([^\s[]+)\[/giu)]
      .map(([, target]) => target);
  }
  return [];
}

const markupImageExtensions = new Set([
  ".adoc",
  ".asciidoc",
  ".htm",
  ".html",
  ".md",
  ".rst",
]);

function assertSafeMarkupImages(content, extension, surfaceLabel, label) {
  if (!markupImageExtensions.has(extension)) {
    return;
  }
  const imageTargets = [
    ...collectMarkdownImageTargets(content),
    ...collectHtmlImageTargets(content),
    ...collectAlternativeReadmeImageTargets(content, extension),
  ];
  for (const imageTarget of imageTargets) {
    assertAllowedProfileImageTarget(imageTarget, surfaceLabel, label);
  }
}

function assertSafeSvgResources(content, normalizedContent, surfaceLabel, label) {
  if (/<\s*(?:image|use)\b/iu.test(normalizedContent)) {
    throw new Error(`${label}: SVG image/use is forbidden in ${surfaceLabel}`);
  }
  if (/\b(?:xlink:)?href\s*=/iu.test(normalizedContent)) {
    throw new Error(`${label}: SVG href is forbidden in ${surfaceLabel}`);
  }
  const withoutNamespace = normalizedContent.replace(
    /xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/giu,
    "",
  );
  if (withoutNamespace.includes("//") || withoutNamespace.includes("data:image")) {
    throw new Error(`${label}: SVG external/data image is forbidden in ${surfaceLabel}`);
  }
  assertSafeCssResources(content, surfaceLabel, label);
}

function assertSafeSurfaceImages(surfaceLabel, content, evidenceReference, label) {
  const normalizedContent = normalizeProfileSurface(content);
  if (normalizedContent.includes(evidenceReference)) {
    throw new Error(
      `${label}: evidence-only path is referenced by active surface ${surfaceLabel}`,
    );
  }
  const extension = extname(surfaceLabel).toLocaleLowerCase("en-US");
  assertSafeMarkupImages(content, extension, surfaceLabel, label);
  if (extension === ".svg") {
    assertSafeSvgResources(content, normalizedContent, surfaceLabel, label);
  }
  if (extension === ".css") {
    assertSafeCssResources(content, surfaceLabel, label);
  }
}

export function assertSafeProfileImages(surfaces, label) {
  const evidenceReference = normalizeProfileSurface(`${profileEvidenceDirectory}/`);
  for (const [surfaceLabel, content] of surfaces) {
    assertSafeSurfaceImages(surfaceLabel, content, evidenceReference, label);
  }
}

export function assertProfileSurfacePolicy(surfaces, label) {
  assertNoBlockedProfileContent(surfaces, label);
  assertSafeProfileImages(surfaces, label);
}

export function assertAllowedProfileRepositoryNames(entries, label) {
  const surfaces = entries.map((entry, index) => [
    `${label}[${index}]`,
    `${entry.name ?? ""}\n${entry.label ?? ""}\n${entry.url ?? ""}`,
  ]);
  assertNoBlockedProfileContent(surfaces, label);
}

export const profileRepositoryRoot = repositoryRoot;

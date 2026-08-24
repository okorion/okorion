import { lstat, readFile, readdir } from "node:fs/promises";
import { extname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  careerExclusionAliases,
  careerExclusionDerivedUrls,
} from "./career-exclusion-catalog.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

// These phrases and technologies were copied from the excluded project cards
// or the previous hero. They are profile-surface extensions of the catalog,
// not replacements for its authoritative aliases.
const blockedDerivedProfileContent = [
  "local-first", "local first", "local AI", "WebGPU", "WebLLM",
  "ECharts", "Yjs", "Hocuspocus", "IndexedDB", "VizSpec", "SceneCommand",
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

// The cleaned portfolio is intentionally retained as a profile locator by the
// current profile-specific decision. This does not permit any catalog project
// alias, repository URL, demo URL, image, technology, or outcome to return.
export const retainedCleanPortfolioUrls = ["https://okorion.github.io/", "https://okorion.github.io/?view=3d"];

const textExtensions = new Set(
  ".adoc .asciidoc .cjs .css .cts .htm .html .js .json .jsx .md .mjs .mts .ps1 .py .rst .sh .svg .toml .ts .tsx .txt .xml .yaml .yml".split(
    " ",
  ),
);
const executableTextExtensions = new Set(
  ".cjs .cts .js .jsx .mjs .mts .ps1 .py .sh .ts .tsx".split(" "),
);
const activeSurfaceDirectories = new Set(".github assets docs public scripts static styles".split(" "));
const skippedRepositoryDirectories = new Set([".git", "node_modules"]);
const policyOnlyPaths = new Set("scripts/career-exclusion-catalog-schema.mjs scripts/profile-exclusion-policy.mjs".split(" "));
export const profileEvidenceDirectory = "docs/pr-evidence/github-profile-career-exclusions";
export const profileEvidenceOnlyPaths = Object.freeze([
  `${profileEvidenceDirectory}/README.md`, `${profileEvidenceDirectory}/hero-before.png`,
  `${profileEvidenceDirectory}/hero-after.png`,
  `${profileEvidenceDirectory}/selected-work-before.png`,
  `${profileEvidenceDirectory}/selected-work-after.png`,
]);
const evidenceOnlyPaths = new Set(profileEvidenceOnlyPaths);
const allowedProfileImageTargets = new Set(
  "assets/hero-light.svg assets/hero-dark.svg assets/hero-mobile-light.svg assets/hero-mobile-dark.svg assets/lab-signal-light.svg assets/lab-signal-dark.svg".split(" "),
);

function decodeCssEscapes(value) {
  return value.replace(
    /\\(?:\r\n|[\n\r\f])|\\([0-9a-f]{1,6})[\t\n\f\r ]?|\\([^\n\r\f])/giu,
    (_, hexadecimal, simpleEscape) => {
      if (hexadecimal) {
        const codePoint = Number.parseInt(hexadecimal, 16);
        return codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : "";
      }
      return simpleEscape ?? "";
    },
  );
}

function stripCssComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//gu, "");
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);?/gu, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&#x([0-9a-f]+);?/giu, (_, hexadecimal) =>
      String.fromCodePoint(Number.parseInt(hexadecimal, 16)),
    )
    .replaceAll("&colon;", ":")
    .replaceAll("&sol;", "/")
    .replaceAll("&period;", ".")
    .replaceAll("&hyphen;", "-")
    .replaceAll("&bsol;", "\\")
    .replaceAll("&backslash;", "\\")
    .replaceAll("&amp;", "&");
}

function decodeUrlLayers(value) {
  let decoded = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export function normalizeProfileSurface(value) {
  let normalized = String(value);
  for (let layer = 0; layer < 6; layer += 1) {
    const next = decodeCssEscapes(
      decodeHtmlEntities(decodeUrlLayers(stripCssComments(normalized))),
    )
      .replace(/\p{Cf}/gu, "")
      .normalize("NFKC");
    if (next === normalized) {
      break;
    }
    normalized = next;
  }
  return normalized.toLocaleLowerCase("en-US");
}

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
    /[\s\p{P}\p{S}]/u.test(normalizedBlocked) &&
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
    for (const blockedContent of blockedProfileContent) {
      if (includesBlockedValue(searchableSurface, blockedContent)) {
        throw new Error(
          `${label}: forbidden content is present in ${surfaceLabel} (${blockedContent})`,
        );
      }
    }
  }
}

function assertAllowedProfileImageTarget(rawTarget, surfaceLabel, label) {
  const target = normalizeProfileSurface(rawTarget)
    .trim()
    .replace(/^<|>$/gu, "");
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
  const relativeTarget = assertSafeProfileRelativePath(
    target.startsWith("./") ? target.slice(2) : target,
  );
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

function collectMarkdownImageTargets(content) {
  return [...content.matchAll(/!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))/gu)]
    .map(([, bracketedTarget, target]) => bracketedTarget ?? target)
    .filter(Boolean);
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

export function assertSafeProfileImages(surfaces, label) {
  const evidenceReference = normalizeProfileSurface(`${profileEvidenceDirectory}/`);
  for (const [surfaceLabel, content] of surfaces) {
    const normalizedContent = normalizeProfileSurface(content);
    if (normalizedContent.includes(evidenceReference)) {
      throw new Error(
        `${label}: evidence-only path is referenced by active surface ${surfaceLabel}`,
      );
    }

    const extension = extname(surfaceLabel).toLocaleLowerCase("en-US");
    if (
      extension === ".md" ||
      extension === ".html" ||
      extension === ".htm" ||
      extension === ".rst" ||
      extension === ".adoc" ||
      extension === ".asciidoc"
    ) {
      for (const imageTarget of [
        ...collectMarkdownImageTargets(content),
        ...collectHtmlImageTargets(content),
        ...collectAlternativeReadmeImageTargets(content, extension),
      ]) {
        assertAllowedProfileImageTarget(imageTarget, surfaceLabel, label);
      }
    }

    if (extension === ".svg") {
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
      if (/data:image|https?:\/\//iu.test(withoutNamespace)) {
        throw new Error(`${label}: SVG external/data image is forbidden in ${surfaceLabel}`);
      }
    }

    if (extension === ".css") {
      for (const match of content.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/giu)) {
        const target = normalizeProfileSurface(match[2]).trim();
        if (!target.startsWith("#")) {
          throw new Error(`${label}: CSS external asset is forbidden in ${surfaceLabel}`);
        }
      }
    }
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

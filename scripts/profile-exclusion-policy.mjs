import { readFile, readdir } from "node:fs/promises";
import {
  extname,
  isAbsolute,
  join,
  relative,
  sep,
} from "node:path";
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
  "local-first",
  "local first",
  "local AI",
  "WebGPU",
  "WebLLM",
  "ECharts",
  "Yjs",
  "Hocuspocus",
  "IndexedDB",
  "VizSpec",
  "SceneCommand",
  "Visual Systems Lab",
  "Visual Computing",
  "tools that think, render, and collaborate",
  "collaborative 3D editing",
  "explainable visualization and portable code",
  "data to visualization and code",
  "로컬 LLM 명령",
  "변경 축만 기록",
  "CSV·JSON을 브라우저에서 분석하고 적합한 차트를 추천",
  "LLM 프롬프트",
];

export const blockedProfileContent = [
  ...new Set([
    ...careerExclusionAliases,
    ...careerExclusionDerivedUrls,
    ...blockedDerivedProfileContent,
  ]),
];

export const catalogBlockedProfileAliases = [...careerExclusionAliases];
export const catalogDerivedProfileUrls = [...careerExclusionDerivedUrls];
export const blockedProfileDerivedContent = [...blockedDerivedProfileContent];

// The cleaned portfolio is intentionally retained as a profile locator by the
// current profile-specific decision. This does not permit any catalog project
// alias, repository URL, demo URL, image, technology, or outcome to return.
export const retainedCleanPortfolioUrls = [
  "https://okorion.github.io/",
  "https://okorion.github.io/?view=3d",
];

const fixedTextSurfacePaths = [
  "README.md",
  ".github/workflows/update-profile-signals.yml",
  "scripts/generate-profile-hero.mjs",
  "scripts/generate-profile-signals.mjs",
];

const textExtensions = new Set([
  ".css",
  ".htm",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".svg",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

function decodeCssEscapes(value) {
  return value.replace(/\\([0-9a-f]{1,6})\s?/giu, (_, hexadecimal) => {
    const codePoint = Number.parseInt(hexadecimal, 16);
    return codePoint > 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : "";
  });
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
  return decodeUrlLayers(decodeHtmlEntities(decodeCssEscapes(String(value))))
    .normalize("NFKC")
    .toLocaleLowerCase("en-US");
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

function normalizePath(filePath) {
  return relative(repositoryRoot, filePath).split(sep).join("/");
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

async function readSurfaceContent(root, filePath) {
  const safeFilePath = assertPathInsideRoot(root, filePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The resolved path is constrained to the explicitly scanned root.
  const bytes = await readFile(safeFilePath);
  if (textExtensions.has(extname(filePath).toLowerCase())) {
    return bytes.toString("utf8");
  }
  // Binary metadata is still scanned as bytes; visual regression is handled
  // separately by generated-asset and screenshot checks.
  return `${bytes.toString("utf8")}\n${bytes.toString("latin1")}`;
}

async function collectTree(root, directory, surfaces) {
  const safeDirectory = assertPathInsideRoot(root, directory);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The resolved directory is constrained to the explicitly scanned root.
  for (const entry of await readdir(safeDirectory, { withFileTypes: true })) {
    const filePath = join(safeDirectory, entry.name);
    if (entry.isDirectory()) {
      await collectTree(root, filePath, surfaces);
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(
        `profile surface scan found an unsupported filesystem entry (${filePath})`,
      );
    }
    surfaces.push([
      normalizePath(filePath),
      await readSurfaceContent(root, filePath),
    ]);
  }
  return surfaces;
}

export async function readProfileStaticTree(
  root = repositoryRoot,
  directory = join(root, "assets"),
) {
  return collectTree(root, directory, []);
}

export async function loadProfileSurfaces({
  root = repositoryRoot,
  contentMutations = new Map(),
} = {}) {
  if (!(contentMutations instanceof Map)) {
    throw new Error("profile surface content mutations must be a Map");
  }

  const surfaces = [];
  for (const relativePath of fixedTextSurfacePaths) {
    const filePath = join(root, relativePath);
    surfaces.push([relativePath, await readSurfaceContent(root, filePath)]);
  }
  surfaces.push(...(await readProfileStaticTree(root)));

  const pendingMutations = new Set(contentMutations.keys());
  const mutatedSurfaces = surfaces.map(([label, content]) => {
    if (!contentMutations.has(label)) {
      return [label, content];
    }
    pendingMutations.delete(label);
    return [label, `${content}\n${contentMutations.get(label)}`];
  });
  if (pendingMutations.size > 0) {
    throw new Error(
      `profile surface mutation target is missing (${[...pendingMutations].join(", ")})`,
    );
  }
  return mutatedSurfaces;
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

export function assertAllowedProfileRepositoryNames(entries, label) {
  const surfaces = entries.map((entry, index) => [
    `${label}[${index}]`,
    `${entry.name ?? ""}\n${entry.label ?? ""}\n${entry.url ?? ""}`,
  ]);
  assertNoBlockedProfileContent(surfaces, label);
}

export const profileRepositoryRoot = repositoryRoot;

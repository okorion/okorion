import {
  careerExclusionCatalogMetadata,
  careerExclusionCatalogSnapshotBytes,
} from "./career-exclusion-catalog.mjs";
import {
  assertCareerExclusionSnapshotIntegrity,
  assertCareerExclusionSourceSync,
  sha256Hex,
} from "./career-exclusion-catalog-schema.mjs";
import {
  assertNoBlockedProfileContent,
  assertProfileSurfacePolicy,
  assertSafeProfileRelativePath,
  assertSupportedProfileEntry,
  blockedProfileDerivedContent,
  catalogBlockedProfileAliases,
  catalogDerivedProfileUrls,
  loadProfileSurfaces,
  profileEvidenceDirectory,
  retainedCleanPortfolioUrls,
} from "./profile-exclusion-policy.mjs";

function expectBlocked(surfaces, label) {
  try {
    assertProfileSurfacePolicy(surfaces, label);
  } catch {
    return;
  }
  throw new Error(`${label} was not rejected`);
}

function expectRejected(action, label) {
  try {
    action();
  } catch {
    return;
  }
  throw new Error(`${label} was not rejected`);
}

function expectDiscoveredSurfaceRejected(options, label) {
  return loadProfileSurfaces(options).then(
    (surfaces) => expectBlocked(surfaces, label),
    () => undefined,
  );
}

function percentEncode(value) {
  return [...Buffer.from(value, "utf8")]
    .map((byte) => `%${byte.toString(16).padStart(2, "0")}`)
    .join("");
}

function cssHexEscapeFirstCharacter(value) {
  const [firstCharacter, ...rest] = [...value];
  return `\\${firstCharacter.codePointAt(0).toString(16)} ${rest.join("")}`;
}

function cssSimpleEscape(value) {
  const characters = [...value];
  const splitIndex = characters.findIndex(
    (character, index) => index > 0 && !/[0-9a-f]/iu.test(character),
  );
  if (splitIndex < 1) {
    throw new Error(`simple CSS escape probe is unavailable (${value})`);
  }
  return `${characters.slice(0, splitIndex).join("")}\\${characters.slice(splitIndex).join("")}`;
}

function insertCssComment(value) {
  const characters = [...value];
  const splitIndex = Math.min(3, characters.length - 1);
  return `${characters.slice(0, splitIndex).join("")}/**/${characters.slice(splitIndex).join("")}`;
}

function insertHtmlComment(value) {
  const characters = [...value];
  const splitIndex = Math.min(3, characters.length - 1);
  return `${characters.slice(0, splitIndex).join("")}<!--hidden-->${characters.slice(splitIndex).join("")}`;
}

function insertHtmlEntity(value, entity) {
  const characters = [...value];
  const splitIndex = Math.min(3, characters.length - 1);
  return `${characters.slice(0, splitIndex).join("")}${entity}${characters.slice(splitIndex).join("")}`;
}

function insertFormatControl(value) {
  const [firstCharacter, ...rest] = [...value];
  return `${firstCharacter}\u200b${rest.join("")}`;
}

for (const alias of catalogBlockedProfileAliases) {
  await expectDiscoveredSurfaceRejected(
    { contentMutations: new Map([["README.md", `Project: ${alias}`]]) },
    `README alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card{content:"${alias}"}`]],
    `CSS alias regression (${alias})`,
  );
  await expectDiscoveredSurfaceRejected(
    {
      contentMutations: new Map([
        ["assets/hero-light.svg", `<svg><text>${alias}</text></svg>`],
      ]),
    },
    `SVG alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.svg", `<svg><title>${percentEncode(alias)}</title></svg>`]],
    `URL-encoded SVG alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${cssHexEscapeFirstCharacter(alias)}"}`]],
    `CSS hex-escaped alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${cssSimpleEscape(alias)}"}`]],
    `CSS simple-escaped alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${insertCssComment(alias)}"}`]],
    `CSS comment alias regression (${alias})`,
  );
  expectBlocked(
    [["README.md", insertHtmlComment(alias)]],
    `HTML comment alias regression (${alias})`,
  );
  expectBlocked(
    [["README.md", insertHtmlEntity(alias, "&Tab;")]],
    `HTML named whitespace entity alias regression (${alias})`,
  );
  expectBlocked(
    [["README.md", insertHtmlEntity(alias, "&#9;")]],
    `HTML numeric whitespace entity alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${insertFormatControl(alias)}"}`]],
    `format-control alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${percentEncode(cssSimpleEscape(alias))}"}`]],
    `URL and CSS-encoded alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${cssSimpleEscape(alias).replace("\\", "&#92;")}"}`]],
    `HTML numeric and CSS-encoded alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${cssSimpleEscape(alias).replace("\\", "&bsol;")}"}`]],
    `HTML named and CSS-encoded alias regression (${alias})`,
  );
  expectBlocked(
    [[`assets/${alias}.svg`, ""]],
    `static asset path alias regression (${alias})`,
  );
  await expectDiscoveredSurfaceRejected(
    {
      contentMutations: new Map([
        ["scripts/generate-profile-signals.mjs", `{ name: "${alias}" }`],
      ]),
    },
    `generator alias regression (${alias})`,
  );
}

const representativeAlias = catalogBlockedProfileAliases.at(0);
if (!representativeAlias) {
  throw new Error("catalog alias regression requires at least one alias");
}

for (const workflowExtension of ["yml", "yaml"]) {
  await expectDiscoveredSurfaceRejected(
    {
      virtualFiles: new Map([
        [`.github/workflows/alternate.${workflowExtension}`, `name: ${representativeAlias}`],
      ]),
    },
    `alternate workflow .${workflowExtension} discovery`,
  );
}

for (const directory of ["static", "public", "styles", "docs"]) {
  const extension = directory === "styles" ? "css" : "svg";
  await expectDiscoveredSurfaceRejected(
    {
      virtualFiles: new Map([
        [`${directory}/alternate.${extension}`, `${representativeAlias}`],
      ]),
    },
    `${directory} discovery regression`,
  );
}

await expectDiscoveredSurfaceRejected(
  {
    contentMutations: new Map([
      ["package.json", '"generate:alternate":"node tools/generate-alternate.mjs"'],
    ]),
    virtualFiles: new Map([
      ["tools/generate-alternate.mjs", `export default "${representativeAlias}";`],
    ]),
  },
  "package generator discovery regression",
);

for (const rawAssetUrl of catalogDerivedProfileUrls) {
  expectBlocked(
    [["assets/profile.css", `.card{background-image:url("https://${rawAssetUrl}/main/public/og.png")}`]],
    `derived raw asset URL regression (${rawAssetUrl})`,
  );
  expectBlocked(
    [["README.md", `![preview](https://${rawAssetUrl}/main/public/og.png)`]],
    `generic-alt raw image regression (${rawAssetUrl})`,
  );
  expectBlocked(
    [["README.md", `<img alt="preview" src=https://${rawAssetUrl}/main/public/og.png>`]],
    `HTML src raw image regression (${rawAssetUrl})`,
  );
  expectBlocked(
    [["README.md", `<source srcset="https://${rawAssetUrl}/main/public/og.png">`]],
    `HTML srcset raw image regression (${rawAssetUrl})`,
  );
}

for (const [referenceStyle, markdown] of [
  [
    "full",
    "![generic preview][external-preview]\n\n[external-preview]: https://example.invalid/excluded-preview.png",
  ],
  [
    "collapsed",
    "![external-preview][]\n\n[external-preview]: <https://example.invalid/excluded-preview.png>",
  ],
  [
    "shortcut",
    "![external preview]\n\n[External   Preview]: https://example.invalid/excluded-preview.png",
  ],
]) {
  expectBlocked(
    [["README.md", markdown]],
    `Markdown ${referenceStyle} reference image regression`,
  );
}

assertProfileSurfacePolicy(
  [[
    "README.md",
    "![hero][approved-hero]\n\n[approved-hero]: ./assets/hero-light.svg",
  ]],
  "approved Markdown reference image",
);

const evidenceImagePath = `${profileEvidenceDirectory}/hero-before.png`;
expectBlocked(
  [[
    "README.md",
    `![historical evidence][before-image]\n\n[before-image]: ${evidenceImagePath}`,
  ]],
  "Markdown reference image evidence-only target regression",
);
for (const activeSurfacePath of [
  "README.md",
  "assets/hero-light.svg",
  "scripts/generate-profile-hero.mjs",
  ".github/workflows/update-profile-signals.yml",
]) {
  await expectDiscoveredSurfaceRejected(
    {
      contentMutations: new Map([
        [activeSurfacePath, `evidence-reference=${evidenceImagePath}`],
      ]),
    },
    `evidence-only reference regression (${activeSurfacePath})`,
  );
}

for (const unsafeSvg of [
  `<svg><image href="../${evidenceImagePath}"/></svg>`,
  `<svg><use xlink:href="../${evidenceImagePath}"/></svg>`,
  '<svg><image href="data:image/png;base64,AA=="/></svg>',
]) {
  await expectDiscoveredSurfaceRejected(
    { virtualFiles: new Map([["assets/alternate-image.svg", unsafeSvg]]) },
    "additional SVG image/use regression",
  );
}

await expectDiscoveredSurfaceRejected(
  {
    virtualFiles: new Map([[
      "assets/protocol-relative.svg",
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.probe{fill:url(//example.invalid/remote.svg#paint)}</style><rect class="probe"/></svg>',
    ]]),
  },
  "protocol-relative SVG paint resource regression",
);
await expectDiscoveredSurfaceRejected(
  {
    virtualFiles: new Map([[
      "styles/external-import.css",
      '@import "//example.invalid/remote.css";',
    ]]),
  },
  "CSS string-form import regression",
);

await expectDiscoveredSurfaceRejected(
  { virtualFiles: new Map([["assets/alternate-image.png", "not-an-image"]]) },
  "active raster image regression",
);
await expectDiscoveredSurfaceRejected(
  {
    virtualFiles: new Map([
      [`${profileEvidenceDirectory}/unexpected.png`, "not-evidence"],
    ]),
  },
  "evidence allowlist regression",
);

expectRejected(
  () => assertSafeProfileRelativePath("../outside.md"),
  "path traversal",
);
expectRejected(
  () =>
    assertSupportedProfileEntry(
      {
        isDirectory: () => false,
        isFile: () => false,
        isSymbolicLink: () => true,
      },
      "assets/link.svg",
    ),
  "profile surface symlink",
);
expectRejected(
  () =>
    assertSupportedProfileEntry(
      {
        isDirectory: () => false,
        isFile: () => false,
        isSymbolicLink: () => false,
      },
      "assets/socket",
    ),
  "unsupported filesystem entry",
);

for (const derivedContent of blockedProfileDerivedContent) {
  expectBlocked(
    [["README.md", derivedContent]],
    `derived profile copy regression (${derivedContent})`,
  );
}

assertNoBlockedProfileContent(
  [
    ["README.md", "https://github.com/okorion"],
    ...retainedCleanPortfolioUrls.map((url) => ["README.md", url]),
    ["README.md", "Mermaid Sky Exporter"],
    ["README.md", "Frontend / Application Engineer"],
  ],
  "approved retained profile content",
);

const snapshotText = Buffer.from(careerExclusionCatalogSnapshotBytes).toString(
  "utf8",
);
const driftedSourceBytes = Buffer.from(
  snapshotText.replace('"status": "confirmed-excluded"', '"status": "default-excluded"'),
  "utf8",
);
expectRejected(
  () =>
    assertCareerExclusionSourceSync(
      careerExclusionCatalogSnapshotBytes,
      driftedSourceBytes,
      careerExclusionCatalogMetadata,
    ),
  "installed source catalog drift",
);

const tamperedCatalog = JSON.parse(snapshotText);
const confirmedProject = tamperedCatalog.projects.find(
  (project) => project.status === "confirmed-excluded",
);
tamperedCatalog.projects = tamperedCatalog.projects.filter(
  (project) => project.id !== confirmedProject?.id,
);
if (tamperedCatalog.projects.length > 0) {
  tamperedCatalog.projects.at(0).status = "confirmed-excluded";
}
const tamperedSnapshotBytes = Buffer.from(
  `${JSON.stringify(tamperedCatalog, null, 2)}\n`,
  "utf8",
);
const tamperedSnapshotHash = sha256Hex(tamperedSnapshotBytes);
const rehashedTamperedMetadata = {
  ...careerExclusionCatalogMetadata,
  source: {
    ...careerExclusionCatalogMetadata.source,
    sha256: tamperedSnapshotHash,
  },
  snapshot: {
    ...careerExclusionCatalogMetadata.snapshot,
    sha256: tamperedSnapshotHash,
  },
};
expectRejected(
  () =>
    assertCareerExclusionSnapshotIntegrity(
      tamperedSnapshotBytes,
      rehashedTamperedMetadata,
    ),
  "catalog project deletion with rehashed metadata",
);

const invalidPolicyBytes = Buffer.from(
  snapshotText.replace('"decision": "omit-all"', '"decision": "include"'),
  "utf8",
);
const invalidPolicyHash = sha256Hex(invalidPolicyBytes);
const invalidPolicyMetadata = {
  ...careerExclusionCatalogMetadata,
  source: {
    ...careerExclusionCatalogMetadata.source,
    sha256: invalidPolicyHash,
  },
  snapshot: {
    ...careerExclusionCatalogMetadata.snapshot,
    sha256: invalidPolicyHash,
  },
};
expectRejected(
  () =>
    assertCareerExclusionSnapshotIntegrity(
      invalidPolicyBytes,
      invalidPolicyMetadata,
    ),
  "non-omit-all catalog policy",
);

console.log(
  `Profile aliases rejected across discovered README/workflow/package/generator/static/style/SVG paths (${catalogBlockedProfileAliases.length} aliases).`,
);
console.log(
  `Derived copy rejected (${blockedProfileDerivedContent.length} patterns); HTML/entity/reference-image/CSS-resource regressions rejected.`,
);
console.log(
  "Path traversal, symlink/unsupported entries, catalog rehash tampering, and source drift were rejected.",
);

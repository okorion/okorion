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
  blockedProfileDerivedContent,
  catalogBlockedProfileAliases,
  catalogDerivedProfileUrls,
  loadProfileSurfaces,
  retainedCleanPortfolioUrls,
} from "./profile-exclusion-policy.mjs";

function expectBlocked(surfaces, label) {
  try {
    assertNoBlockedProfileContent(surfaces, label);
  } catch (error) {
    if (String(error?.message).includes("forbidden content")) {
      return;
    }
    throw error;
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

function percentEncode(value) {
  return [...Buffer.from(value, "utf8")]
    .map((byte) => `%${byte.toString(16).padStart(2, "0")}`)
    .join("");
}

function cssEscapeFirstCharacter(value) {
  const [firstCharacter, ...rest] = [...value];
  return `\\${firstCharacter.codePointAt(0).toString(16)} ${rest.join("")}`;
}

for (const alias of catalogBlockedProfileAliases) {
  expectBlocked(
    await loadProfileSurfaces({
      contentMutations: new Map([["README.md", `Project: ${alias}`]]),
    }),
    `README alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card{background:url(\"https://${alias}\")}`]],
    `CSS alias regression (${alias})`,
  );
  expectBlocked(
    await loadProfileSurfaces({
      contentMutations: new Map([
        ["assets/hero-light.svg", `<svg><text>${alias}</text></svg>`],
      ]),
    }),
    `SVG alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.svg", `<svg><title>${percentEncode(alias)}</title></svg>`]],
    `URL-encoded SVG alias regression (${alias})`,
  );
  expectBlocked(
    [["assets/profile.css", `.card::before{content:"${cssEscapeFirstCharacter(alias)}"}`]],
    `CSS-escaped alias regression (${alias})`,
  );
  expectBlocked(
    [[`assets/${alias}.png`, ""]],
    `static asset path alias regression (${alias})`,
  );
  expectBlocked(
    await loadProfileSurfaces({
      contentMutations: new Map([
        [
          "scripts/generate-profile-signals.mjs",
          `{ name: "${alias}" }`,
        ],
      ]),
    }),
    `generator alias regression (${alias})`,
  );
}

for (const rawAssetUrl of catalogDerivedProfileUrls) {
  expectBlocked(
    [["assets/profile.css", `.card{background:url(\"https://${rawAssetUrl}/main/public/og.png\")}`]],
    `derived raw asset URL regression (${rawAssetUrl})`,
  );
}

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
  `Profile aliases rejected across README/generator/CSS/SVG/static paths (${catalogBlockedProfileAliases.length} aliases).`,
);
console.log(
  `Derived copy rejected (${blockedProfileDerivedContent.length} patterns); approved portfolio and GitHub links retained.`,
);
console.log("Catalog source drift and non-omit-all policy were rejected.");

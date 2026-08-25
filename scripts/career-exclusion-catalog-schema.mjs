import { createHash } from "node:crypto";

// Trusted Career OS release lock. Updating the repository snapshot or its
// self-reported metadata cannot move this boundary; a source release change
// requires an explicit review of this constant and the canonical project set.
export const trustedCareerExclusionRelease = Object.freeze({
  schemaVersion: "1.0",
  policyId: "career-os-github-lab-exclusion-2026-08-21",
  sourceSha256:
    "3399d932aa4b36bf8916f38ca8d6714e776c985fc4cac633811b2b77002ad7e2",
  confirmedCanonicalProjectIds: Object.freeze(["vizport-studio"]),
});
const expectedCatalogSchemaVersion = trustedCareerExclusionRelease.schemaVersion;
const expectedCatalogPolicyId = trustedCareerExclusionRelease.policyId;
const expectedCatalogDecision = "omit-all";
const expectedCatalogScope = "generated-external-artifacts-and-support-files";
const expectedMetadataSyncMode = "byte-identical-source-catalog";
const expectedSnapshotPath =
  "config/career/github-lab-project-exclusions.generated.json";
const expectedSourceSkill = "job-application-finalizer";
const expectedSourceRelativePath =
  "references/github-lab-project-exclusions.json";
const trustedProjectStatuses = new Map([
  ["vizport-studio", "confirmed-excluded"],
  ["localmesh-studio", "default-excluded"],
  ["gpu-ux-lab", "default-excluded"],
]);
const trustedConfirmedCanonicalProjectIds = new Set(
  trustedCareerExclusionRelease.confirmedCanonicalProjectIds,
);
const allowedProjectStatuses = new Set([
  "confirmed-excluded",
  "default-excluded",
]);
const sha256Pattern = /^[a-f0-9]{64}$/;
const applicationInputExceptionScope =
  "user-direct-official-application-form-portfolio-url-field-only";

function fail(message) {
  throw new Error(`career exclusion catalog: ${message}`);
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(sortedExpectedKeys)) {
    fail(
      `${label} keys must equal ${sortedExpectedKeys.join(", ")} (received ${actualKeys.join(", ")})`,
    );
  }
}

function assertExact(value, expected, label) {
  if (value !== expected) {
    fail(`${label} must equal ${expected}`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${label} must be a non-empty string`);
  }
}

function assertNonEmptyStringList(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${label} must be a non-empty array`);
  }
  for (const item of value) {
    assertNonEmptyString(item, `${label} item`);
  }
}

function assertSha256(value, label) {
  if (typeof value !== "string" || !sha256Pattern.test(value)) {
    fail(`${label} must be a lowercase SHA-256`);
  }
}

function isLowercaseKebabCase(value) {
  return value.split("-").every(
    (segment) =>
      segment.length > 0 &&
      [...segment].every((character) => {
        const code = character.codePointAt(0);
        const isLowercaseLetter = code >= 97 && code <= 122;
        const isDigit = code >= 48 && code <= 57;
        return isLowercaseLetter || isDigit;
      }),
  );
}

function validateProject(project, seenProjectIds) {
  assertPlainObject(project, "project");
  assertExactKeys(
    project,
    ["id", "displayName", "status", "aliases"],
    "project",
  );
  assertNonEmptyString(project.id, "project.id");
  if (!isLowercaseKebabCase(project.id)) {
    fail(`${project.id}.id must be a lowercase kebab-case slug`);
  }
  assertNonEmptyString(project.displayName, `${project.id}.displayName`);
  assertNonEmptyStringList(project.aliases, `${project.id}.aliases`);
  if (!allowedProjectStatuses.has(project.status)) {
    fail(`${project.id}.status is not an exclusion status`);
  }
  if (seenProjectIds.has(project.id)) {
    fail(`duplicate project id ${project.id}`);
  }
  seenProjectIds.add(project.id);

  const normalizedAliases = new Set(
    project.aliases.map((alias) => alias.toLocaleLowerCase("en-US")),
  );
  for (const requiredAlias of [
    project.displayName,
    project.id,
    `github.com/okorion/${project.id}`,
  ]) {
    if (!normalizedAliases.has(requiredAlias.toLocaleLowerCase("en-US"))) {
      fail(`${project.id}.aliases is missing ${requiredAlias}`);
    }
  }
}

function validateApplicationInputUrlException(exception, index) {
  const label = `applicationInputUrlExceptions[${index}]`;
  assertPlainObject(exception, label);
  assertExact(
    exception.scope,
    applicationInputExceptionScope,
    `${label}.scope`,
  );
  if (exception.type === "url") {
    assertExactKeys(exception, ["type", "value", "scope"], label);
    assertNonEmptyString(exception.value, `${label}.value`);
    return;
  }
  if (exception.type === "notion-page") {
    assertExactKeys(exception, ["type", "pageId", "label", "scope"], label);
    assertNonEmptyString(exception.pageId, `${label}.pageId`);
    assertNonEmptyString(exception.label, `${label}.label`);
    return;
  }
  fail(`${label}.type is not supported`);
}

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validateCatalogIdentity(catalog) {
  assertExact(
    catalog.schemaVersion,
    expectedCatalogSchemaVersion,
    "schemaVersion",
  );
  assertExact(catalog.policyId, expectedCatalogPolicyId, "policyId");
  assertExact(catalog.decision, expectedCatalogDecision, "decision");
  assertExact(
    catalog.blockedSurfaceScope,
    expectedCatalogScope,
    "blockedSurfaceScope",
  );
  assertNonEmptyStringList(catalog.blockedSurfaces, "blockedSurfaces");
  if (!catalog.blockedSurfaces.includes("okorion.github.io")) {
    fail("blockedSurfaces must include okorion.github.io");
  }
}

function validateCatalogApplicationExceptions(catalog) {
  if (!Array.isArray(catalog.applicationInputUrlExceptions)) {
    fail("applicationInputUrlExceptions must be an array");
  }
  for (const [index, exception] of catalog.applicationInputUrlExceptions.entries()) {
    validateApplicationInputUrlException(exception, index);
  }
}

function validateCatalogProjects(catalog) {
  if (!Array.isArray(catalog.projects) || catalog.projects.length === 0) {
    fail("projects must be a non-empty array");
  }

  const seenProjectIds = new Set();
  for (const project of catalog.projects) {
    validateProject(project, seenProjectIds);
  }
  for (const [projectId, expectedStatus] of trustedProjectStatuses) {
    const project = catalog.projects.find((candidate) => candidate.id === projectId);
    if (!project) {
      fail(`trusted project is missing (${projectId})`);
    }
    assertExact(project.status, expectedStatus, `${projectId}.trusted status`);
  }
  const confirmedProjectIds = new Set(
    catalog.projects
      .filter((project) => project.status === "confirmed-excluded")
      .map((project) => project.id),
  );
  if (
    confirmedProjectIds.size !== trustedConfirmedCanonicalProjectIds.size ||
    [...trustedConfirmedCanonicalProjectIds].some(
      (projectId) => !confirmedProjectIds.has(projectId),
    )
  ) {
    fail("confirmed canonical project IDs do not match the trusted Career OS release");
  }
}

export function assertValidCareerExclusionCatalog(catalog) {
  assertPlainObject(catalog, "catalog");
  assertExactKeys(
    catalog,
    [
      "schemaVersion",
      "policyId",
      "decision",
      "blockedSurfaceScope",
      "blockedSurfaces",
      "applicationInputUrlExceptions",
      "projects",
    ],
    "catalog",
  );
  validateCatalogIdentity(catalog);
  validateCatalogApplicationExceptions(catalog);
  validateCatalogProjects(catalog);
  return catalog;
}

export function parseCareerExclusionCatalog(catalogBytes, label) {
  let catalog;
  try {
    catalog = JSON.parse(Buffer.from(catalogBytes).toString("utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON (${error.message})`);
  }
  return assertValidCareerExclusionCatalog(catalog);
}

export function assertValidCareerExclusionMetadata(metadata) {
  assertPlainObject(metadata, "metadata");
  assertExactKeys(
    metadata,
    ["schemaVersion", "syncMode", "source", "snapshot"],
    "metadata",
  );
  assertExact(metadata.schemaVersion, "1.0", "metadata.schemaVersion");
  assertExact(metadata.syncMode, expectedMetadataSyncMode, "syncMode");
  assertPlainObject(metadata.source, "metadata.source");
  assertExactKeys(
    metadata.source,
    ["kind", "skill", "relativePath", "sha256"],
    "metadata.source",
  );
  assertExact(metadata.source.kind, "installed-skill-reference", "source.kind");
  assertExact(metadata.source.skill, expectedSourceSkill, "source.skill");
  assertExact(
    metadata.source.relativePath,
    expectedSourceRelativePath,
    "source.relativePath",
  );
  assertSha256(metadata.source.sha256, "source.sha256");
  assertExact(
    metadata.source.sha256,
    trustedCareerExclusionRelease.sourceSha256,
    "trusted source SHA-256",
  );
  assertPlainObject(metadata.snapshot, "metadata.snapshot");
  assertExactKeys(metadata.snapshot, ["path", "sha256"], "metadata.snapshot");
  assertExact(metadata.snapshot.path, expectedSnapshotPath, "snapshot.path");
  assertSha256(metadata.snapshot.sha256, "snapshot.sha256");
  assertExact(
    metadata.snapshot.sha256,
    trustedCareerExclusionRelease.sourceSha256,
    "trusted snapshot SHA-256",
  );
  return metadata;
}

export function assertCareerExclusionSnapshotIntegrity(snapshotBytes, metadata) {
  assertValidCareerExclusionMetadata(metadata);
  const snapshotHash = sha256Hex(snapshotBytes);
  assertExact(snapshotHash, metadata.snapshot.sha256, "snapshot SHA-256");
  assertExact(snapshotHash, metadata.source.sha256, "snapshot/source SHA-256");
  return parseCareerExclusionCatalog(snapshotBytes, "repository snapshot");
}

export function assertCareerExclusionSourceSync(
  snapshotBytes,
  sourceBytes,
  metadata,
) {
  const catalog = assertCareerExclusionSnapshotIntegrity(
    snapshotBytes,
    metadata,
  );
  const sourceHash = sha256Hex(sourceBytes);
  assertExact(sourceHash, metadata.source.sha256, "installed source SHA-256");
  parseCareerExclusionCatalog(sourceBytes, "installed source catalog");
  if (!Buffer.from(snapshotBytes).equals(Buffer.from(sourceBytes))) {
    fail("installed source and repository snapshot are not byte-identical");
  }
  return catalog;
}

export function collectCareerExclusionAliases(catalog) {
  const aliases = new Set();
  for (const project of catalog.projects) {
    for (const alias of project.aliases) {
      aliases.add(alias);
    }
  }
  return [...aliases];
}

export function collectCareerExclusionDerivedUrls(catalog) {
  return catalog.projects.map(
    (project) => `raw.githubusercontent.com/okorion/${project.id}`,
  );
}

import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const scannerPath = "scripts/scan-profile-sensitive.mjs";
const skippedBinaryExtensions = new Set([
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

const forbiddenPatterns = [
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu],
  ["OpenAI key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/gu],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/gu],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/gu],
  ["Korean mobile number", /\b01[016789][-. ]?\d{3,4}[-. ]?\d{4}\b/gu],
  ["Korean resident number", /\b\d{6}[- ]?[1-4]\d{6}\b/gu],
  ["private certificate number", /\b26-011371\b/gu],
  ["local Windows user path", /C:\\Users\\[^\\\s]+/giu],
];
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const allowedEmails = new Set([
  "41898282+github-actions[bot]@users.noreply.github.com",
]);

async function collectFiles(directory, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") {
      continue;
    }
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(filePath, files);
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`sensitive scan found unsupported entry (${filePath})`);
    }
    files.push(filePath);
  }
  return files;
}

const findings = [];
for (const filePath of await collectFiles(repositoryRoot, [])) {
  const relativePath = relative(repositoryRoot, filePath).split(sep).join("/");
  if (
    relativePath === scannerPath ||
    skippedBinaryExtensions.has(extname(relativePath).toLowerCase())
  ) {
    continue;
  }
  const content = await readFile(filePath, "utf8");
  for (const [label, pattern] of forbiddenPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push(`${relativePath}: ${label}`);
    }
  }
  for (const email of content.match(emailPattern) ?? []) {
    if (!allowedEmails.has(email.toLocaleLowerCase("en-US"))) {
      findings.push(`${relativePath}: email address`);
    }
  }
}

if (findings.length > 0) {
  throw new Error(`Sensitive profile content detected:\n${findings.join("\n")}`);
}

console.log("Profile secret and PII scan passed.");

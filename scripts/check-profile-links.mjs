import { readFile } from "node:fs/promises";

// eslint-disable-next-line security/detect-non-literal-fs-filename -- This is a fixed repository-local file URL.
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const links = new Set();

for (const pattern of [
  /href="([^"]+)"/gu,
  /\[[^\]]+\]\(([^)]+)\)/gu,
]) {
  for (const match of readme.matchAll(pattern)) {
    links.add(match[1]);
  }
}

const headings = new Set(
  [...readme.matchAll(/^#{1,6}\s+(.+)$/gmu)].map(([, heading]) =>
    heading
      .trim()
      .toLocaleLowerCase("en-US")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/gu, "-"),
  ),
);

const externalLinks = [];
for (const link of links) {
  if (link.startsWith("#")) {
    if (!headings.has(link.slice(1))) {
      throw new Error(`README.md: local anchor does not resolve (${link})`);
    }
    continue;
  }
  const parsed = new URL(link);
  if (parsed.protocol !== "https:") {
    throw new Error(`README.md: only HTTPS links are allowed (${link})`);
  }
  externalLinks.push(link);
}

const failures = [];
for (const link of externalLinks) {
  try {
    const response = await fetch(link, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "okorion-profile-link-check",
      },
    });
    await response.body?.cancel();
    if (response.status < 200 || response.status >= 400) {
      failures.push(`${link} -> HTTP ${response.status}`);
    }
  } catch (error) {
    failures.push(`${link} -> ${error.message}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Profile link check failed:\n${failures.join("\n")}`);
}

console.log(
  `Profile links passed (${externalLinks.length} external, ${links.size - externalLinks.length} local).`,
);

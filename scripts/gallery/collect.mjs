import { readFile, mkdir, writeFile } from "node:fs/promises";
import { selectArtworks, validateData, activeArtworks, parseAnonymousFeed } from "./model.mjs";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token)
  throw new Error(
    "A GitHub token is required to read public guestbook issues",
  );
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
if (config.maxVisitors !== 6 || config.retentionDays !== 3) throw new Error("Invalid guestbook policy");
async function api(path, options = {}) {
  const res = await fetch(`https://api.github.com/${path}`, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "okorion-gallery",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`GitHub request failed (${res.status})`);
  return res.json();
}
// Activity collection is retired. The empty field keeps historical data readable.
const weeks = [];
const issues = [];
let finished = false;
for (let page = 1; page <= 20; page++) {
  const batch = await api(
    `repos/okorion/okorion/issues?state=open&sort=created&direction=desc&per_page=100&page=${page}`,
  );
  if (!Array.isArray(batch)) throw new Error("Invalid issue response");
  issues.push(...batch);
  if (batch.length < 100) {
    finished = true;
    break;
  }
}
if (!finished)
  throw new Error(
    "Issue pagination exceeded limit; previous published image is preserved",
  );
let anonymous = [];
if (config.anonymousGuestbookUrl) {
  const origin = new URL(config.anonymousGuestbookUrl);
  if (origin.origin !== "https://okorion-guestbook.ok-or-orion.workers.dev" || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Unapproved anonymous guestbook origin");
  const response = await fetch(new URL("/api/greetings", origin), { redirect: "error", signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error(`Anonymous guestbook fetch failed (${response.status})`);
  const text = await response.text();
  if (text.length > 6000) throw new Error("Anonymous feed exceeded size limit");
  anonymous = parseAnonymousFeed(JSON.parse(text));
}
const data = validateData({
  version: 1,
  weeks,
  artworks: activeArtworks([...selectArtworks(issues, config.maxVisitors), ...anonymous]).reverse(),
});
await mkdir("assets/gallery", { recursive: true });
await writeFile(
  "assets/gallery/data.json",
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  `Collected ${data.artworks.length} recent guestbook entries`,
);

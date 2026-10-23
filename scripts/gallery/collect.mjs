import { readFile, mkdir, writeFile } from "node:fs/promises";
import { normalizeCalendar, selectArtworks, validateData } from "./model.mjs";

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token)
  throw new Error(
    "A GitHub token is required for the public contribution calendar",
  );
const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
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
// Query aggregate counts only, never repository names or private project details.
const response = await api("graphql", {
  method: "POST",
  body: JSON.stringify({
    query:
      '{ user(login:"okorion") { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }',
  }),
});
if (response.errors?.length)
  throw new Error("GitHub contribution query failed");
const weeks = normalizeCalendar(
  response.data?.user?.contributionsCollection?.contributionCalendar?.weeks,
  config.contributionWeeks,
);
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
const data = validateData({
  version: 1,
  weeks,
  artworks: selectArtworks(issues, config.maxVisitors),
});
await mkdir("assets/gallery", { recursive: true });
await writeFile(
  "assets/gallery/data.json",
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  `Collected ${weeks.length} contribution weeks and ${data.artworks.length} visitor artworks`,
);

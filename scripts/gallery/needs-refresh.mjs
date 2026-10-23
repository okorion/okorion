import { readFile, appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const source = JSON.parse(await readFile("assets/gallery/source.json", "utf8"));
const response = await fetch("https://okorion.github.io/", {
  redirect: "error",
  signal: AbortSignal.timeout(30000),
  cache: "no-store",
});
if (!response.ok)
  throw new Error(`Portfolio check failed (${response.status})`);
const htmlSha256 = createHash("sha256")
  .update(await response.text())
  .digest("hex");
const dataChanged =
  execFileSync(
    "git",
    ["diff", "--name-only", "--", "assets/gallery/data.json"],
    { encoding: "utf8" },
  ).trim().length > 0;
const changed =
  process.env.GITHUB_EVENT_NAME !== "schedule" ||
  dataChanged ||
  source.htmlSha256 !== htmlSha256;
if (process.env.GITHUB_OUTPUT)
  await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
console.log(
  changed
    ? "Gallery refresh needed"
    : "Portfolio and gallery data unchanged; rendering skipped",
);

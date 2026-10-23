import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { variants, validateData } from "./model.mjs";

const config = JSON.parse(await readFile("config/gallery.json", "utf8"));
if (config.portfolioUrl !== "https://okorion.github.io/")
  throw new Error("Only the public portfolio is allowed");
validateData(JSON.parse(await readFile("assets/gallery/data.json", "utf8")));
const root = new URL("../../", import.meta.url);
const routes = new Map([
  ["/", ["scripts/gallery/scene.html", "text/html"]],
  ["/scene.mjs", ["scripts/gallery/scene.mjs", "text/javascript"]],
  [
    "/three.mjs",
    ["node_modules/three/build/three.module.js", "text/javascript"],
  ],
  [
    "/three.core.js",
    ["node_modules/three/build/three.core.js", "text/javascript"],
  ],
  ["/data.json", ["assets/gallery/data.json", "application/json"]],
  ["/portfolio.png", ["assets/gallery/portfolio.png", "image/png"]],
  ["/portfolio-dark.png", ["assets/gallery/portfolio-dark.png", "image/png"]],
]);
const server = createServer(async (req, res) => {
  const route = routes.get(new URL(req.url, "http://localhost").pathname);
  if (!route) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const body = await readFile(new URL(route[0], root));
    res.writeHead(200, {
      "Content-Type": route[1],
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
let browser;
try {
  browser = await chromium.launch({
    headless: process.env.GALLERY_HEADED !== "1",
    args: [
      "--disable-features=AutofillAiWalletPrivatePasses,AutofillAmbientAutofill",
    ],
  });
  // Credentials stay in Node and never enter the screenshot browser.
  const context = await browser.newContext({
    viewport: { width: 1184, height: 760 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  if (process.env.GALLERY_REUSE_CAPTURE !== "1") {
    const navigation = await page.goto(config.portfolioUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    if (!page.url().startsWith(config.portfolioUrl))
      throw new Error("Unexpected portfolio redirect");
    await page.locator('[data-default-view="portfolio"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() =>
      [...document.images].every((i) => i.complete && i.naturalWidth > 0),
    );
    await page.screenshot({
      path: "assets/gallery/portfolio.png",
      animations: "disabled",
    });
    if (!navigation?.ok()) throw new Error("Portfolio document did not load");
    const html = await navigation.text();
    const scripts = [...html.matchAll(/src="(\/assets\/[^"<>]+\.js)"/g)].map(
      (m) => m[1],
    );
    const png = await readFile("assets/gallery/portfolio.png");
    await page.locator(".theme-toggle").click();
    await page
      .locator('[data-default-view="portfolio"][data-theme="dark"]')
      .waitFor();
    await page.screenshot({
      path: "assets/gallery/portfolio-dark.png",
      animations: "disabled",
    });
    const darkPng = await readFile("assets/gallery/portfolio-dark.png");
    await writeFile(
      "assets/gallery/source.json",
      JSON.stringify(
        {
          url: config.portfolioUrl,
          viewport: { width: 1184, height: 760 },
          scripts,
          htmlSha256: createHash("sha256").update(html).digest("hex"),
          sha256: createHash("sha256").update(png).digest("hex"),
          darkSha256: createHash("sha256").update(darkPng).digest("hex"),
        },
        null,
        2,
      ) + "\n",
    );
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const variant of variants)
    for (const theme of ["light", "dark"])
      for (const mobile of [false, true]) {
        const size = mobile
          ? { width: 900, height: 900 }
          : { width: 1600, height: 700 };
        await page.setViewportSize(size);
        await page.goto(
          `http://127.0.0.1:${port}/?variant=${variant}&theme=${theme}&mobile=${mobile}`,
          { waitUntil: "networkidle" },
        );
        await page.waitForFunction(
          () => window.galleryReady,
          {},
          { timeout: 60000 },
        );
        const labelsFit = await page.locator(".label").evaluateAll((labels) =>
          labels.every((label) => {
            const r = label.getBoundingClientRect();
            return (
              r.left >= 0 &&
              r.top >= 0 &&
              r.right <= innerWidth &&
              r.bottom <= innerHeight
            );
          }),
        );
        if (!labelsFit)
          throw new Error(`Clipped labels in ${variant}/${theme}/${mobile}`);
        if (errors.length)
          throw new Error(`Scene failed: ${errors.join("; ")}`);
        const filename = `${variant}${mobile ? "-mobile" : ""}-${theme}.png`;
        await page.screenshot({
          path: `assets/gallery/${filename}`,
          animations: "disabled",
        });
        console.log(`Rendered ${filename}`);
      }
  // Optional review evidence remains outside the product repository.
  if (process.env.GALLERY_EVIDENCE_DIR) {
    await mkdir(process.env.GALLERY_EVIDENCE_DIR, { recursive: true });
    const { join } = await import("node:path");
    for (const variant of variants)
      await copyFile(
        `assets/gallery/${variant}-light.png`,
        join(process.env.GALLERY_EVIDENCE_DIR, `${variant}-light.png`),
      );
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

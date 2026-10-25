import { mkdir, copyFile, cp } from "node:fs/promises";
import { objects } from "../scripts/gallery/catalog.mjs";
await mkdir(new URL("dist/choices/", import.meta.url), { recursive: true });
await cp(new URL("public/", import.meta.url), new URL("dist/", import.meta.url), { recursive: true });
await copyFile(new URL("../assets/fonts/PretendardVariable.woff2", import.meta.url), new URL("dist/font.woff2", import.meta.url));
await copyFile(new URL("../assets/fonts/OFL.txt", import.meta.url), new URL("dist/font-license.txt", import.meta.url));
for (const object of objects) {
  await copyFile(new URL(`../assets/gallery/choices/${object.id}.png`, import.meta.url), new URL(`dist/choices/${object.id}.png`, import.meta.url));
}
console.log("Guestbook page and nine licensed object previews built");

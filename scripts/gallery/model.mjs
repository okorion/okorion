import { objectIds, objects, legacyObjectMap } from "./catalog.mjs";
export const variants = ["wall", "gallery", "island", "pavilion", "archive"];
export const styles = ["simple", "advanced"];
export const imageSize = (variant, mobile) =>
  mobile
    ? { width: 900, height: variant === "wall" ? 1400 : 900 }
    : { width: 1600, height: 700 };
export const stylesFor = (variant) =>
  ["pavilion", "archive"].includes(variant) ? ["advanced"] : styles;
export const assetName = (variant, style) =>
  `${variant}${variant !== "pavilion" && style === "advanced" ? "-advanced" : ""}`;
export const shapes = ["sphere", "cube", "torus", "arch", "pyramid"];
export const colors = {
  blue: "#3569e8",
  mint: "#24a7a0",
  violet: "#8d6bd1",
  white: "#e3e8ef",
};
const shapeChoices = new Map([
  ["구체 (sphere)", "sphere"],
  ["큐브 (cube)", "cube"],
  ["고리 (torus)", "torus"],
  ["아치 (arch)", "arch"],
  ["피라미드 (pyramid)", "pyramid"],
]);
const colorChoices = new Map([
  ["파랑 (blue)", "blue"],
  ["민트 (mint)", "mint"],
  ["보라 (violet)", "violet"],
  ["흰색 (white)", "white"],
]);
const objectChoices = new Map(objects.map(({ id, label }) => [`${label} (${id})`, id]));
export const assetForArtwork = (artwork) => artwork.asset || legacyObjectMap.get(artwork.shape);
export const guestbookCapacity = 6;
export const artworkLifetimeMs = 3 * 24 * 60 * 60 * 1000;
export const artworkExpiresAt = (artwork) => new Date(Date.parse(artwork.createdAt) + artworkLifetimeMs).toISOString();
const anonymousIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const recentFirst = (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
  (a.source === "anonymous" || b.source === "anonymous" ? String(b.id || b.issue).localeCompare(String(a.id || a.issue)) : b.issue - a.issue);
export const formatKoreanTime = (value) => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(new Date(value)).replaceAll("-", ".");

export function activeArtworks(artworks, now = Date.now()) {
  return artworks.filter((artwork) => {
    const createdAt = Date.parse(artwork.createdAt);
    return Number.isFinite(createdAt) && createdAt <= now && now - createdAt < artworkLifetimeMs;
  }).sort(recentFirst).slice(0, guestbookCapacity);
}

export function parseAnonymousFeed(feed) {
  if (feed?.version !== 1 || !Array.isArray(feed.greetings) || feed.greetings.length > guestbookCapacity) throw new Error("Invalid anonymous guestbook feed");
  const ids = new Set();
  return feed.greetings.map((item) => {
    if (!item || Object.keys(item).some((key) => !["id", "asset", "createdAt", "expiresAt"].includes(key)) ||
      !anonymousIdPattern.test(item.id) || ids.has(item.id) || !objectIds.includes(item.asset) ||
      !Number.isFinite(Date.parse(item.createdAt)) || Date.parse(item.expiresAt) - Date.parse(item.createdAt) !== artworkLifetimeMs) throw new Error("Invalid anonymous greeting");
    ids.add(item.id);
    return { source: "anonymous", id: item.id, asset: item.asset, createdAt: item.createdAt };
  });
}

export function guestbookSlots(artworks, now = Date.now()) {
  const active = activeArtworks(artworks, now);
  return [...active, ...Array.from({ length: guestbookCapacity - active.length }, () => null)];
}

export function parseArtwork(issue) {
  if (
    issue.pull_request ||
    issue.state !== "open" ||
    issue.user?.type !== "User" ||
    !Number.isSafeInteger(issue.user?.id) ||
    !Number.isSafeInteger(issue.number) ||
    !issue.title?.startsWith("[Gallery] ")
  )
    return null;
  if (typeof issue.body !== "string" || issue.body.length > 2000) return null;
  const body = issue.body.replaceAll("\r\n", "\n").trim();
  if (!Number.isFinite(Date.parse(issue.created_at))) return null;
  const selected = /^### 소품\n\n([^\n]+)\n\n### 공개 안내\n\n- \[[xX]\] 선택한 소품이 공개 README에 표시되는 데 동의합니다\.?$/.exec(body);
  if (selected) {
    const asset = objectChoices.get(selected[1]);
    return asset ? { issue: issue.number, authorId: issue.user.id, asset, createdAt: issue.created_at } : null;
  }
  const match =
    /^### 도형\n\n([^\n]+)\n\n### 색상\n\n([^\n]+)\n\n### 공개 안내\n\n- \[[xX]\] 선택한 도형과 색상이 공개 README에 표시되는 데 동의합니다\.?$/.exec(
      body,
    );
  if (!match) return null;
  const shape = shapeChoices.get(match[1]);
  const color = colorChoices.get(match[2]);
  if (!shape || !color || !Number.isFinite(Date.parse(issue.created_at)))
    return null;
  return {
    issue: issue.number,
    authorId: issue.user.id,
    shape,
    color,
    asset: legacyObjectMap.get(shape),
    createdAt: issue.created_at,
  };
}

export function selectArtworks(issues, limit = guestbookCapacity, now = Date.now()) {
  if (!Number.isInteger(limit) || limit < 1 || limit > guestbookCapacity) throw new Error("Invalid guestbook capacity");
  const byAuthor = new Map();
  for (const artwork of issues
    .map(parseArtwork)
    .filter(Boolean)
    .sort((a, b) => a.issue - b.issue))
    byAuthor.set(artwork.authorId, artwork);
  return activeArtworks([...byAuthor.values()], now)
    .slice(0, limit)
    .reverse();
}

export function normalizeCalendar(weeks, limit = 26) {
  if (!Array.isArray(weeks) || !weeks.length)
    throw new Error("Contribution calendar is missing");
  return weeks.slice(-limit).map((week) => {
    if (
      !Array.isArray(week.contributionDays) ||
      week.contributionDays.length > 7
    )
      throw new Error("Invalid contribution week");
    return week.contributionDays.map((day) => {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        !Number.isSafeInteger(day.contributionCount) ||
        day.contributionCount < 0
      )
        throw new Error("Invalid contribution day");
      return { date: day.date, count: day.contributionCount };
    });
  });
}

export function validateData(data) {
  if (
    data.version !== 1 ||
    !Array.isArray(data.weeks) ||
    data.weeks.length > 26 ||
    !Array.isArray(data.artworks) ||
    data.artworks.length > guestbookCapacity
  )
    throw new Error("Invalid gallery data");
  for (const week of data.weeks)
    for (const day of week)
      if (!Number.isSafeInteger(day.count) || day.count < 0)
        throw new Error("Invalid contribution count");
  for (const item of data.artworks)
    if (
      (item.asset ? !objectIds.includes(item.asset) : (!shapes.includes(item.shape) || !Object.hasOwn(colors, item.color))) ||
      (item.shape !== undefined && (!shapes.includes(item.shape) || !Object.hasOwn(colors, item.color))) ||
      (item.source === "anonymous" ? (!anonymousIdPattern.test(item.id) || !objectIds.includes(item.asset) || item.issue !== undefined || item.authorId !== undefined) :
        (item.source !== undefined || !Number.isSafeInteger(item.issue) || !Number.isSafeInteger(item.authorId))) ||
      !Number.isFinite(Date.parse(item.createdAt))
    )
      throw new Error("Invalid artwork");
  return data;
}

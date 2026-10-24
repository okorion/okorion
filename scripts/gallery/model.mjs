export const variants = ["wall", "gallery", "island", "pavilion"];
export const styles = ["simple", "advanced"];
export const imageSize = (variant, mobile) =>
  mobile
    ? { width: 900, height: variant === "wall" ? 1400 : 900 }
    : { width: 1600, height: 700 };
export const stylesFor = (variant) =>
  variant === "pavilion" ? ["advanced"] : styles;
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
    createdAt: issue.created_at,
  };
}

export function selectArtworks(issues, limit = 9) {
  const byAuthor = new Map();
  for (const artwork of issues
    .map(parseArtwork)
    .filter(Boolean)
    .sort((a, b) => a.issue - b.issue))
    byAuthor.set(artwork.authorId, artwork);
  return [...byAuthor.values()]
    .sort((a, b) => b.issue - a.issue)
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
    data.artworks.length > 9
  )
    throw new Error("Invalid gallery data");
  for (const week of data.weeks)
    for (const day of week)
      if (!Number.isSafeInteger(day.count) || day.count < 0)
        throw new Error("Invalid contribution count");
  for (const item of data.artworks)
    if (
      !shapes.includes(item.shape) ||
      !Object.hasOwn(colors, item.color) ||
      !Number.isSafeInteger(item.issue) ||
      !Number.isSafeInteger(item.authorId)
    )
      throw new Error("Invalid artwork");
  return data;
}

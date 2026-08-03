import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const username = process.env.PROFILE_USERNAME
  ?? process.env.GITHUB_REPOSITORY?.split("/")[0]
  ?? "okorion";
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

if (!token) {
  throw new Error("GITHUB_TOKEN or GH_TOKEN is required");
}

const query = `
  query ProfileSignals($login: String!) {
    user(login: $login) {
      repositories(
        first: 100
        ownerAffiliations: OWNER
        privacy: PUBLIC
        isFork: false
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          name
          url
          updatedAt
          stargazerCount
          primaryLanguage { name color }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { contributionCount date }
          }
        }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": `${username}-profile-signal-generator`,
  },
  body: JSON.stringify({ query, variables: { login: username } }),
});

if (!response.ok) {
  throw new Error(`GitHub GraphQL request failed: ${response.status}`);
}

const payload = await response.json();
if (payload.errors?.length) {
  throw new Error(payload.errors.map((error) => error.message).join("; "));
}

const user = payload.data?.user;
if (!user) {
  throw new Error(`GitHub user not found: ${username}`);
}

const repositoryByName = new Map(
  user.repositories.nodes.map((repository) => [repository.name.toLowerCase(), repository]),
);

const featured = [
  { name: "localmesh-studio", label: "localmesh-studio", x: 86, y: 116, width: 190, accent: "cyan" },
  { name: "ChatGPT-Question-Navigator-Stable", label: "chatgpt-navigator", x: 292, y: 54, width: 190, accent: "blue" },
  { name: "vizport-studio", label: "vizport-studio", x: 318, y: 252, width: 164, accent: "blue" },
  { name: "mermaid-sky-exporter", label: "mermaid-sky-exporter", x: 744, y: 58, width: 214, accent: "violet" },
  { name: "codex-app-telegram-monitor", label: "codex-telegram-monitor", x: 926, y: 150, width: 222, accent: "amber" },
  { name: "self-improving-maintainer-bot", label: "maintainer-bot", x: 768, y: 264, width: 172, accent: "rose" },
].map((entry) => ({
  ...entry,
  repository: repositoryByName.get(entry.name.toLowerCase()),
}));

const calendar = user.contributionsCollection.contributionCalendar;
const weeks = calendar.weeks.slice(-26).map((week) =>
  week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
);
const maxWeek = Math.max(...weeks, 1);
const activeDays = calendar.weeks
  .flatMap((week) => week.contributionDays)
  .filter((day) => day.contributionCount > 0);
const latestContribution = activeDays.at(-1)?.date;
const latestRepositoryUpdate = user.repositories.nodes[0]?.updatedAt?.slice(0, 10);
const dataThrough = [latestContribution, latestRepositoryUpdate].filter(Boolean).sort().at(-1) ?? "—";

const themes = {
  light: {
    background: "#f8fafc",
    panel: "#ffffff",
    panelBorder: "#dbe4f0",
    grid: "#2563eb",
    text: "#0f172a",
    muted: "#64748b",
    line: "#94a3b8",
    center: "#1d4ed8",
    centerText: "#ffffff",
    bar: "#2563eb",
    accents: {
      blue: ["#dbeafe", "#2563eb"],
      cyan: ["#cffafe", "#0891b2"],
      violet: ["#ede9fe", "#7c3aed"],
      amber: ["#fef3c7", "#d97706"],
      rose: ["#ffe4e6", "#e11d48"],
    },
  },
  dark: {
    background: "#0b1120",
    panel: "#111827",
    panelBorder: "#293548",
    grid: "#60a5fa",
    text: "#f8fafc",
    muted: "#94a3b8",
    line: "#475569",
    center: "#2563eb",
    centerText: "#ffffff",
    bar: "#38bdf8",
    accents: {
      blue: ["#10264d", "#60a5fa"],
      cyan: ["#0b3038", "#22d3ee"],
      violet: ["#2b1d4c", "#a78bfa"],
      amber: ["#3b2a0d", "#fbbf24"],
      rose: ["#3d1822", "#fb7185"],
    },
  },
};

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

function connectionPath(entry) {
  const startX = 600;
  const startY = 178;
  const endX = entry.x + entry.width / 2;
  const endY = entry.y + 33;
  const controlX = (startX + endX) / 2;
  return `M${startX} ${startY} C${controlX} ${startY},${controlX} ${endY},${endX} ${endY}`;
}

function accentColors(theme, accentName) {
  switch (accentName) {
    case "cyan":
      return theme.accents.cyan;
    case "violet":
      return theme.accents.violet;
    case "amber":
      return theme.accents.amber;
    case "rose":
      return theme.accents.rose;
    default:
      return theme.accents.blue;
  }
}

function repositoryNode(entry, theme) {
  const repository = entry.repository;
  const [fill, accent] = accentColors(theme, entry.accent);
  const language = repository?.primaryLanguage?.name ?? "Public project";
  const updatedAt = repository?.updatedAt?.slice(0, 10) ?? "—";
  const stars = repository?.stargazerCount ? ` · ★ ${repository.stargazerCount}` : "";

  return `
    <g transform="translate(${entry.x} ${entry.y})">
      <rect width="${entry.width}" height="66" rx="15" fill="${fill}" stroke="${accent}" stroke-opacity=".55"/>
      <circle cx="18" cy="20" r="5" fill="${accent}" class="pulse"/>
      <text x="31" y="25" font-size="13" font-weight="700" fill="${theme.text}">${escapeXml(entry.label)}</text>
      <text x="16" y="47" font-size="10.5" fill="${theme.muted}">${escapeXml(language)}${escapeXml(stars)} · ${updatedAt}</text>
    </g>`;
}

function render(themeName) {
  const theme = themeName === "dark" ? themes.dark : themes.light;
  const connections = featured.map((entry) =>
    `<path d="${connectionPath(entry)}" fill="none" stroke="${theme.line}" stroke-width="1.4" stroke-dasharray="5 8" opacity=".65" class="flow"/>`,
  ).join("");
  const nodes = featured.map((entry) => repositoryNode(entry, theme)).join("");
  const bars = weeks.map((count, index) => {
    const height = Math.max(3, Math.round((count / maxWeek) * 46));
    const opacity = count === 0 ? 0.16 : 0.45 + (count / maxWeek) * 0.55;
    return `<rect x="${470 + index * 22}" y="${418 - height}" width="14" height="${height}" rx="4" fill="${theme.bar}" opacity="${opacity.toFixed(2)}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="450" viewBox="0 0 1200 450" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(username)} repository constellation</title>
  <desc id="desc">Selected public repositories connected to a recent contribution pulse</desc>
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${theme.grid}" stroke-opacity=".055"/></pattern>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="${theme.center}" flood-opacity=".4"/></filter>
    <style>text{font-family:Inter,Segoe UI,Arial,sans-serif}.flow{animation:flow 16s linear infinite}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 3s ease-in-out infinite}@keyframes flow{to{stroke-dashoffset:-130}}@keyframes pulse{0%,100%{opacity:.65}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.flow,.pulse{animation:none}}</style>
  </defs>
  <rect width="1200" height="450" rx="24" fill="${theme.background}"/>
  <rect width="1200" height="450" rx="24" fill="url(#grid)"/>
  <text x="40" y="39" font-size="12" font-weight="800" letter-spacing="2" fill="${theme.muted}">PUBLIC REPOSITORY CONSTELLATION</text>
  <text x="1160" y="39" text-anchor="end" font-size="11" fill="${theme.muted}">DATA THROUGH ${dataThrough}</text>
  ${connections}
  <g transform="translate(600 178)" filter="url(#glow)">
    <circle r="70" fill="${theme.panel}" stroke="${theme.center}" stroke-width="2"/>
    <circle r="55" fill="${theme.center}"/>
    <text y="-4" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="1.4" fill="${theme.centerText}">${escapeXml(username.toUpperCase())}</text>
    <text y="18" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1.1" fill="${theme.centerText}" opacity=".76">BUILD · RENDER · SHIP</text>
  </g>
  ${nodes.trimStart()}
  <g>
    <rect x="40" y="348" width="1120" height="78" rx="16" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
    <text x="64" y="378" font-size="11" font-weight="800" letter-spacing="1.7" fill="${theme.muted}">26-WEEK CONTRIBUTION PULSE</text>
    <text x="64" y="406" font-size="24" font-weight="800" fill="${theme.text}">${calendar.totalContributions}</text>
    <text x="125" y="405" font-size="11" fill="${theme.muted}">CONTRIBUTIONS / LAST YEAR</text>
    ${bars}
    <text x="1134" y="406" text-anchor="end" font-size="10.5" fill="${theme.muted}">RECENT →</text>
  </g>
</svg>\n`;
}

const outputDirectory = path.resolve("assets");
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, "lab-signal-light.svg"), render("light"), "utf8"),
  writeFile(path.join(outputDirectory, "lab-signal-dark.svg"), render("dark"), "utf8"),
]);

console.log(`Generated profile signals for ${username}`);

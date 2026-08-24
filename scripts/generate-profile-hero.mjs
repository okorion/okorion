import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const themes = {
  light: {
    backgroundStart: "#f8fbff",
    backgroundMiddle: "#f3f7ff",
    backgroundEnd: "#f8f5ff",
    grid: "#2563eb",
    text: "#0f172a",
    body: "#334155",
    muted: "#64748b",
    panel: "#ffffff",
    panelBorder: "#dbe4f0",
    chipBlue: "#eff6ff",
    chipBlueBorder: "#bfdbfe",
    chipBlueText: "#1d4ed8",
    chipCyan: "#ecfeff",
    chipCyanBorder: "#a5f3fc",
    chipCyanText: "#0e7490",
    chipViolet: "#f5f3ff",
    chipVioletBorder: "#ddd6fe",
    chipVioletText: "#6d28d9",
    shadow: "#1d4ed8",
  },
  dark: {
    backgroundStart: "#0b1120",
    backgroundMiddle: "#101827",
    backgroundEnd: "#17142b",
    grid: "#60a5fa",
    text: "#f8fafc",
    body: "#e2e8f0",
    muted: "#94a3b8",
    panel: "#111827",
    panelBorder: "#293548",
    chipBlue: "#102444",
    chipBlueBorder: "#1d4ed8",
    chipBlueText: "#93c5fd",
    chipCyan: "#0b2b34",
    chipCyanBorder: "#0e7490",
    chipCyanText: "#67e8f9",
    chipViolet: "#251b45",
    chipVioletBorder: "#6d28d9",
    chipVioletText: "#c4b5fd",
    shadow: "#60a5fa",
  },
};

function sharedDefinitions(theme, width, height) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.backgroundStart}"/>
      <stop offset="0.55" stop-color="${theme.backgroundMiddle}"/>
      <stop offset="1" stop-color="${theme.backgroundEnd}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="0.5" stop-color="#06b6d4"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="${theme.grid}" stroke-opacity=".08"/>
    </pattern>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="${theme.shadow}" flood-opacity=".13"/>
    </filter>
    <clipPath id="frame"><rect width="${width}" height="${height}" rx="28"/></clipPath>
    <style>text{font-family:Inter,Segoe UI,Arial,sans-serif}.flow{animation:flow 12s linear infinite}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 3.2s ease-in-out infinite}@keyframes flow{to{stroke-dashoffset:-120}}@keyframes pulse{0%,100%{opacity:.68}50%{opacity:1;transform:scale(1.16)}}@media(prefers-reduced-motion:reduce){.flow,.pulse{animation:none}}</style>
  </defs>`;
}

function desktopHero(themeName) {
  const theme = themes[themeName];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-labelledby="title desc">
  <title id="title">Hyounkyu Oh — Frontend / Application Engineer</title>
  <desc id="desc">Editor and Builder state connected through save, load, Runtime, and real-environment verification</desc>
  ${sharedDefinitions(theme, 1200, 360)}
  <g clip-path="url(#frame)">
    <rect width="1200" height="360" fill="url(#bg)"/>
    <rect width="1200" height="360" fill="url(#grid)"/>
    <circle cx="1120" cy="-40" r="220" fill="#8b5cf6" opacity=".055"/>
    <circle cx="905" cy="410" r="250" fill="#06b6d4" opacity=".055"/>
    <path d="M0 322C235 264 389 378 635 310s360-96 565-31" fill="none" stroke="url(#accent)" stroke-width="2" opacity=".18"/>
    <g transform="translate(72 58)">
      <rect width="270" height="32" rx="16" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
      <circle cx="17" cy="16" r="4" fill="#10b981" class="pulse"/>
      <text x="31" y="21" font-size="12" font-weight="700" letter-spacing="1.7" fill="${theme.muted}">OKORION / PRODUCT DELIVERY</text>
      <text x="0" y="109" font-size="54" font-weight="800" letter-spacing="-2" fill="${theme.text}">HYOUNKYU OH</text>
      <rect x="0" y="129" width="430" height="5" rx="2.5" fill="url(#accent)"/>
      <text x="0" y="174" font-size="24" font-weight="650" fill="${theme.body}">Frontend / Application Engineer</text>
      <text x="0" y="207" font-size="15" fill="${theme.muted}">Editor · Builder · Runtime Integration</text>
      <g transform="translate(0 235)">
        <g><rect width="112" height="34" rx="17" fill="${theme.chipBlue}" stroke="${theme.chipBlueBorder}"/><text x="56" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="${theme.chipBlueText}">STATE FLOW</text></g>
        <g transform="translate(124)"><rect width="112" height="34" rx="17" fill="${theme.chipCyan}" stroke="${theme.chipCyanBorder}"/><text x="56" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="${theme.chipCyanText}">SAVE / LOAD</text></g>
        <g transform="translate(248)"><rect width="122" height="34" rx="17" fill="${theme.chipViolet}" stroke="${theme.chipVioletBorder}"/><text x="61" y="22" text-anchor="middle" font-size="11" font-weight="700" fill="${theme.chipVioletText}">FIELD CHECK</text></g>
      </g>
    </g>
    <g transform="translate(690 56)" filter="url(#shadow)">
      <rect width="438" height="248" rx="24" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
      <text x="24" y="34" font-size="11" font-weight="800" letter-spacing="1.6" fill="${theme.muted}">EDITOR · BUILDER · RUNTIME</text>
      <circle cx="397" cy="28" r="5" fill="#10b981" class="pulse"/>
      <g transform="translate(24 58)">
        <g><rect width="104" height="70" rx="14" fill="${theme.chipBlue}" stroke="${theme.chipBlueBorder}"/><text x="52" y="31" text-anchor="middle" font-size="11" font-weight="800" fill="${theme.chipBlueText}">EDITOR</text><text x="52" y="50" text-anchor="middle" font-size="9.5" fill="${theme.muted}">USER ACTION</text></g>
        <path d="M112 35h32" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 5" class="flow"/><path d="m139 30 7 5-7 5" fill="none" stroke="#2563eb" stroke-width="2"/>
        <g transform="translate(154)"><rect width="104" height="70" rx="14" fill="${theme.chipCyan}" stroke="${theme.chipCyanBorder}"/><text x="52" y="31" text-anchor="middle" font-size="11" font-weight="800" fill="${theme.chipCyanText}">STATE</text><text x="52" y="50" text-anchor="middle" font-size="9.5" fill="${theme.muted}">SAVE / LOAD</text></g>
        <path d="M266 35h32" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="4 5" class="flow"/><path d="m293 30 7 5-7 5" fill="none" stroke="#06b6d4" stroke-width="2"/>
        <g transform="translate(308)"><rect width="82" height="70" rx="14" fill="${theme.chipViolet}" stroke="${theme.chipVioletBorder}"/><text x="41" y="31" text-anchor="middle" font-size="11" font-weight="800" fill="${theme.chipVioletText}">RUNTIME</text><text x="41" y="50" text-anchor="middle" font-size="9.5" fill="${theme.muted}">EXECUTE</text></g>
      </g>
      <g transform="translate(24 151)">
        <rect width="390" height="70" rx="16" fill="${theme.backgroundMiddle}" stroke="${theme.panelBorder}"/>
        <text x="18" y="26" font-size="10" font-weight="800" letter-spacing="1.4" fill="${theme.muted}">REAL-ENVIRONMENT VERIFICATION</text>
        <g transform="translate(18 38)" font-size="10.5" font-weight="700" fill="${theme.body}">
          <text>DEVICE</text><circle cx="71" cy="-4" r="3" fill="#2563eb"/><text x="85">FIELD</text><circle cx="136" cy="-4" r="3" fill="#06b6d4"/><text x="150">OPERATIONS</text><circle cx="235" cy="-4" r="3" fill="#8b5cf6"/><text x="249">SERVER</text>
        </g>
      </g>
    </g>
  </g>
</svg>\n`;
}

function mobileHero(themeName) {
  const theme = themes[themeName];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420" role="img" aria-labelledby="title desc">
  <title id="title">Hyounkyu Oh — Frontend / Application Engineer</title>
  <desc id="desc">Editor and Builder state connected through save, load, Runtime, and real-environment verification</desc>
  ${sharedDefinitions(theme, 720, 420)}
  <g clip-path="url(#frame)">
    <rect width="720" height="420" fill="url(#bg)"/><rect width="720" height="420" fill="url(#grid)"/>
    <circle cx="690" cy="35" r="180" fill="#8b5cf6" opacity=".07"/><circle cx="620" cy="410" r="210" fill="#06b6d4" opacity=".07"/>
    <path d="M0 374c142-53 228 27 371-22 124-42 223-80 349-51" fill="none" stroke="url(#accent)" stroke-width="2" opacity=".25"/>
    <g transform="translate(38 34)">
      <rect width="270" height="34" rx="17" fill="${theme.panel}" stroke="${theme.panelBorder}"/><circle cx="18" cy="17" r="4" fill="#10b981" class="pulse"/>
      <text x="32" y="22" font-size="12" font-weight="700" letter-spacing="1.7" fill="${theme.muted}">OKORION / PRODUCT DELIVERY</text>
      <text y="109" font-size="50" font-weight="800" letter-spacing="-1.8" fill="${theme.text}">HYOUNKYU OH</text>
      <rect y="128" width="385" height="5" rx="2.5" fill="url(#accent)"/>
      <text y="176" font-size="24" font-weight="650" fill="${theme.body}">Frontend / Application</text>
      <text y="208" font-size="24" font-weight="650" fill="${theme.body}">Engineer</text>
      <text y="239" font-size="14" fill="${theme.muted}">Editor · Builder · Runtime Integration</text>
      <g transform="translate(0 270)" filter="url(#shadow)">
        <rect width="644" height="108" rx="20" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
        <text x="20" y="28" font-size="10" font-weight="800" letter-spacing="1.4" fill="${theme.muted}">PRODUCT FLOW</text>
        <g transform="translate(20 45)" font-size="10.5" font-weight="800">
          <g><rect width="112" height="42" rx="12" fill="${theme.chipBlue}" stroke="${theme.chipBlueBorder}"/><text x="56" y="26" text-anchor="middle" fill="${theme.chipBlueText}">EDITOR</text></g>
          <path d="M120 21h24" stroke="#2563eb" stroke-width="2" stroke-dasharray="4 5" class="flow"/>
          <g transform="translate(152)"><rect width="112" height="42" rx="12" fill="${theme.chipCyan}" stroke="${theme.chipCyanBorder}"/><text x="56" y="26" text-anchor="middle" fill="${theme.chipCyanText}">SAVE / LOAD</text></g>
          <path d="M272 21h24" stroke="#06b6d4" stroke-width="2" stroke-dasharray="4 5" class="flow"/>
          <g transform="translate(304)"><rect width="112" height="42" rx="12" fill="${theme.chipViolet}" stroke="${theme.chipVioletBorder}"/><text x="56" y="26" text-anchor="middle" fill="${theme.chipVioletText}">RUNTIME</text></g>
          <path d="M424 21h24" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="4 5" class="flow"/>
          <g transform="translate(456)"><rect width="148" height="42" rx="12" fill="${theme.backgroundMiddle}" stroke="${theme.panelBorder}"/><text x="74" y="26" text-anchor="middle" fill="${theme.body}">DEVICE · FIELD</text></g>
        </g>
      </g>
    </g>
  </g>
</svg>\n`;
}

const outputDirectory = path.resolve("assets");
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, "hero-light.svg"), desktopHero("light"), "utf8"),
  writeFile(path.join(outputDirectory, "hero-dark.svg"), desktopHero("dark"), "utf8"),
  writeFile(path.join(outputDirectory, "hero-mobile-light.svg"), mobileHero("light"), "utf8"),
  writeFile(path.join(outputDirectory, "hero-mobile-dark.svg"), mobileHero("dark"), "utf8"),
]);

console.log("Generated profile hero assets");

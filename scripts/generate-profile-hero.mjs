import { mkdir, writeFile } from "node:fs/promises";

const themes = {
  light: {
    background: "#ffffff", panel: "#f4f5f7", border: "#e1e4e9",
    text: "#17212d", muted: "#526070", accent: "#3156d3", tint: "#e9eeff",
  },
  dark: {
    background: "#11151d", panel: "#1c2330", border: "#333d4e",
    text: "#f5f7fb", muted: "#b6c0cf", accent: "#a2b6ff", tint: "#253257",
  },
};

function hero(themeName, mobile) {
  const theme = themes[themeName];
  if (!theme) throw new Error(`Unsupported profile hero theme (${themeName})`);
  const width = mobile ? 720 : 1200;
  const height = mobile ? 400 : 320;
  const left = mobile ? 40 : 56;
  const roleX = mobile ? 40 : 700;
  const roleY = mobile ? 242 : 56;
  const roleWidth = mobile ? 640 : 444;
  const roleHeight = mobile ? 118 : 208;
  const roleTextY = mobile ? [35, 66, 96] : [44, 91, 161];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">오현규 — AI-native 개인 프로젝트</title>
  <desc id="desc">개인 프로젝트 제작에서 방향, UI·UX, 프롬프트와 결과 피드백은 사용자. 코드 구현과 내부 구조 설계는 AI.</desc>
  <style>text{font-family:"Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif}</style>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="24" fill="${theme.background}" stroke="${theme.border}"/>
  <rect x="${left}" y="40" width="228" height="32" rx="16" fill="${theme.tint}"/>
  <text x="${left + 16}" y="62" font-size="17" font-weight="700" letter-spacing="1" fill="${theme.accent}">AI-NATIVE PROJECTS</text>
  <text x="${left}" y="${mobile ? 137 : 148}" font-size="${mobile ? 48 : 56}" font-weight="800" letter-spacing="-2" fill="${theme.text}">오현규 <tspan font-size="${mobile ? 30 : 34}" font-weight="500" letter-spacing="0" fill="${theme.muted}">/ okorion</tspan></text>
  <text x="${left}" y="${mobile ? 185 : 201}" font-size="${mobile ? 25 : 27}" fill="${theme.text}">결과를 보며 사용 흐름을 다듬습니다</text>
  ${mobile ? "" : `<text x="${left}" y="246" font-size="20" fill="${theme.muted}">편집 도구 · 업무 흐름 · 시각 실험</text>`}
  <g transform="translate(${roleX} ${roleY})">
    <text x="0" y="-14" font-size="18" font-weight="700" fill="${theme.muted}">개인 프로젝트 제작 역할</text>
    <rect width="${roleWidth}" height="${roleHeight}" rx="18" fill="${theme.panel}"/>
    <text x="24" y="${roleTextY[0]}" font-size="${mobile ? 21 : 20}" font-weight="700" fill="${theme.accent}">내 역할</text>
    <text x="${mobile ? 119 : 24}" y="${mobile ? roleTextY[0] : roleTextY[1]}" font-size="${mobile ? 21 : 24}" fill="${theme.text}">방향 · UI/UX · 프롬프트 · 피드백</text>
    ${mobile ? "" : `<path d="M24 118H420" stroke="${theme.border}"/>`}
    <text x="24" y="${mobile ? roleTextY[1] : roleTextY[2]}" font-size="${mobile ? 21 : 20}" font-weight="700" fill="${theme.muted}">AI 역할</text>
    <text x="${mobile ? 119 : 118}" y="${mobile ? roleTextY[1] : roleTextY[2]}" font-size="${mobile ? 21 : 20}" fill="${theme.text}">코드 구현 · 내부 구조 설계</text>
    ${mobile ? `<text x="24" y="${roleTextY[2]}" font-size="18" fill="${theme.muted}">편집 도구 · 업무 흐름 · 시각 실험</text>` : ""}
  </g>
</svg>\n`.replace(/^[ \t]+$/gmu, "");
}

const outputDirectory = new URL("../assets/", import.meta.url);
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(new URL("hero-light.svg", outputDirectory), hero("light", false), "utf8"),
  writeFile(new URL("hero-dark.svg", outputDirectory), hero("dark", false), "utf8"),
  writeFile(new URL("hero-mobile-light.svg", outputDirectory), hero("light", true), "utf8"),
  writeFile(new URL("hero-mobile-dark.svg", outputDirectory), hero("dark", true), "utf8"),
]);
console.log("Generated four AI-native project hero assets.");

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="./assets/hero-mobile-dark.svg" />
  <source media="(prefers-color-scheme: light) and (max-width: 600px)" srcset="./assets/hero-mobile-light.svg" />
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-light.svg" />
  <img alt="Hyounkyu Oh — Local-first AI, visual systems, and developer automation" src="./assets/hero-light.svg" width="100%" />
</picture>

<p align="center">
  <strong>브라우저 안에서 생각하고, 그리며, 협업하는 도구를 만듭니다.</strong><br />
  Local-first AI · Visual Computing · Developer Automation
</p>

<p align="center">
  <a href="#selected-work">Selected Work</a> ·
  <a href="#signals-from-the-lab">Lab Signals</a> ·
  <a href="https://okorion.github.io">Blog</a>
</p>

## About

사용자 가까이에서 동작하는 소프트웨어를 좋아합니다. 브라우저의 GPU에서 실행되는 로컬 AI부터 실시간 협업 3D 편집기, 데이터 시각화 도구, 개인 개발 자동화까지 아이디어를 실제로 사용할 수 있는 제품으로 만듭니다.

I build tools that keep data close to the user, make complex systems visible, and automate repetitive work without removing human judgment.

## Selected Work

### 01 — [LocalMesh Studio](https://github.com/okorion/localmesh-studio)

**Local AI meets collaborative 3D editing.** 브라우저에서 3D 장면을 편집하고, 로컬 LLM에게 자연어로 오브젝트 생성을 요청하며, 하나의 Yjs 문서를 여러 사용자와 동기화하는 로컬 우선 에디터입니다.

[![LocalMesh Studio — Local AI, WebGPU, and Yjs](https://raw.githubusercontent.com/okorion/localmesh-studio/main/public/og.png)](https://localmesh-studio.okorion.chatgpt.site)

`Three.js` · `WebGPU` · `WebLLM` · `Yjs` · `Hocuspocus` · `IndexedDB`

[Live demo](https://localmesh-studio.okorion.chatgpt.site) · [Source](https://github.com/okorion/localmesh-studio)

### 02 — [VizPort Studio](https://github.com/okorion/vizport-studio)

**From raw data to explainable visualization and portable code.** CSV·JSON을 브라우저에서 분석하고 적합한 차트를 추천한 뒤 React 코드, LLM 프롬프트, VizSpec으로 가져갈 수 있는 시각화 스튜디오입니다.

[![VizPort Studio — data to visualization and code](https://raw.githubusercontent.com/okorion/vizport-studio/main/public/og.png)](https://vizport-studio.okorion.chatgpt.site)

`React` · `TypeScript` · `ECharts` · `Local-first` · `WebLLM`

[Live demo](https://vizport-studio.okorion.chatgpt.site) · [Source](https://github.com/okorion/vizport-studio) · [Architecture](https://github.com/okorion/vizport-studio/blob/main/ARCHITECTURE.md)

### More from the lab

- [**Mermaid Sky Exporter**](https://github.com/okorion/mermaid-sky-exporter) — Mermaid 작성, 공유, SVG·PNG·JPG 내보내기를 연결한 PWA<br />
  `Next.js` · `Mermaid` · `Monaco`
- [**Codex App Telegram Monitor**](https://github.com/okorion/codex-app-telegram-monitor) — Telegram을 통한 Windows Codex App 상태 점검과 원격 자동화<br />
  `PowerShell` · `Telegram API`
- [**Self-Improving Maintainer Bot**](https://github.com/okorion/self-improving-maintainer-bot) — 실패 사례를 eval로 축적하고 검증된 개선 PR을 제안하는 루프<br />
  `Python` · `GitHub Actions` · `Codex`

## Signals from the lab

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/lab-signal-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/lab-signal-light.svg" />
  <img alt="Repository constellation and recent contribution pulse" src="./assets/lab-signal-light.svg" width="100%" />
</picture>

<sub>주요 공개 저장소와 최근 기여 활동을 이 저장소의 GitHub Actions가 직접 SVG로 생성합니다. 외부 통계 카드 서비스에 의존하지 않습니다.</sub>

## Toolbox

`React` · `TypeScript` · `Next.js` · `Three.js` · `WebGPU` · `WebLLM` · `Yjs` · `ECharts` · `Python` · `PowerShell` · `GitHub Actions`

## Principles

- **Local-first by default** — 데이터와 실행을 가능한 한 사용자 가까이에 둡니다.
- **Make systems visible** — 복잡한 흐름을 시각화하고 설명 가능한 구조로 만듭니다.
- **Automate with review gates** — 반복 작업은 자동화하되 중요한 결정에는 사람의 판단을 남깁니다.

---

<p align="center">
  <a href="https://github.com/okorion?tab=repositories">Repositories</a> ·
  <a href="https://okorion.github.io">Tech Blog</a>
</p>

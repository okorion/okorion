<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="./assets/hero-mobile-dark.svg" />
  <source media="(prefers-color-scheme: light) and (max-width: 600px)" srcset="./assets/hero-mobile-light.svg" />
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-light.svg" />
  <img alt="Hyounkyu Oh — Frontend / Application Engineer" src="./assets/hero-light.svg" width="100%" />
</picture>

<p align="center">
  <strong>Editor·Builder의 편집 상태를 저장하고 불러온 뒤 Runtime·서버까지 일관되게 연결합니다.</strong><br />
  Frontend / Application Engineer · React · TypeScript · Three.js
</p>

<p align="center">
  <a href="https://okorion.github.io/">Portfolio</a> ·
  <a href="#selected-work">Selected Work</a> ·
  <a href="https://okorion.github.io/?view=3d">3D View</a> ·
  <a href="https://velog.io/@okorion">Technical Writing</a>
</p>

## About

React·TypeScript·Three.js 기반의 2D·3D Editor·Builder와 지도 제품을 개발해 왔습니다. 편집 상태와 command·event, 저장 모델, Runtime 실행의 의미를 맞추고 모바일·현장·운영 환경에서 실제 동작을 검증합니다.

공개 저장소에서는 다이어그램 내보내기, 개발 자동화와 운영 보조 도구를 만들며 문제 해결 과정과 검증 경계를 함께 기록합니다.

## Selected Work

### 01 — [Mermaid Sky Exporter](https://github.com/okorion/mermaid-sky-exporter)

Mermaid 작성, 공유, SVG·PNG·JPG 내보내기를 연결한 PWA입니다.

`Next.js` · `Mermaid` · `Monaco`

### 02 — [Codex App Telegram Monitor](https://github.com/okorion/codex-app-telegram-monitor)

Telegram을 통한 Windows Codex App 상태 점검과 원격 자동화 도구입니다.

`PowerShell` · `Telegram API`

### 03 — [Self-Improving Maintainer Bot](https://github.com/okorion/self-improving-maintainer-bot)

실패 사례를 eval로 축적하고 검증된 개선 PR을 제안하는 루프입니다.

`Python` · `GitHub Actions` · `Codex`

## Technical Writing

트러블슈팅, 직접 구현, 기술 선택 기준이 드러나는 글 세 편을 선별했습니다.

- **Troubleshooting** — [PWA 서비스워커가 MyHits 조회수 배지를 캐시한 문제 해결기](https://velog.io/@okorion/PWA-서비스워커가-MyHits-조회수-배지를-캐시한-문제-해결기-rfvfju0v)  
  기존 브라우저와 시크릿 모드를 비교해 오래된 조회수의 원인을 서비스워커 캐시로 좁힌 기록
- **Implementation** — [🌆 GitHub.io 페이지 제작기 (2) - Points 컨셉의 3D Web 구현](https://velog.io/@okorion/GitHub.io-페이지-제작기-2-Points-web)  
  Points 기반 시각 효과와 카메라 인터랙션, 당시 확인한 절두체 컬링 이슈의 구현 기록
- **Architecture Decision** — [URL 기반 다이어그램 공유 설계 및 구현 (완전 클라이언트 방식)](https://velog.io/@okorion/URL-기반-다이어그램-공유-설계-및-구현완전-클라이언트-방식)  
  서버 저장소 없이 JSON 직렬화와 LZ-String 압축·복원으로 공유 URL을 설계하고, 버전 호환성·URL 길이·민감 정보 노출 한계를 정리한 기록

[All posts on Velog](https://velog.io/@okorion)

## Signals from public work

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/lab-signal-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/lab-signal-light.svg" />
  <img alt="Repository constellation and recent contribution pulse" src="./assets/lab-signal-light.svg" width="100%" />
</picture>

<sub>선별한 공개 저장소와 최근 기여 활동을 이 저장소의 GitHub Actions가 직접 SVG로 생성합니다. 외부 통계 카드 서비스에 의존하지 않습니다.</sub>

## Core & Practice

**Core** — `TypeScript` · `React` · `MobX` · `Three.js` · `Web Editor / Builder` · `Runtime Integration`

**Practice** — `Next.js` · `Mermaid` · `GitHub Actions` · `Developer Automation`

## Principles

- **Align state meaning first** — 화면, 저장 모델, Runtime과 서버가 같은 사용자 의도를 가리키게 합니다.
- **Verify in the real environment** — 저장과 불러오기, 모바일·현장·운영 환경에서 실제 동작을 확인합니다.
- **Keep judgment visible** — 자동화와 AI에는 검증 가능한 경계와 사람의 승인 지점을 남깁니다.

---

<p align="center">
  <a href="https://okorion.github.io/">Portfolio</a> ·
  <a href="https://github.com/okorion?tab=repositories">Repositories</a> ·
  <a href="https://velog.io/@okorion">Technical Writing</a> ·
  <a href="https://okorion.github.io/tech-blog/">Learning Archive — 이전 강의 및 기술 학습 기록</a>
</p>

# 프로젝트와 소품 방명록

README는 프로젝트와 **소품으로 인사 남기기** 두 영역으로 구성합니다. 작은 제목과 얇은 구분선, 유리 진열장 6칸을 사용합니다. GitHub 활동 달력은 표시하거나 수집하지 않습니다.

프로젝트 이미지는 [공개 사이트](https://okorion.github.io/)를 바탕으로 소개 문장·프로젝트 설명·이미지 캡션을 숨긴 README용 화면입니다. 프로젝트 이름·썸네일·링크를 중심으로 데스크톱과 모바일 화면을 각각 캡처하고 라이트·다크 이미지를 만듭니다. 이미지를 누르면 프로젝트 사이트로 이동합니다.

## 소품으로 인사 남기기

[익명 등록 페이지](https://okorion-guestbook.ok-or-orion.workers.dev/)에서 소품 하나를 고르고 공개 안내에 동의합니다. 이름·이메일·GitHub 계정 입력 없이 참여할 수 있습니다. Turnstile로 도배 방지 확인을 하고, 서명된 브라우저 쿠키로 같은 브라우저의 최근 인사 하나를 관리합니다. 선택 중인 소품은 브라우저에 보관하며 등록 실패 시 유지합니다.

서버가 등록 시각을 기록하고 72시간 뒤를 표시 종료 시각으로 정합니다. 공개 데이터에는 임의의 인사 ID·소품·작성 시각·종료 시각만 포함합니다. 브라우저 등록 식별자는 공개하지 않습니다. 조회 시 만료된 인사를 제외하고 매시 17분의 서버 예약 작업으로 만료 행을 삭제합니다. 익명 인사는 다른 브라우저를 같은 사람으로 판별하지 않습니다.

[GitHub 참여 폼](https://github.com/okorion/okorion/issues/new?template=gallery.yml)도 유지합니다. 이 방식에는 GitHub 로그인이 필요하며 이슈에서 작성자 계정이 공개됩니다. 두 경로의 인사를 작성 시각으로 합쳐 최근 6개를 표시합니다. 사용자의 이름·아바타·자유 텍스트는 README에 표시하지 않습니다.

선택 가능한 소품은 9종이며, 진열장은 6칸입니다. 최근 3일 이내의 인사를 최대 6개까지 표시하고 나머지 진열장은 비워 둡니다. 같은 소품을 고른 인사도 각각 한 칸을 사용합니다. 각 소품 아래에 작성·표시 종료 시각을 한국 시간(KST)으로 적습니다. 이미지 아래에는 익명 등록·GitHub 등록·출처 안내 링크를 한 줄에 배치합니다.

계정마다 가장 최근의 열린 참여 이슈 하나를 반영합니다. 최초 작성 시각부터 72시간이 지나면 다음 자동 갱신에서 표시를 종료합니다. 이슈 수정으로 기간이 연장되지 않습니다. 이슈를 닫으면 다음 갱신에서 해당 참여를 제외하고, 더 오래된 열린 참여가 3일 이내이면 그 선택을 다시 반영합니다. 원본 이슈는 삭제하지 않습니다.

매시 13분·43분에 만료 여부를 다시 확인하므로, 72시간이 지난 소품은 다음 예약 실행과 이미지 캐시 갱신까지 남아 있을 수 있습니다. GitHub Actions 대기열에 따라 갱신이 늦어질 수 있습니다.

## 무료 외부 에셋

모든 소품은 Poly Haven이 CC0로 배포한 모델과 원본 재질을 사용합니다. [CC0 사용·수정·재배포 안내](https://polyhaven.com/license)를 확인했습니다. 모델은 생성 도구에서만 불러오고, README 방문자에게는 생성된 PNG 이미지만 전달합니다.

| 소품 | 원본 모델 | 제작자 |
| --- | --- | --- |
| 빈티지 카메라 | [Camera 01](https://polyhaven.com/a/Camera_01) | Rajil Jose Macatangay |
| 레트로 게임패드 | [Gamepad](https://polyhaven.com/a/gamepad) | Josh Dean |
| 러버덕 | [Rubber Duck Toy](https://polyhaven.com/a/rubber_duck_toy) | Plat251 |
| 붐박스 | [Boombox](https://polyhaven.com/a/boombox) | Thomas Paul Mouilleron |
| 회중시계 | [Pocket Watch](https://polyhaven.com/a/pocket_watch) | PierreB3D |
| 대리석 체스 | [Chess Set](https://polyhaven.com/a/chess_set) | Riley Queen |
| 목조 코끼리 | [Carved Wooden Elephant](https://polyhaven.com/a/carved_wooden_elephant) | Greg Zaal |
| 말 조각 | [Horse Head](https://polyhaven.com/a/horse_head) | Tina |
| 조개 | [Lambis Shell](https://polyhaven.com/a/lambis_shell) | Kuutti Siitonen |

확인일은 2026-10-25입니다. `assets/gallery/objects/sources.json`에 원본 주소, 제작자, 모델·재질 파일의 SHA-256과 출처를 보존합니다. 로컬에 저장한 glTF·1K 재질을 사용하므로 자동 갱신 중 외부 모델 다운로드가 필요하지 않습니다. 웹사이트 예시 렌더 이미지는 포함하지 않습니다.

## 기존 참여 기록

이전 도형·색상 폼으로 남긴 참여도 유지합니다. 원래 선택한 도형·색상과 이슈 정보는 데이터에 남기고, 현재 진열장에는 다음 소품으로 대응해 표시합니다. 새 소품을 직접 선택한 기록과 구분할 수 있도록 기존 선택 필드를 보존합니다. 원본 재질을 사용하므로 이전 색상으로 모델을 다시 칠하지 않습니다.

| 이전 도형 | 현재 표시 소품 |
| --- | --- |
| 구체 | 러버덕 |
| 큐브 | 레트로 게임패드 |
| 고리 | 조개 |
| 아치 | 말 조각 |
| 피라미드 | 대리석 체스 |

## 자동 갱신

- 참여 이슈 생성·수정·종료·재개·삭제 시 갱신합니다.
- 매시 13분·43분에 공개 프로젝트 사이트와 GitHub·익명 인사 데이터를 확인합니다. 변경이 없으면 이미지 생성을 건너뜁니다.
- 프로젝트 사이트 배포와 익명 등록은 다음 예약 확인에서 감지합니다. GitHub 대기열과 이미지 캐시에 따라 지연될 수 있습니다.
- 수동 실행의 `keep`은 현재 아카이브 디자인을 유지합니다.

실패하면 공개 이미지를 그대로 유지합니다. 생성 중 main이 바뀌면 게시를 중단하여 동시에 진행된 변경을 보호합니다. 워크플로는 기존 `GITHUB_TOKEN`의 contents 쓰기·issues 읽기 권한을 사용합니다. 참여 이슈의 댓글이나 상태를 자동으로 변경하지 않습니다.

## 생성과 검증

Node 22 이상과 lockfile의 Three.js 0.186.1·Playwright 1.64.1을 사용합니다. 새 런타임 의존성은 추가하지 않았습니다. Three.js의 GLTFLoader로 모델·PBR 재질을 불러오고, Playwright로 이미지를 생성합니다.

```sh
npm ci
npx playwright install --with-deps chromium
npm run gallery:collect
npm run gallery:render
npm run gallery:readme
npm test
npm run check:links
```

`gallery:collect`에는 GitHub 읽기 토큰이 필요합니다. 토큰은 이미지 생성 페이지에 전달하지 않습니다. 이미지를 생성하는 로컬 서버는 정해진 렌더러·폰트·화면 캡처·승인된 모델 파일만 제공합니다. 이슈 입력으로 모델 주소·파일 경로나 코드를 지정할 수 없습니다.

현재 README는 `archive-portfolio`와 `archive-guestbook` 각각의 데스크톱·모바일 및 라이트·다크 PNG 8개를 사용합니다. 이전 레이아웃 이미지는 과거 디자인 기록으로 보존합니다. 소품 선택·동의·계정별 최신 인사·기존 폼 호환성과 에셋 해시, 이미지 규격, README 링크를 검증합니다.

## 익명 등록 운영

`guestbook/`은 Workers·D1·Turnstile로 구성한 등록 페이지입니다. 런타임은 Workers 기본 API를 사용하고, 배포 도구는 Wrangler 4.152.0으로 고정합니다. 개발 도구의 undici는 보안 수정이 포함된 7.30.1로 고정했습니다. 확인일은 2026-10-25입니다. 모델 선택 이미지 9개는 위 CC0 모델을 원래 재질로 렌더링한 결과입니다.

```sh
npm ci --prefix guestbook
npm run check --prefix guestbook
npm run build --prefix guestbook
```

배포에는 기존 Cloudflare 인증과 해당 전용 DB가 필요합니다. `COOKIE_SECRET`, `TURNSTILE_SECRET_KEY`는 Worker secret으로만 저장하고 소스·공개 API·이미지 생성 브라우저에 전달하지 않습니다. 로컬 `.dev.vars`에는 공식 Turnstile 테스트 키만 사용하고 Git에 포함하지 않습니다. 실제 등록 페이지에는 테스트 키를 사용하지 않습니다. 저장 API는 소품 허용 목록·공개 동의·같은 출처·요청 크기·서명 쿠키·Turnstile·브라우저별 요청 빈도를 검사합니다. 같은 요청 ID의 재시도는 인사를 중복 생성하지 않습니다.

README는 일부 HTML을 지원하지만 CSS·JavaScript는 제거합니다. 사용자 조작 캐러셀이나 CSS 카드 스크롤은 별도 웹페이지에서 구현해야 합니다. [GitHub 렌더링 설명](https://github.com/github/markup#github-markup)을 참고합니다.

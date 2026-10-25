# 포트폴리오와 소품 방명록

README는 포트폴리오와 **소품으로 인사 남기기** 두 영역으로 구성합니다. 작은 제목과 얇은 구분선, 유리 진열장의 오브젝트 아카이브 디자인을 사용합니다. GitHub 활동 달력은 표시하거나 수집하지 않습니다.

포트폴리오 이미지는 [공개 사이트](https://okorion.github.io/)의 실제 화면입니다. 데스크톱과 모바일 화면을 각각 캡처하고 라이트·다크 이미지를 만듭니다. 이미지를 누르면 포트폴리오로 이동합니다.

## 소품으로 인사 남기기

[참여 폼](https://github.com/okorion/okorion/issues/new?template=gallery.yml)에서 소품 하나를 고르고 공개 안내에 동의합니다. GitHub 로그인이 필요합니다. 사용자의 이름·아바타·자유 텍스트는 README 이미지에 표시하지 않습니다.

진열장에는 선택 가능한 소품 9종을 항상 보여줍니다. `선택 가능`은 남겨진 인사가 없는 소품이고, `최근 인사 N`은 최근 참여자 9명 중 해당 소품을 선택한 인사 수입니다.

계정마다 가장 최근의 열린 참여 이슈 하나를 반영합니다. 이슈를 닫으면 다음 갱신에서 해당 참여를 제외하고, 더 오래된 열린 참여가 있으면 그 선택을 다시 반영합니다. 완전히 제외하려면 본인의 참여 이슈를 모두 닫습니다. 이미지 생성과 GitHub 이미지 캐시 때문에 반영에 시간이 걸릴 수 있습니다.

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
- 매시 13분·43분에 공개 포트폴리오와 참여 데이터를 확인합니다. 변경이 없으면 이미지 생성을 건너뜁니다.
- 포트폴리오 배포는 다음 예약 확인에서 감지합니다. GitHub 대기열과 이미지 캐시에 따라 지연될 수 있습니다.
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

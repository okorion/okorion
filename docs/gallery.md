# README 전시관

README에는 전시관 이미지와 포트폴리오·참여 링크를 표시합니다. 이미지를 누르면 [포트폴리오](https://okorion.github.io/)로 이동합니다.

## 디자인 교체

[Refresh portfolio gallery](https://github.com/okorion/okorion/actions/workflows/gallery.yml)에서 **Run workflow → variant → Run workflow**를 선택합니다. 선택한 구성이 `config/gallery.json`에 저장되고, 이후 자동 갱신에도 유지됩니다.

| 선택 | 구성 | 미리보기 |
| --- | --- | --- |
| `wall` · C 기본 | 한 벽에 실제 화면·활동 부조·방문자 선반 배치 | [C 이미지](../assets/gallery/wall-light.png) |
| `gallery` · A | 작은 전시실과 작품 받침대 | [A 이미지](../assets/gallery/gallery-light.png) |
| `island` · B | 활동량에 따라 높이가 달라지는 부유 섬 | [B 이미지](../assets/gallery/island-light.png) |
| `keep` | 현재 선택을 유지하며 내용만 갱신 | |

세 구성 모두 데스크톱·모바일, 라이트·다크 PNG를 함께 생성합니다. GitHub README는 `<picture>`로 화면 폭과 브라우저 색상 선호에 맞는 이미지를 선택합니다. GitHub 앱의 이미지 선택·캐시 동작은 앱에 따라 다를 수 있습니다.

로컬 교체는 `npm run gallery:readme -- wall`로 실행합니다. `gallery` 또는 `island`로 바꾸면 README와 설정만 교체하므로 이미지를 다시 렌더링하지 않아도 됩니다.

## 이미지에 들어가는 실제 데이터

- 중앙 화면: 공개 포트폴리오를 1184×760으로 열어 라이트·다크 화면을 캡처합니다. 원본 PNG와 주소·빌드 자산 경로·SHA-256은 `assets/gallery/portfolio.png`, `portfolio-dark.png`, `source.json`에 저장합니다.
- GitHub 활동: GraphQL 기여 달력의 최근 26주 집계입니다. 각 날짜의 활동량을 색과 높이로 표현하며, 저장소 이름이나 비공개 프로젝트 내용은 요청하지 않습니다.
- 방문자 작품: [오브젝트 남기기](https://github.com/okorion/okorion/issues/new?template=gallery.yml)에서 도형·색을 선택합니다. 열린 Issue 중 계정별 최신 1개, 전체 최신 9개를 전시합니다. 참여가 없으면 빈 전시 칸이 보입니다.

참여에는 GitHub 로그인이 필요합니다. Issue를 닫으면 다음 갱신에서 해당 작품을 제외합니다. 같은 계정의 더 오래된 열린 참여가 있으면 그 작품이 다시 선택됩니다. 완전히 제거하려면 해당 계정의 참여 Issue를 모두 닫습니다. 공개 Issue 번호와 계정 ID는 중복 참여 판별용 데이터에 들어갑니다. 작성자의 이름·자유 텍스트·외부 이미지·실행 코드는 그림에 반영하지 않습니다.

## 갱신 시점

- 참여 Issue의 생성·수정·종료·재개·삭제
- 매일 한국 시간 10:23, 22:23 예약 실행: GitHub 대기열에 따라 지연될 수 있습니다.
- 포트폴리오 배포: 소스 저장소의 배포 작업이 공개 사이트의 새 빌드 자산을 확인한 뒤 이 워크플로를 호출합니다.
- 수동 실행: `keep`은 현재 디자인을 유지합니다.

이미지 반영에는 Actions 실행 시간과 GitHub 이미지 캐시 시간이 필요합니다. 실패한 실행은 기존 공개 이미지를 유지합니다. 동시에 main이 바뀌면 게시를 중단하므로 최신 main에서 다시 실행하면 됩니다. 공개 저장소의 예약 워크플로는 60일간 저장소 활동이 없으면 GitHub가 비활성화할 수 있습니다.

## 구현과 운영

Node 22 이상에서 다음 순서로 생성합니다.

```sh
npm ci
npx playwright install --with-deps chromium
# Linux CI는 fonts-noto-cjk도 설치합니다.
# GITHUB_TOKEN은 실행 환경에 설정합니다. 파일에 저장하지 않습니다.
npm run gallery:collect
npm run gallery:render
npm run gallery:readme
npm test
```

`gallery:collect`만 GitHub 읽기 토큰을 사용하고, 캡처 브라우저에는 인증정보를 전달하지 않습니다. 배포된 공개 화면을 새 브라우저 컨텍스트에서 캡처합니다. 렌더러가 제공하는 로컬 파일은 고정된 허용 목록으로 제한합니다. Issue 입력은 정해진 선택지와 동의 문구가 정확히 일치할 때만 반영합니다.

Actions 게시 단계는 README·전시관 설정·생성된 이미지와 데이터만 Git Data API로 커밋합니다. 원격 main이 실행 시작 커밋과 같은지 확인하고, 강제 갱신 없이 반영합니다. 변경이 없으면 커밋하지 않습니다. 사용자 댓글·리뷰·Issue 상태를 자동으로 변경하지 않습니다.

`okorion.github.io-src`의 기존 `GH_PAGES_DEPLOY_TOKEN`으로 배포 후 `portfolio-deployed` 저장소 이벤트를 보냅니다. 이 이벤트 API는 프로필 저장소의 contents 쓰기 권한을 사용합니다. 프로필 워크플로 자체는 저장소의 기본 `GITHUB_TOKEN`을 사용하며, 권한은 contents 쓰기·issues 읽기입니다. Actions 로그에서 갱신 성공 여부를 확인할 수 있습니다.

## 도구 선택 근거 · 2026-10-23

| 대안 | 확인 버전·라이선스 | 판단 |
| --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 0.186.1 · MIT | 직교 카메라·조명·그림자·텍스처로 세 구성을 공유할 수 있어 채택 |
| [Playwright](https://playwright.dev/docs/screenshots) | 1.64.1 · Apache-2.0 | 실제 사이트 캡처와 WebGL 장면의 준비 완료 확인·PNG 출력을 함께 처리하므로 채택 |
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 9.32.0 · Apache-2.0 | 사용 가능한 3D 엔진이지만 현재 정적 전시 장면에 필요한 것보다 엔진 범위가 큼 |
| SVG·CSS만으로 직접 표현 | 브라우저 기본 기능 | 단순 도형에는 적합하지만 세 장면의 깊이·그림자·카메라를 직접 유지해야 하므로 제외 |

Three.js와 Playwright는 빌드 도구에만 추가했습니다. 방문자에게는 PNG만 전달합니다. 초기 설치 시 `npm audit`에서 알려진 취약점 0건을 확인했습니다. 이후 업그레이드에서는 카메라·그림자·폰트와 모바일 자산을 다시 확인합니다. 공식 문서는 Context7의 Three.js·Playwright 자료 및 각 공식 저장소·npm 패키지 정보를 대조했습니다.

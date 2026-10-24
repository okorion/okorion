# README 전시관

README에는 전시관 이미지와 포트폴리오·참여 링크를 표시합니다. 이미지를 누르면 [포트폴리오](https://okorion.github.io/)로 이동합니다.

기본 C Wall은 세로형입니다. 포트폴리오 화면, 활동 기록, 방문자 선반을 위에서 아래로 배치한 900×1400 이미지를 데스크톱과 모바일에 함께 표시합니다. GitHub 본문 폭 안에서 각 전시물이 차지하는 너비를 넓혔습니다. 라이트·다크 전환과 자동 갱신에도 이 배치를 유지합니다.

`config/gallery.json`의 `orientation`을 `landscape`로 바꾸고 `npm run gallery:readme`를 실행하면 데스크톱에서 기존 1600×700 가로형을 사용합니다. 모바일 C Wall은 세로형을 유지합니다. `orientation` 선택은 C Wall에 적용되며 A·B·D의 기존 배치는 유지합니다.

[일곱 조합 비교 보기](gallery-preview.md)

## 디자인 교체

[Refresh portfolio gallery](https://github.com/okorion/okorion/actions/workflows/gallery.yml)에서 **Run workflow → variant(배치)·style(마감) → Run workflow**를 선택합니다. 선택은 `config/gallery.json`에 저장되어 자동 갱신 후에도 유지됩니다. `keep`은 현재 선택을 유지합니다.

| 배치 | Simple | Advanced |
| --- | --- | --- |
| A · `gallery` | [작은 전시실과 작품 받침대](../assets/gallery/gallery-light.png) | [유리 프레임·금속 링·간접 조명](../assets/gallery/gallery-advanced-light.png) |
| B · `island` | [활동 지형을 담은 부유 섬](../assets/gallery/island-light.png) | [매끄러운 곡면·금속 테두리·푸른 조명](../assets/gallery/island-advanced-light.png) |
| C · `wall` · 기본 | [한 벽에 화면·활동·방문자 선반 배치](../assets/gallery/wall-light.png) | [유리 벽·금속 프레임·선반 조명](../assets/gallery/wall-advanced-light.png) |
| D · `pavilion` | — | [곡선 무대·유리 파티션·금속 큐브](../assets/gallery/pavilion-light.png) |

A·B·C 각각 Simple과 Advanced의 카메라와 전시물 위치는 같습니다. Advanced는 D 시안의 유리·금속·곡선·조명을 각 배치에 적용한 마감입니다. 바닥 화분은 모두 제거했습니다. D · `pavilion`은 곡선 무대·조형물·유리 파티션을 갖춘 별도 디자인으로 유지합니다. D는 Advanced 마감을 사용합니다. 현재 기본값은 C Simple입니다.

일곱 조합 모두 데스크톱·모바일, 라이트·다크 PNG를 생성합니다. GitHub README는 `<picture>`로 화면 폭과 브라우저 색상 선호에 맞는 이미지를 선택합니다. C Wall의 기본 세로형은 화면 폭과 관계없이 같은 세로 배치를 사용합니다. GitHub 앱의 이미지 선택·캐시 동작은 앱에 따라 다를 수 있습니다.

```sh
npm run gallery:readme -- gallery simple    # A Simple
npm run gallery:readme -- gallery advanced  # A Advanced
npm run gallery:readme -- island simple     # B Simple
npm run gallery:readme -- island advanced   # B Advanced
npm run gallery:readme -- wall simple       # C Simple
npm run gallery:readme -- wall advanced     # C Advanced
npm run gallery:readme -- pavilion advanced # D
```

로컬 교체는 README와 설정만 바꾸므로 이미지를 다시 렌더링하지 않아도 됩니다. GitHub에 반영하려면 변경을 게시하거나 위 Actions를 실행합니다.

이름표는 `okorion.github.io`만 표시합니다. `config/gallery.json`의 `showSectionLabels`를 `true`로 바꾸고 다시 렌더링하면 활동 기록·방문자 전시 이름표가 복원됩니다. 사이트와 전시관은 [Pretendard Variable 1.3.9](https://github.com/orioncactus/pretendard/releases/tag/v1.3.9) 원본을 직접 제공하며, `assets/fonts/OFL.txt`에 라이선스를 보존합니다. 캡처할 때 `document.fonts.load()` 이후 Chrome의 실제 글리프 렌더링 폰트도 확인합니다. 대체 글꼴이 감지되면 생성을 중단합니다. 확인한 폰트와 대상 요소는 `source.json`의 `typography`에 기록합니다.

## 이미지에 들어가는 실제 데이터

- 중앙 화면: 공개 포트폴리오를 1184×760으로 열어 라이트·다크 화면을 캡처합니다. 원본 PNG와 주소·빌드 자산 경로·SHA-256은 `assets/gallery/portfolio.png`, `portfolio-dark.png`, `source.json`에 저장합니다.
- GitHub 활동: GraphQL 기여 달력의 최근 26주 집계입니다. 각 날짜의 활동량을 색과 높이로 표현하며, 저장소 이름이나 비공개 프로젝트 내용은 요청하지 않습니다.
- 방문자 작품: [오브젝트 남기기](https://github.com/okorion/okorion/issues/new?template=gallery.yml)에서 도형·색을 선택합니다. 열린 Issue 중 계정별 최신 1개, 전체 최신 9개를 전시합니다. 참여가 없으면 빈 전시 칸이 보입니다.

참여에는 GitHub 로그인이 필요합니다. Issue를 닫으면 다음 갱신에서 해당 작품을 제외합니다. 같은 계정의 더 오래된 열린 참여가 있으면 그 작품이 다시 선택됩니다. 완전히 제거하려면 해당 계정의 참여 Issue를 모두 닫습니다. 공개 Issue 번호와 계정 ID는 중복 참여 판별용 데이터에 들어갑니다. 작성자의 이름·자유 텍스트·외부 이미지·실행 코드는 그림에 반영하지 않습니다.

## 갱신 시점

- 참여 Issue의 생성·수정·종료·재개·삭제
- 매시 13분·43분: 공개 포트폴리오 HTML·빌드 자산과 GitHub 활동을 확인합니다. 사이트 또는 참여·활동 데이터가 달라졌을 때만 이미지를 생성합니다.
- 포트폴리오 배포: 공개 사이트에 새 빌드가 반영된 뒤 다음 예약 확인에서 갱신합니다. 기본 확인 간격은 30분이며 GitHub 대기열에 따라 지연될 수 있습니다.
- 수동 실행: `keep`은 현재 디자인을 유지합니다.

이미지 반영에는 Actions 실행 시간과 GitHub 이미지 캐시 시간이 필요합니다. 실패한 실행은 기존 공개 이미지를 유지합니다. 동시에 main이 바뀌면 게시를 중단하므로 최신 main에서 다시 실행하면 됩니다. [GitHub 예약 실행 정책](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)에 따라 공개 저장소의 활동이 60일간 없으면 예약이 비활성화될 수 있습니다.

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

프로필 워크플로는 저장소의 기본 `GITHUB_TOKEN`을 사용하며, 권한은 contents 쓰기·issues 읽기입니다. 배포 감지는 공개 사이트를 읽으므로 별도 비밀값이 필요하지 않습니다. Actions 로그에서 갱신 성공과 변경 없음에 따른 건너뛰기를 확인할 수 있습니다.

## 도구 선택 근거 · 2026-10-23

| 대안 | 확인 버전·라이선스 | 판단 |
| --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 0.186.1 · MIT | 직교 카메라·조명·그림자·텍스처로 세 구성을 공유할 수 있어 채택 |
| [Playwright](https://playwright.dev/docs/screenshots) | 1.64.1 · Apache-2.0 | 실제 사이트 캡처와 WebGL 장면의 준비 완료 확인·PNG 출력을 함께 처리하므로 채택 |
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | 9.32.0 · Apache-2.0 | 사용 가능한 3D 엔진이지만 현재 정적 전시 장면에 필요한 것보다 엔진 범위가 큼 |
| SVG·CSS만으로 직접 표현 | 브라우저 기본 기능 | 단순 도형에는 적합하지만 세 장면의 깊이·그림자·카메라를 직접 유지해야 하므로 제외 |

Three.js와 Playwright는 빌드 도구에만 추가했습니다. 방문자에게는 PNG만 전달합니다. 초기 설치 시 `npm audit`에서 알려진 취약점 0건을 확인했습니다. 이후 업그레이드에서는 카메라·그림자·폰트와 모바일 자산을 다시 확인합니다. 공식 문서는 Context7의 Three.js·Playwright 자료 및 각 공식 저장소·npm 패키지 정보를 대조했습니다.

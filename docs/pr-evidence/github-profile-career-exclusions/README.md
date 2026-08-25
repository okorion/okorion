# GitHub profile Career OS exclusion cleanup — visual evidence

이 디렉터리의 이미지는 **로컬 GitHub Markdown render이며 실제 GitHub profile 캡처가 아닙니다.** GitHub Markdown API로 `README.md`를 렌더링하고, 변경 전에는 `origin/main`의 SVG, 변경 후에는 작업 브랜치의 SVG를 같은 로컬 wrapper에 제공했습니다. 우측 상단 `BEFORE`/`AFTER` 배지는 비교 상태를 구분하기 위해 로컬 renderer가 추가한 표식입니다.

브라우저 DOM viewport는 모든 캡처에서 `1440×1000`, device pixel ratio는 `1`이었습니다. Hero는 wrapper offset `0`, Selected Work는 변경 전 `560px`·변경 후 `536px`의 로컬 wrapper offset을 적용해 두 화면의 section top을 모두 `120.09375px`로 맞췄습니다. 브라우저 캡처 결과는 `1440×1000` PNG로 인코딩 정규화했습니다.

| 대상 | 파일 | 상태 | 결과 파일 |
| --- | --- | --- | --- |
| Hero | `hero-before.png` / `hero-after.png` | DOM viewport `1440×1000`, wrapper offset `0` | PNG `1440×1000` |
| Selected Work | `selected-work-before.png` | DOM viewport `1440×1000`, wrapper offset `560px`, section top `120.09375px` | PNG `1440×1000` |
| Selected Work | `selected-work-after.png` | DOM viewport `1440×1000`, wrapper offset `536px`, section top `120.09375px` | PNG `1440×1000` |

Selected Work 비교는 변경으로 앞선 문단 높이가 달라져 offset이 24px 차이 나지만, 같은 viewport와 section top으로 정렬했습니다. 네 파일 모두 PNG signature `89504e470d0a1a0a`와 IHDR dimensions를 validator가 직접 확인합니다.

| 파일 | Content-Type | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `hero-before.png` | `image/png` | `1440×1000` | `c0d5f800162ee2ce152d9be336068560f149607c79878c3e21a19ee97192a74c` |
| `hero-after.png` | `image/png` | `1440×1000` | `915fb1ca6c49eccd7983d65138fd5e7402f52f04c6ea7b42210d5abb43b0eb8f` |
| `selected-work-before.png` | `image/png` | `1440×1000` | `91a89773837b0dda669702c7d40da9cae5b351bbd20c69698020a0e5a5c60c69` |
| `selected-work-after.png` | `image/png` | `1440×1000` | `7479b7388510a26bc70de11b4dd09b7a2bd5dcecd1d085a937b33ca54202db7f` |

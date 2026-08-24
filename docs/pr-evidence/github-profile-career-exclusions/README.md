# GitHub profile Career OS exclusion cleanup — visual evidence

이 디렉터리의 이미지는 **로컬 GitHub Markdown render이며 실제 GitHub profile 캡처가 아닙니다.** GitHub Markdown API로 `README.md`를 렌더링하고, 변경 전에는 `origin/main`의 SVG, 변경 후에는 작업 브랜치의 SVG를 같은 로컬 wrapper에 제공했습니다. 우측 상단 `BEFORE`/`AFTER` 배지는 비교 상태를 구분하기 위해 로컬 renderer가 추가한 표식입니다.

| 대상 | 파일 | 상태 | PNG |
| --- | --- | --- | --- |
| Hero | `hero-before.png` / `hero-after.png` | 1440×1000 DOM viewport, `scrollY=0` | 1425×990 |
| Selected Work | `selected-work-before.png` | 1440×1000 DOM viewport, section top `120.09375px`, `scrollY=560` | 1425×990 |
| Selected Work | `selected-work-after.png` | 1440×1000 DOM viewport, section top `120.09375px`, `scrollY=536` | 1425×990 |

Selected Work 비교는 변경으로 앞선 문단 높이가 달라져 절대 `scrollY`가 24px 차이 나지만, 같은 viewport와 section top으로 정렬했습니다.

| 파일 | SHA-256 |
| --- | --- |
| `hero-before.png` | `6982184a68361db87cac02fbba8b1f0cae49c6ca6e0fa06345d6bd6d6035b86b` |
| `hero-after.png` | `d07a0c05de8e5c798126e4f35bfa4cd0d1cbc93b0e869b64b00dc14612edda78` |
| `selected-work-before.png` | `616bb68f72e309b4ac7d4a22379d073874965944032444256ba6f3935bc2d8da` |
| `selected-work-after.png` | `e0ababe5ac93972fabd22cc8ce092e09dd23d0a667975ce9d6f370646bb7e146` |

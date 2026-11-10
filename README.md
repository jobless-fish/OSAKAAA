# OSAKAAA — 숙소 기준 오사카 맛집 지도

**바로 열기: https://jobless-fish.github.io/OSAKAAA/**

11/13(금)–11/17(화) 오사카 6인 여행용 웹앱입니다. 숙소(大阪市西成区旭2-2-18)를 중심으로,
인스타그램 [@aito_osaka](https://www.instagram.com/aito_osaka/)(ぼっちのあいと｜大阪ひとりグルメ)가 소개한 맛집 25곳을 지도와 카드 목록으로 보여 줍니다.

## 기능

- **지도 + 카드 목록**: 데스크톱은 왼쪽 목록·오른쪽 지도, 모바일은 전체 화면 지도 + 끌어올리는 바텀시트
- **마커**: 확대하면 흰 카드(이름·사진·별점), 축소하면 점 + 이름. 숙소는 검은 집 모양 핀
- 마커를 누르면 목록의 카드가, 카드를 누르면 지도 위치가 강조됩니다
- **필터**: 종류(식사/간식/술·바), 지역, 장르, 평점, 날짜(그날 영업하는 곳만), 6명 OK, 일행이 찾은 4곳
- **정렬**: 숙소에서 가까운 순 / 타베로그 점수 순 / 이름 순
- **여행 중 휴무 표시**: 11/13–17 중 정기휴무일이 있으면 빨간 배지
- 카드마다 타베로그 링크, 코스 링크(있는 곳), 소개 게시물 링크, 숙소에서 길찾기(구글 지도 대중교통)

## 데이터 (`src/data/restaurants.json`)

- 가게 정보(장르·예산·영업시간·예약·좌석)는 2026년 11월 9–10일 각 가게 타베로그 페이지에서 확인했습니다.
- **타베로그 점수는 페이지에 점수가 표시된 10곳만** 넣었고, 나머지는 '점수 미확인'으로 둡니다.
- 출처: 일행이 직접 찾은 4곳, aito_osaka 인스타 게시물 4곳(릴스·HAMONI·DocentPro), 같은 크리에이터의 Lemon8 계정 17곳.
- 좌표: 국토지리원(GSI) 주소 검색으로 번지까지 일치하는 결과를 사용했고, 테스트에서 지역 범위를 검사합니다. 숙소 좌표는 Nominatim 역지오코딩(旭二丁目, 西成区)으로 한 번 더 확인했습니다.
- 거리는 숙소에서의 직선거리이고, 도보 시간은 길이 1.3배 돌아간다고 보고 분속 80m로 계산한 **추정치**입니다.
- 사진은 저장소에 복사하지 않고 타베로그 대표 이미지(og:image)를 직접 불러오며, 실패하면 자리표시자를 보여 줍니다. 사진·점수의 저작권은 타베로그와 각 게시자에게 있습니다.
- 지도: © [OpenStreetMap](https://www.openstreetmap.org/copyright) 기여자, [Leaflet](https://leafletjs.com/).

## UI/UX 가이드

[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (★ 약 14.7만, 2026-11-10 기준)을 사용했습니다.
GitHub에서 UI/UX 전용 스킬 중 별이 가장 많은 저장소입니다(범용 스킬 모음 anthropics/skills는 제외).

- `--design-system "restaurant discovery map app"` 결과의 **Minimalism & Swiss** 스타일과 오렌지(브랜드) + 블루(지도·선택) 팔레트를 쓰되, 흰 글자 대비 4.5:1을 넘도록 오렌지를 `#C2410C`로 어둡게 조정
- 우선순위 1–5 규칙 적용: 대비·포커스 링·aria 레이블, 터치 영역 44px 이상(주요 버튼 48px), 이미지 지연 로딩, 모바일 우선, 확대 허용, safe-area 여백
- 드래그 전용 조작 금지 규칙에 따라 바텀시트 손잡이는 탭/키보드(Enter·화살표)로도 단계를 바꿀 수 있음
- 이모지 대신 SVG 아이콘, `prefers-reduced-motion` 존중
- 한글 표시를 위해 웹폰트 대신 시스템 한글 글꼴(Apple SD Gothic Neo / Noto Sans KR 등)을 사용

## 개발

```bash
npm ci
npm run dev      # 로컬 개발 서버
npm run lint     # oxlint
npm test         # vitest (거리 계산·데이터 검증)
npm run build    # dist/ 생성 (base: /OSAKAAA/)
```

`main`에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 빌드해 GitHub Pages에 배포합니다.

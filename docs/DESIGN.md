# DESIGN.md

## 1. Visual Theme & Atmosphere

Mail Agent의 UI는 `빠른 처리`, `높은 정보 밀도`, `차분한 신뢰감`을 목표로 한다.

전체 인상은 다음을 따른다.

- 메일함은 업무 도구처럼 보여야 한다.
- 화려한 마케팅 사이트보다 정돈된 작업 화면에 가깝다.
- 첫 인상은 가볍고 선명해야 하지만, 오래 써도 피로하지 않아야 한다.
- Notion처럼 정리된 느낌, Linear처럼 정교한 밀도, Superhuman처럼 빠른 처리 감각을 참고하되 그대로 복제하지 않는다.

핵심 무드:

- calm
- focused
- precise
- quietly premium
- keyboard-friendly

피해야 할 방향:

- 보라색 중심 SaaS 템플릿 느낌
- 과한 글래스모피즘
- 둥글기만 한 장난감 같은 UI
- 카드가 과도하게 많은 모바일 앱 스타일
- 메일 도구인데 대시보드처럼 지나치게 장식적인 구성

## 2. Product UX North Star

이 제품의 UX 핵심 흐름은 다음이다.

1. 메일을 빠르게 훑는다.
2. 지금 처리할지, 나중에 볼지 판단한다.
3. 답장, 보관, 삭제, Task 생성 같은 행동을 취한다.
4. 필요한 경우 Notion으로 연결한다.

모든 화면은 이 흐름을 더 빠르게 만드는 방향으로 설계한다.

중요 원칙:

- `읽기`보다 `판단`을 빠르게 해야 한다.
- `판단`보다 `처리`를 빠르게 해야 한다.
- 사용자는 메일을 "관리"하는 것이 아니라 "비우고 정리"하려고 들어온다.
- UI는 설명보다 상태와 행동을 먼저 보여줘야 한다.

## 3. Color Palette & Roles

기본 방향:

- 밝은 중성 배경 위에 깊은 잉크 계열 텍스트
- 액션 강조는 청록-블루 계열
- 위험/경고/성공 상태는 명확하지만 과장되지 않게

### Core Neutrals

- `--bg-app: #F5F7FA`
  앱 전체 배경
- `--bg-panel: #FFFFFF`
  메인 패널, 리스트, 카드
- `--bg-panel-muted: #F1F4F8`
  보조 패널, 필터 바, hover 약배경
- `--bg-hover: #EEF3F8`
  row hover
- `--bg-selected: #E8F1FF`
  선택된 메일, 활성 리스트 항목
- `--border-soft: #E2E8F0`
  기본 구분선
- `--border-strong: #CBD5E1`
  강조 경계선
- `--text-strong: #17212B`
  주요 텍스트
- `--text-primary: #273444`
  일반 텍스트
- `--text-secondary: #52606D`
  보조 텍스트
- `--text-muted: #7B8794`
  메타 정보

### Accent Colors

- `--accent-primary: #1D7AFC`
  주 액션, 링크, 활성 상태
- `--accent-primary-hover: #1664D8`
  주 액션 hover
- `--accent-soft: #D9E9FF`
  선택 배경, info tint
- `--accent-teal: #157A6E`
  완료, 연결됨, 안정 상태

### Semantic Colors

- `--success: #1F9D68`
  성공, synced, connected
- `--warning: #D9822B`
  주의, action needed, due soon
- `--danger: #D64545`
  삭제, 실패, 영구 액션
- `--info: #2D7FF9`
  정보성 알림, AI suggestion

### Mail-Specific Status Colors

- `--mail-unread-dot: #1D7AFC`
  unread 점 표시
- `--mail-reply-needed: #C96C1A`
  답장 필요
- `--mail-notion-linked: #157A6E`
  notion 연결됨
- `--mail-ai-highlight: #0F766E`
  AI가 주목한 요소

색상 사용 규칙:

- 한 화면에서 강한 포인트 컬러는 1개만 주도적으로 쓴다.
- unread, selected, primary action이 서로 구분되게 유지한다.
- 빨간색은 삭제/실패에만 제한적으로 쓴다.
- AI 관련 표시는 신뢰보다 "추천" 느낌이 나도록 과장하지 않는다.

## 4. Typography Rules

폰트 방향:

- 기본 UI 폰트는 현대적이고 읽기 쉬운 산세리프
- 코드, 메타, 라벨, shortcut은 모노스페이스 보조 사용
- 폰트 예시:
  - UI sans: `Geist`, `Inter`, `system-ui`, `sans-serif`
  - Mono: `JetBrains Mono`, `IBM Plex Mono`, `monospace`

### Type Scale

- `Display`: 32/40, 700
  설정/온보딩/빈 상태 핵심 헤드라인
- `H1`: 24/32, 700
  메인 페이지 제목
- `H2`: 20/28, 650
  패널 제목
- `H3`: 16/24, 650
  섹션 제목
- `Body L`: 15/24, 500
  일반 설명
- `Body M`: 14/22, 450
  리스트 주요 텍스트
- `Body S`: 13/20, 450
  메타, 설명, 보조 정보
- `Label`: 12/16, 600
  필터, 태그, 버튼 보조
- `Mono S`: 12/18, 500
  shortcut, IDs, provider 상태

타이포 규칙:

- 메일 제목은 본문보다 확실히 강해야 한다.
- 발신자와 제목은 시선 우선순위가 명확해야 한다.
- 메타 정보는 작되 충분히 읽혀야 한다.
- 지나치게 작은 11px 남발을 피한다.

## 5. Component Stylings

### 5.1 Shell

- 전체 앱은 `좌측 네비게이션 + 중앙 리스트 + 우측 상세/패널`의 3분할 구조를 기본으로 한다.
- 패널은 모두 같은 surface 계층을 공유한다.
- 각 영역은 둥글지만 과하게 말랑하지 않다.
- 권장 radius:
  - panel: `16px`
  - button/input: `10px`
  - chip: `999px`

### 5.2 Sidebar

- 진한 텍스트와 얇은 구분선 중심
- 활성 메뉴는 파란 tint 배경 + 선명한 텍스트
- 아이콘은 단색 라인 아이콘 우선
- 라벨 배지는 작고 기능적으로만 사용

### 5.3 Mail Row

메일 row는 다음 구조를 가진다.

- unread dot
- account badge
- sender
- subject
- snippet
- timestamp
- status chips

스타일 규칙:

- unread는 제목과 발신자 weight가 더 강하다.
- selected row는 배경만 바꾸고 border는 과하지 않게 한다.
- hover 시 즉시 클릭 가능해 보이도록 얕은 tint를 준다.
- 한 row 안에 색상이 너무 많아지지 않게 한다.

### 5.4 Mail Detail

- 헤더에는 제목, 발신자, 수신 계정, 시간, quick actions가 우선 노출된다.
- 본문은 읽기 영역으로 충분한 여백을 갖는다.
- 우측 패널 또는 상단 보조 패널에 AI / Notion / metadata를 배치한다.
- 액션 버튼은 메일 본문보다 먼저 눈에 들어와야 하지만, 본문을 압도하면 안 된다.

### 5.5 Buttons

버튼 종류:

- Primary
  - 파란 배경, 흰 텍스트
  - 주요 행동 1개에만 사용
- Secondary
  - 흰 배경, 중간 경계선
  - 대부분의 일반 액션
- Tertiary
  - 배경 없는 텍스트 버튼
  - 밀도 높은 툴바
- Danger
  - 연한 레드 tint 또는 얇은 red outline
  - 삭제류 액션

버튼 규칙:

- 한 영역에 Primary 버튼은 1개 이하
- 메일 상세 quick action은 Secondary/Tertiary 위주
- destructive action은 기본 상태에서 과하게 강하면 안 된다

### 5.6 Inputs & Search

- 입력창은 너무 둥글지 않은 직사각형 기반
- 검색창은 상단 고정 영역에 자연스럽게 녹아들어야 한다
- focus state는 파란 outline 또는 soft glow
- placeholder는 설명보다 예시 느낌으로 짧게 쓴다

### 5.7 Chips & Badges

종류:

- account badge
- unread / action-needed
- notion linked
- AI suggested
- label

규칙:

- chip은 시각적 장식이 아니라 상태 압축용이다.
- 텍스트는 짧고 명확해야 한다.
- 한 row에 최대 2~3개만 보이게 한다.

### 5.8 AI Panel

- AI 패널은 "결론을 강요하는 도구"가 아니라 "빠른 판단 보조 패널"로 보여야 한다.
- 추천 액션은 카드형보다 리스트형이 낫다.
- confidence나 추정 정보는 낮은 대비 텍스트로 보조 표시한다.
- AI 섹션의 색은 브랜드 주색보다 약하게 운용한다.

### 5.9 Notion Link Panel

- 연결 상태를 과장하지 않는다.
- `Task`, `Archive`, `Project` 여부를 명확히 보여준다.
- 연결됨 상태는 녹색 계열의 작고 안정적인 표시를 사용한다.
- Open in Notion 버튼은 깔끔한 secondary button으로 둔다.

## 6. Layout Principles

기본 레이아웃 철학:

- 카드 더미보다 구조적 패널이 우선이다.
- 메일 리스트는 spreadsheet와 feed의 중간 정도 밀도를 가진다.
- 정보는 숨기기보다 잘 정리해서 보여준다.

### Spacing Scale

- `4px`
- `8px`
- `12px`
- `16px`
- `20px`
- `24px`
- `32px`

규칙:

- 컴포넌트 내부 기본 여백은 `12px` 또는 `16px`
- 패널 내부는 `20px` 또는 `24px`
- 섹션 간 간격은 `24px` 이상
- 메일 row 높이는 너무 낮지 않게 유지하되, 목록 밀도를 해치지 않는다

### Recommended App Widths

- Sidebar: `240px` to `280px`
- Mail List: `380px` to `520px`
- Detail Panel: fluid
- Right Utility Panel: `280px` to `340px`

### Borders vs Shadows

- 이 제품은 그림자보다 경계선과 surface 대비로 구분한다.
- 같은 화면 안에서 큰 그림자 남용 금지
- 구분은 얇은 border와 배경 차이로 해결한다

## 7. Depth & Elevation

깊이 표현은 절제한다.

권장 elevation:

- `surface-0`
  앱 배경
- `surface-1`
  기본 패널
- `surface-2`
  hover, dropdown, floating search, composer
- `surface-3`
  modal

권장 shadow 예시:

- panel:
  `0 1px 2px rgba(16, 24, 40, 0.04)`
- floating:
  `0 8px 24px rgba(15, 23, 42, 0.10)`
- modal:
  `0 20px 48px rgba(15, 23, 42, 0.18)`

원칙:

- 그림자는 존재감보다 레이어 구분용이다.
- 모달과 composer만 약간 더 떠 보이게 한다.

## 8. Motion & Interaction

애니메이션은 빠르고 짧아야 한다.

- 기본 transition: `140ms` to `180ms`
- modal/composer entrance: `180ms` to `220ms`
- hover는 subtle
- row selection은 즉시 반응

사용할 수 있는 모션:

- fade + slight slide
- background tint transition
- panel expand/collapse

피해야 할 모션:

- 바운스
- 느린 easing
- 과한 scale
- 목록 전체가 출렁이는 애니메이션

## 9. Responsive Behavior

### Desktop First

이 제품은 데스크톱 우선이다.

- 1440px 이상
  3-pane fully expanded
- 1200px 이상
  sidebar + list + detail
- 1024px 이상
  sidebar 축소 또는 utility panel collapse
- 768px 이상
  list/detail 2단 전환
- 767px 이하
  inbox first, detail은 drill-in

### Mobile Rules

- 모바일에서는 3-pane 구조를 유지하려 하지 않는다.
- `목록 -> 상세 -> 액션` 흐름으로 단순화한다.
- desktop의 모든 메타 정보를 한 번에 보여주지 않는다.
- sticky action bar를 허용한다.

### Touch Targets

- 최소 40px
- 주요 액션은 44px 이상 권장

## 10. States

반드시 명확히 디자인해야 하는 상태:

- loading
- empty
- sync in progress
- partial sync failed
- disconnected account
- no mail selected
- no Notion connected
- AI analysis pending
- AI analysis failed

상태 표현 규칙:

- skeleton은 row와 패널 구조를 반영해야 한다.
- empty state는 장식보다 다음 행동을 제시해야 한다.
- 에러는 원인을 짧고 행동 가능한 문장으로 보여준다.

## 11. Accessibility

- 텍스트 대비는 충분히 높게 유지한다.
- 색만으로 상태를 구분하지 않는다.
- keyboard navigation을 우선 고려한다.
- unread, selected, focused, disabled 상태는 서로 확실히 달라야 한다.
- shortcut UI가 있다면 시각적으로도 일관되게 드러나야 한다.

## 12. Do's and Don'ts

### Do

- 정돈된 패널 구조를 사용한다.
- 메일 처리 흐름을 먼저 보여준다.
- 정보 밀도와 가독성의 균형을 맞춘다.
- 상태를 숨기지 않고 조용하게 드러낸다.
- 색보다 구조와 타이포로 위계를 만든다.
- Notion/AI 패널은 보조 정보로 다룬다.

### Don't

- 대시보드 위젯처럼 화면을 쪼개지 않는다.
- 메일 리스트를 카드 피드처럼 만들지 않는다.
- Primary CTA를 여러 개 두지 않는다.
- AI 결과를 정답처럼 보이게 하지 않는다.
- 상태 chip과 badge를 무분별하게 늘리지 않는다.
- 지나치게 브랜드 마케팅 페이지 같은 hero UI를 넣지 않는다.

## 13. Page-Specific Guidance

### Inbox

- 가장 높은 우선순위는 스캔 속도
- 발신자, 제목, 상태, 시간의 균형 유지
- 필터는 강력하되 시각적으로 과하지 않게

### Mail Detail

- 제목과 액션, 본문, AI/Notion 보조 패널의 위계를 분명히
- 본문은 읽기 편해야 하고 HTML 렌더링이 과도하게 장식되면 안 된다

### Account Settings

- 신뢰감이 중요
- 연결 상태, 마지막 동기화, 에러 메시지, 재연결 액션이 명확해야 함

### Notion Mapping

- 데이터베이스와 속성 매핑은 폼이라기보다 설정 테이블에 가깝게
- 복잡해 보이더라도 설명보다 구조적 표시가 우선

### AI Suggestions

- 추천은 짧고 실행 가능해야 함
- "왜 이런 추천을 했는지"를 한 줄 정도로 보여줄 수 있으면 좋음

## 14. Agent Prompt Guide

AI가 UI를 생성할 때 기본적으로 따라야 할 요약:

- Build a calm, desktop-first mail workspace with structured panels, not marketing-style cards.
- Optimize for scan speed, message triage, and clear action hierarchy.
- Use light neutral surfaces, ink-heavy text, and a restrained blue accent.
- Keep AI and Notion as supportive side-panels, not the main visual focus.
- Prefer borders, spacing, and typography over heavy shadows and flashy gradients.
- Make unread, selected, reply-needed, sync-failed, and linked states immediately distinguishable.
- The interface should feel precise, productive, and quietly premium.

## 15. Implementation Notes

가능하면 다음 디자인 토큰을 코드에 반영한다.

- CSS variables로 색상과 surface 정의
- spacing scale 공통화
- typography tokens 분리
- 상태 색상과 badge variant 공통화
- pane layout을 재사용 가능한 shell component로 분리

최종 목표:

이 디자인 시스템은 "예쁜 메일 앱"을 만드는 것이 아니라, "빨리 판단하고 바로 처리할 수 있는 작업형 메일 인터페이스"를 만드는 데 있다.

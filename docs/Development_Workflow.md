# Development Workflow

이 문서는 Mail Agent 저장소에서 실제 개발을 진행할 때의 기준 흐름을 정리한다.  
제품 요구사항은 `Plan.md`, 단계별 범위는 `Development_Plan.md`를 따르고, 이 문서는 그 문서를 실제 작업 순서로 번역한 운영 가이드다.

## 1. 현재 기준점

현재 저장소는 다음 구조를 기준으로 개발한다.

- `apps/web`: Next.js 기반 UI
- `apps/api`: NestJS 기반 API
- `packages/shared`: 메일 도메인 타입, 공용 계약
- `prisma`: DB 스키마 초안
- `docs`: 기획, 설계, 개발 계획 문서

현재 상태에서 우선 확정된 원칙:

- 패키지 매니저는 `npm`
- 저장소 루트는 GitHub 연결된 `Mail-Agent`
- 초기 검증 명령은 `npm run check`
- 웹과 API는 각각 별도 터미널에서 실행

## 2. 기본 개발 루프

하루 작업 흐름은 아래 순서를 기본으로 한다.

1. `git pull` 또는 최신 브랜치 상태 확인
2. `npm install`이 필요한 변경인지 확인
3. `npm run check`로 현재 기준선 확인
4. 작업 대상 Phase와 모듈 범위 확정
5. 코드 수정
6. 다시 `npm run check`
7. 가능하면 해당 앱 단위 실행 확인
8. 변경 내용을 문서 또는 TODO에 반영

실행 명령:

```bash
npm run check
npm run dev:api
npm run dev:web
```

로컬 인프라가 필요할 때:

```bash
npm run db:up
npm run db:down
```

## 3. 우선 개발 순서

문서 기준으로 당장 진행할 구현 순서는 아래처럼 고정한다.

### Step 1. 기반 안정화

목표:

- 로컬 개발 흐름을 흔들림 없이 반복 가능하게 만들기
- 환경 변수, DB 연결, Prisma 사용 방식을 고정하기

작업:

- `.env.example` 정리
- Prisma client 도입
- API 설정 로더 추가
- DB 연결 모듈 추가
- 공통 에러 포맷 추가

현재 완료:

- `@prisma/client`, `prisma` 설치
- 루트 `npm run prisma:generate` 스크립트 추가
- API `DatabaseModule` / `PrismaService` 추가
- `/api/health`에서 DB 연결 상태 확인 가능
- API `ConfigModule` / `AppConfigService` 추가
- 환경 변수 로더와 기본 검증 추가
- `main.ts`가 설정 로더를 통해 포트 사용
- 전역 `ApiExceptionFilter` 추가
- API 에러 응답을 공통 JSON 형식으로 통일

남은 작업:

- 없음. Step 1 완료

완료 기준:

- API가 설정을 읽고 정상 부팅됨
- DB 연결 헬스체크 경로를 만들 수 있음

### Step 2. Account 저장 흐름

목표:

- Gmail / IMAP 계정 메타데이터를 내부 모델로 안전하게 저장

작업:

- Prisma `User`, `Account` 실제 사용 시작
- account repository/service 분리
- account CRUD API 초안
- sync 상태 필드 갱신 흐름 정의

현재 완료:

- `AccountsRepository` 추가
- account 목록/단건 조회를 Prisma DB 기반으로 전환
- account 생성 API 초안 추가
- sync status 갱신 API 초안 추가
- 요청 사용자 컨텍스트를 `x-user-email`, `x-user-name` 헤더 기반으로 연결
- account 흐름이 하드코딩 개발 사용자 대신 요청 사용자 기준으로 동작
- `CreateAccountDto`, `UpdateAccountSyncStatusDto` 입력 검증 추가
- 전역 `ValidationPipe` 연결
- `EncryptionService` 추가
- account 민감 필드를 암호화해 `Account` encrypted 컬럼에 저장
- IMAP onboarding DTO와 `/api/accounts/onboard/imap` 경로 추가
- IMAP/SMTP 설정이 account 생성 흐름과 연결
- Gmail OAuth `start` / `callback` API 초안 추가
- Google access token / refresh token을 암호화해 account에 저장
- OAuth state에 `clientType`, `returnUri`, 사용자 컨텍스트를 보존
- 앱 세션 토큰 발급/검증/폐기 계층 추가
- `Authorization: Bearer <token>` 또는 `x-session-token`으로 사용자 컨텍스트 복원
- 세션 만료 기간은 `SESSION_TTL_DAYS`로 제어

남은 작업:

- 없음. Step 2 완료

완료 기준:

- mock 데이터 대신 DB 기반 account 조회 가능

### Step 3. Provider connector 실제화

목표:

- connector interface를 mock이 아니라 실제 구현 가능한 경계로 바꾸기

작업:

- Gmail connector 입력/출력 타입 세분화
- IMAP connector 설정 모델 정의
- SMTP 발송 payload 고정
- provider registry에서 계정별 provider resolve

현재 완료:

- Gmail / IMAP provider config 공유 타입 추가
- `ProviderConfigService`로 account `providerConfig`를 typed config로 파싱
- `ProviderRegistryService.resolveAccount()` 추가
- sync job 생성 시 provider/account 설정 해석을 거치도록 연결
- Gmail / IMAP connector 메서드가 typed provider context를 직접 받도록 전환
- sync job 생성 시 connector `listMessages` 시그니처까지 실제로 통과
- `SmtpSender`가 IMAP connector에 의존하지 않고 SMTP 설정을 직접 사용
- SMTP test send 경로 `POST /api/providers/smtp/:accountId/test` 추가
- account `syncCursor` 저장 필드 추가
- sync job 생성 시 저장된 cursor를 읽고, 사용한 cursor를 account에 다시 저장

남은 작업:

- 없음. Step 3 완료

완료 기준:

- provider 호출 흐름이 account 설정과 연결됨

### Step 4. Mail 저장 및 Unified Inbox

목표:

- Message / Thread / Attachment를 DB에 저장하고, 통합 인박스 조회를 가능하게 만들기

작업:

- message normalization 로직 추가
- sync service -> persistence 연결
- inbox query service 추가
- 메일 상세 API를 DB 조회 기반으로 교체

현재 완료:

- `MailNormalizerService` 추가
- Gmail / IMAP raw message -> normalized `Thread` / `MessageDetail` / `Attachment` 변환 경계 추가
- 현재 mail mock 목록/상세가 normalizer를 실제로 통과하도록 연결
- `MailRepository` 추가
- sync job 생성 시 provider 경계를 지난 raw fixture를 normalize 후 `Thread` / `Message` / `Attachment`에 upsert 저장하도록 연결
- sync 완료 시 마지막 raw message 기준 다음 cursor를 account에 다시 반영
- inbox query service 추가
- `GET /mail/inbox`가 요청 사용자 기준 DB `Message` 목록을 조회하도록 전환
- `GET /mail/messages/:messageId`가 요청 사용자 기준 DB `Message` + `Attachment` 조회로 전환
- mail API가 mock source 대신 persistence 조회를 기본 경로로 사용

남은 작업:

- 없음. Step 4 완료

완료 기준:

- unified inbox mock 제거

## 4. 작업 단위 규칙

한 번의 작업은 가능한 한 아래 단위로 자른다.

- 한 Provider 경계 수정
- 한 엔티티 저장 흐름 추가
- 한 API resource 추가
- 한 UI 화면 또는 패널 추가
- 한 문서 업데이트

피해야 하는 작업 방식:

- Gmail, IMAP, Notion, AI를 한 번에 건드리는 큰 변경
- 스키마, API, UI를 설계 없이 동시에 확장하는 변경
- mock과 실제 DB 흐름을 섞어 두는 상태

## 5. 폴더별 책임

### `apps/api`

- HTTP API
- account/mail/sync/notion/agent 모듈
- provider connector orchestration
- persistence access

### `apps/web`

- inbox UI
- mail detail UI
- account settings UI
- notion mapping UI

### `packages/shared`

- 공용 enum
- DTO 수준 타입
- provider contract
- 나중에 API response contract로 확장 가능

### `prisma`

- normalized mail store 스키마
- migration 기준점

## 6. 검증 기준

현재 저장소에서 가장 먼저 신뢰할 검증은 아래다.

- `npm run check`

추가 검증은 환경 제약이 정리되면 순차적으로 붙인다.

- API build
- web build
- Prisma migration
- integration test

현재 메모:

- 이 실행 환경에서는 build 산출물 디렉터리 생성 권한 이슈가 있을 수 있다.
- 따라서 지금 단계에서는 `typecheck`를 최소 기준선으로 사용한다.

## 7. 문서 운용 규칙

문서 역할은 아래처럼 분리한다.

- `Plan.md`: 제품 요구사항과 큰 방향
- `Development_Plan.md`: Phase와 MVP 범위
- `DESIGN.md`: UI/UX 스타일
- `Development_Workflow.md`: 실제 개발 운영 방식

새 문서를 추가하기 전에, 먼저 이 네 문서 중 어디에 흡수할 수 있는지 확인한다.

## 8. 바로 다음 액션

현재 기준으로 가장 자연스러운 다음 구현 순서는 아래다.

1. Gmail connector 실제 sync 구현
2. sync service를 mock fixture 대신 실제 provider 응답 기반으로 교체
3. IMAP connector 실제 sync 구현
4. 메일 액션 API 추가
5. web inbox/detail UI 연결
6. compose/send 기능 추가
7. Notion OAuth 및 mapping 추가

## 9. 다음 마일스톤

Step 4 완료 이후에는 아래 흐름으로 묶어서 진행한다.

### Milestone 1. 실제 메일 수집 완성

- Gmail 실제 동기화
- IMAP 실제 동기화
- provider별 증분 cursor 정교화
- sync 재실행 시 중복/정합성 검증

현재 완료:

- Gmail account에 저장된 OAuth token으로 Gmail API message list / detail 조회 가능
- sync job 생성 시 Gmail 계정은 mock fixture 대신 실제 Gmail API 응답을 normalize/persist 경로로 전달
- IMAP account에 저장된 접속 정보와 비밀번호로 INBOX 실제 message list / detail 조회 가능
- sync job 생성 시 IMAP 계정은 mock fixture 대신 실제 IMAP 응답을 normalize/persist 경로로 전달
- Gmail history 기반 증분 sync 시 `messagesAdded` 중심으로 변경분만 수집
- Gmail history paging 완료 후 응답의 최종 `historyId`를 다음 cursor로 저장
- Gmail `startHistoryId`가 stale해서 404가 나면 full sync로 fallback
- Gmail / IMAP sync 재실행 검증 테스트 추가
- 같은 메시지를 두 번 sync해도 upsert 결과가 중복 증가하지 않고, 저장된 cursor가 다음 실행 입력으로 재사용되는지 검증 가능
- 재실행 검증 명령: `npm run verify:sync-replay`

남은 작업:

- 없음. Milestone 1 완료

### Milestone 2. 메일 처리 기능

- 읽음 / 안읽음
- 보관 / 삭제
- Gmail label 반영
- IMAP 상태 변경 반영
- 액션 로그와 재시도 구조

현재 완료:

- `PATCH /mail/messages/:messageId/read-state` 추가
- 읽음 / 안읽음 변경 시 Gmail은 message modify, IMAP은 `\\Seen` flag 변경까지 provider에 반영
- provider 반영 성공 후 로컬 `Message.isRead` 업데이트
- 수동 읽음 상태 변경을 `AgentActionLog`에 기록
- `PATCH /mail/messages/:messageId/archive-state` 추가
- `PATCH /mail/messages/:messageId/delete` 추가
- 보관 시 Gmail은 `INBOX` 제거, IMAP은 `Archive` 이동을 시도
- 삭제 시 Gmail은 trash API, IMAP은 `Trash` 이동을 시도
- provider 반영 성공 후 로컬 `Message.isArchived` / `labels` 반영과 `AgentActionLog` 기록
- `PATCH /mail/messages/:messageId/labels` 추가
- Gmail 계정에 한해 provider label apply와 로컬 `labels` 갱신을 함께 반영
- 수동 label 적용을 `AgentActionLog`에 기록
- `POST /mail/actions/:actionLogId/retry` 추가
- provider 액션 실패 시 `AgentActionLog.result=failure`와 재시도용 metadata를 함께 저장
- 실패한 읽음/보관/삭제/label 액션을 action log 기준으로 다시 실행 가능
- 재시도 검증 명령: `npm run verify:mail-retry`

남은 작업:

- 없음. Milestone 2 완료

### Milestone 3. 메일 클라이언트 UX

- web inbox 리스트 연결
- mail detail UI 연결
- 계정/상태 필터
- compose / reply / forward

구현 원칙:

- 이번 마일스톤은 `apps/web` 중심으로 진행하되, 필요한 API 보강은 UI를 성립시키는 최소 범위로만 추가한다.
- 한 번에 한 단계만 진행한다. 매 단계마다 문서/디자인/구현/검증을 닫고 다음 단계로 넘어간다.
- `DESIGN.md`의 desktop-first 3-pane 구조, 절제된 surface, 높은 정보 밀도 원칙을 그대로 따른다.
- 현재 web의 hero/marketing 스타일 초기 화면은 이 마일스톤에서 제거 대상이다.
- AI/Notion은 주인공이 아니라 보조 패널로만 배치한다.

Milestone 3 구현 및 디자인 계획:

### Stage 3-1. UI 토큰과 앱 셸 재구성

목표:

- 현재 단일 landing page를 실제 메일 작업 화면의 셸로 교체
- 이후 inbox/detail/filter/compose가 올라갈 공통 레이아웃과 디자인 토큰 고정

구현:

- `app/globals.css`를 `DESIGN.md` 기준 CSS variables 중심으로 재정의
- 색상, spacing, radius, border, typography, elevation 토큰 정리
- `app/page.tsx`를 `좌측 sidebar + 중앙 mail list + 우측 detail/utility` 구조로 교체
- 빈 상태, 로딩 상태, 미선택 상태 패널을 먼저 만든다
- 모바일에서는 `목록 -> 상세` drill-in 흐름으로 축소 가능한 레이아웃 기준점을 만든다

디자인 체크포인트:

- 배경은 `--bg-app`, 패널은 `--bg-panel` 중심의 밝은 중성 surface 사용
- hover/selected/unread 상태를 색만이 아니라 weight와 구조로 함께 구분
- 큰 hero, 과한 그림자, 카드 피드형 구성은 금지
- sidebar 240~280px, list 380~520px, detail은 fluid 원칙 유지

완료 기준:

- 웹 첫 화면이 더 이상 소개 페이지가 아니라 메일 워크스페이스 셸로 보임
- 공통 토큰만으로 이후 패널을 일관되게 얹을 수 있음

현재 완료:

- `apps/web/app/page.tsx`를 소개 페이지에서 desktop-first 메일 워크스페이스 셸로 교체
- `apps/web/app/globals.css`에 `DESIGN.md` 기준 색상, surface, spacing, radius, 상태 표현 토큰 반영
- 좌측 sidebar / 중앙 list / 우측 detail 구조와 미선택 상태, 보조 패널, 상태 배지 뼈대 반영
- `apps/web/app/layout.tsx`를 메일 도구 톤에 맞는 기본 타이포 조합으로 정리

남은 작업:

- 없음. Stage 3-1 완료

### Stage 3-2. Inbox 리스트 연결

목표:

- `GET /mail/inbox` 응답을 실제 리스트 UI에 연결

구현:

- web에서 API fetch 계층 추가
- inbox row를 `unread dot / account badge / sender / subject / snippet / timestamp / status chips` 구조로 렌더링
- 초기 로딩, empty, fetch failure 상태 분리
- 기본 선택 메시지 상태와 row selection 상태 연결

디자인 체크포인트:

- row는 카드형이 아니라 밀도 있는 목록형
- chip은 최대 2~3개만 노출
- unread는 발신자/제목 weight 강화로 먼저 보이게 함

완료 기준:

- DB에 저장된 메일 목록이 웹 리스트에 표시됨
- 선택/hover/unread 상태가 즉시 구분됨

현재 완료:

- web에서 `GET /api/mail/inbox`, `GET /api/accounts`를 호출하는 fetch 계층 추가
- inbox row를 실제 `MessageSummary` 기반으로 렌더링하도록 연결
- 로딩 skeleton, empty, fetch failure 상태를 리스트 영역에 분리
- 첫 메시지 자동 선택과 row click selection 상태 연결
- account badge를 실제 account display name 또는 provider 기준으로 표시

남은 작업:

- 없음. Stage 3-2 완료

### Stage 3-3. Mail detail 연결

목표:

- 선택된 메시지의 상세, 첨부 메타데이터, quick actions 노출

구현:

- 선택된 message id 기준 `GET /mail/messages/:messageId` 연결
- 제목, 발신자, 수신 계정, 시간, 본문, 첨부 목록 렌더링
- 읽음/보관/삭제/label/retry 액션 버튼을 현재 API에 연결
- `bodyHtml` 렌더링은 최소 장식 원칙으로 처리하고, 필요 시 안전한 fallback을 둔다

디자인 체크포인트:

- 헤더의 액션은 Secondary/Tertiary 위주
- 본문 가독성을 우선하고, 액션이 본문을 압도하지 않게 함
- 첨부와 메타 정보는 본문보다 낮은 위계로 배치

완료 기준:

- 리스트에서 메일을 선택하면 상세 패널이 실제 데이터로 갱신됨
- 현재 존재하는 mail action API를 웹에서 실행 가능

현재 완료:

- 선택된 message id 기준 `GET /api/mail/messages/:messageId` detail fetch 연결
- 제목, 발신자, 수신 계정, 시간, 본문, 첨부 목록을 detail 패널에 실제 데이터로 렌더링
- 읽음/안읽음, 보관, 삭제, 라벨 적용 액션을 detail 패널에서 실행 가능하도록 연결
- 실패한 액션 재시도를 위해 `GET /api/mail/messages/:messageId/action-logs/latest-failure` 경로 추가 후 웹 retry 버튼 연결
- `bodyHtml`은 최소 sanitize 후 렌더링하고, 없으면 `bodyText` fallback 사용

남은 작업:

- 없음. Stage 3-3 완료

### Stage 3-4. 계정/상태 필터 추가

목표:

- 여러 계정과 기본 상태를 빠르게 좁혀 볼 수 있게 함

구현:

- `GET /accounts` 기반 계정 필터 UI 추가
- unread, archived 제외, attachment 있음, label 기준의 1차 필터 설계
- 초기 단계에서는 web 로컬 필터로 시작하고, 서버 필터가 필요해지는 지점에서 API 확장
- 필터 상태를 URL search params 또는 명시적 UI state로 유지

디자인 체크포인트:

- 필터는 강력하되 시각적으로 과하지 않은 상단 bar/chip 형태
- primary CTA를 늘리지 않고 판단 속도 보조에 집중

완료 기준:

- 계정별/상태별로 inbox를 빠르게 좁혀 볼 수 있음
- 필터 UI가 메일 리스트 밀도를 해치지 않음

현재 완료:

- `GET /accounts` 응답 기반 account filter UI를 inbox 상단 bar에 연결
- unread, archived 제외, attachment 있음, label 기준의 1차 로컬 필터 추가
- 필터 상태를 web 명시적 UI state로 유지하고, 결과가 바뀌면 선택 메시지도 자동 보정
- 필터 결과 0건 상태를 별도 empty state로 분리

남은 작업:

- 없음. Stage 3-4 완료

### Stage 3-5. Compose / Reply / Forward

목표:

- 메일 클라이언트 UX의 마지막 핵심 행동 경로 완성

구현:

- API에 compose/reply/forward DTO 및 endpoint 추가
- Gmail은 Gmail API 발송 경로, IMAP 계정은 SMTP 발송 경로 재사용
- web에 composer surface 추가: 새 메일, 답장, 전체 답장, 전달
- reply/forward 시 원본 메일 컨텍스트를 자동 채움
- 전송 중, 성공, 실패, 재시도 상태를 분리

디자인 체크포인트:

- composer는 modal 또는 floating panel 형태의 `surface-2`/`surface-3`
- Primary 버튼은 `Send` 하나만 사용
- 본문 작성 영역은 읽기 패널보다 약간 높은 레이어로만 처리

완료 기준:

- Gmail/SMTP 어느 계정이든 웹에서 작성 및 발송 가능
- reply/forward 진입 시 수신자/제목/원문 인용이 일관되게 채워짐

현재 완료:

- API에 compose/reply/forward DTO와 endpoint 추가
- web에 floating composer surface 추가: 새 메일, 답장, 전체 답장, 전달
- reply/reply all/forward 진입 시 수신자, 제목 prefix, 원문 인용을 자동 채움
- Gmail 계정은 Gmail API `messages/send` 경로까지 연결
- IMAP 계정은 현재 저장소의 SMTP sender 경로로 연결하되, 응답에서 placeholder 상태를 명시

남은 작업:

- 없음. Stage 3-5 완료

선행 이슈 메모:

- 현재 API에는 inbox/detail/읽음/보관/삭제/label/retry만 있으므로, compose/reply/forward는 별도 API 추가가 필요하다.
- 현재 web은 데이터 패칭 라이브러리가 없으므로, Milestone 3에서는 먼저 단순 fetch 기반으로 시작하고 필요 시 이후 캐시 계층을 붙인다.
- 현재 web의 색/레이아웃은 `DESIGN.md`와 방향이 다르므로 Stage 3-1에서 먼저 전면 교체한다.

권장 진행 순서:

1. Stage 3-1 UI 토큰과 앱 셸
2. Stage 3-2 inbox 리스트 연결
3. Stage 3-3 mail detail 연결
4. Stage 3-4 계정/상태 필터
5. Stage 3-5 compose/reply/forward

현재 작업 상태:

- Stage 3-5 완료
- 다음 작업은 `Milestone 4. Notion 연동`

### Milestone 4. Notion 연동

- Notion OAuth
- DB mapping
- Task 생성
- Archive 생성
- mail detail linked state

### Milestone 5. AI 보조와 자동화

- 요약 / 중요도 / 답장 필요 여부
- 추천 액션
- Smart View
- Notion 양방향 동기화
- 자동화 규칙

## 10. Desktop Release Note

Gmail OAuth 연결과 앱 로그인 상태 유지는 분리해서 본다.

- 이번 단계에서 해결된 것: Google `refresh token`을 암호화 저장하므로, 사용자는 일정 기간 다시 비밀번호를 입력하지 않고 Gmail 계정을 재사용할 수 있다.
- 이번 단계에서 추가로 해결된 것: 앱 세션 토큰 자체도 DB 기반으로 유지되므로, 데스크탑 앱은 이 토큰을 secure storage에 저장해 자동 로그인 흐름으로 확장할 수 있다.
- 아직 남은 것: 데스크탑 앱 secure storage 실제 연동과 세션 갱신 UX는 앱 구현 단계에서 추가 필요하다.
- 데스크탑 앱에서는 `clientType=desktop`과 `returnUri`를 사용해 외부 브라우저 OAuth 이후 앱으로 복귀시키는 흐름을 이어서 구현할 수 있다.

## 11. Sync Job Model

초기 sync job 입력 모델은 다음 필드를 기준으로 통일한다.

- `accountId`: 어느 계정을 동기화할지
- `mode`: `initial` | `incremental` | `resync`
- `trigger`: `manual` | `scheduled` | `oauth_callback` | `reconnect`
- `reason`: 사람이 읽을 설명
- `cursor`: provider별 증분 동기화 힌트

현재 반영된 구조:

- 공유 타입 `SyncJobInput`, `SyncJobRecord`
- API DTO `CreateSyncJobDto`
- `POST /api/sync/jobs` 경로

cursor 규칙:

- Gmail: `gmailHistoryId`
- IMAP: `imapUidValidity`, `imapLastUid`

이 단계에서는 큐 저장이나 실행 worker는 붙이지 않고, 입력 모델과 API 경계를 먼저 고정한다.

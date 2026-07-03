# Mail Agent 실제 개발 계획

## 1. 문서 목적

이 문서는 `Plan.md`에서 정의한 제품 방향을 실제 개발 가능한 단계로 쪼개기 위한 실행 계획서다.

목표는 다음과 같다.

- 무엇을 먼저 만들지 우선순위를 명확히 한다.
- 각 Phase별 산출물과 완료 기준을 정의한다.
- 병렬 가능한 작업과 선행 조건을 구분한다.
- MVP와 v1.0 사이의 경계를 분명히 한다.

## 2. 개발 원칙

- 가장 먼저 `안정적인 메일 수집/동기화`를 만든다.
- 모든 Provider 차이는 `Connector + Normalized Model`로 흡수한다.
- 초기 AI는 `자동 실행`보다 `분석/추천`에 집중한다.
- Notion은 `전체 동기화`가 아니라 `선택적 연결`을 기본으로 한다.
- 각 자동화 액션은 반드시 `로그`와 `복구 가능성`을 고려한다.
- UI보다 먼저 `데이터 신뢰성`, `동기화 정확성`, `권한/보안`을 확보한다.

## 3. 전체 로드맵

### Phase 0. 프로젝트 기반 구축

목표:
실제 기능 개발이 가능한 공통 개발 환경과 기본 앱 구조를 만든다.

주요 작업:
- 프론트엔드 프로젝트 초기화
- 백엔드 프로젝트 초기화
- 공용 TypeScript 설정 정리
- 환경 변수 구조 정의
- 기본 인증 전략 초안 수립
- DB, Redis, Queue 로컬 개발 환경 구성
- Prisma 스키마 초기 버전 작성
- 공통 로깅, 에러 핸들링, 설정 로더 구성

산출물:
- 실행 가능한 프론트엔드 앱
- 실행 가능한 백엔드 API 서버
- PostgreSQL, Redis 연결
- Prisma migration 초안
- `.env.example`

완료 기준:
- 로컬에서 웹/서버/DB/Redis가 함께 실행된다.
- 헬스체크 API와 기본 페이지가 동작한다.
- Prisma migration으로 기본 테이블이 생성된다.

리스크:
- monorepo 여부가 초기에 흔들리면 이후 구조 변경 비용이 커진다.
- 환경 변수/시크릿 관리 규칙이 늦게 정해지면 OAuth 작업이 꼬일 수 있다.

권장 기간:
- 2~3일

---

### Phase 1. 메일 도메인 모델과 계정 연결 기반

목표:
여러 메일 Provider를 하나의 내부 모델로 다룰 수 있는 기반을 만든다.

주요 작업:
- 핵심 엔티티 설계
  - User
  - Account
  - Message
  - Thread
  - Attachment
  - Label
  - AgentAnalysis
  - AgentActionLog
- Provider 공통 인터페이스 정의
- Gmail Connector 골격 작성
- IMAP Connector 골격 작성
- SMTP Sender 골격 작성
- Account CRUD API 작성
- 계정 연결 상태 확인 API 작성
- 토큰/비밀번호 암호화 저장 방식 정의

산출물:
- DB 스키마 v1
- Provider interface
- Account 관리 API
- Gmail/IMAP/SMTP connector skeleton

완료 기준:
- 계정 정보를 DB에 안전하게 저장할 수 있다.
- Gmail 계정과 IMAP 계정 메타데이터를 동일한 구조로 관리할 수 있다.
- Connector 레이어가 이후 Sync Worker에서 재사용 가능한 형태로 분리된다.

리스크:
- Gmail API와 IMAP 모델의 차이를 처음부터 명확히 분리하지 않으면 이후 동기화 로직이 복잡해진다.

권장 기간:
- 3~4일

---

### Phase 2. Gmail OAuth 및 Gmail 동기화

목표:
가장 중요한 1차 경로인 Gmail 연결과 메일 수집을 완성한다.

주요 작업:
- Google OAuth 설정
- Gmail 연결 시작/콜백 API 구현
- access token / refresh token 저장
- Gmail profile 조회 후 Account 생성
- Gmail message list 조회
- Gmail message detail 조회
- Gmail threadId, label, snippet, receivedAt 매핑
- Gmail -> Normalized Message 변환기 작성
- 초기 전체 동기화 작업 작성
- 증분 동기화용 historyId 저장
- 수동 재동기화 API 작성

산출물:
- Gmail OAuth 연결 기능
- Gmail 초기 sync job
- Gmail 증분 sync 기반 데이터 구조

완료 기준:
- 사용자가 Gmail 계정을 연결할 수 있다.
- 최근 메일이 DB에 저장된다.
- Message/Thread/Label이 정상 매핑된다.
- 재실행 시 중복 없이 업데이트된다.

리스크:
- Gmail API quota와 pagination 처리 누락
- thread/message 정합성 문제

권장 기간:
- 4~5일

---

### Phase 3. IMAP/SMTP 연결 및 일반 메일 계정 지원

목표:
학교 메일 등 Gmail이 아닌 계정도 같은 인박스에 들어오게 만든다.

주요 작업:
- IMAP 연결 테스트 API
- IMAP 계정 등록 API
- IMAP 초기 동기화
- UID 기반 증분 동기화
- 읽음/안읽음 상태 반영
- 폴더/라벨 차이 대응 전략 정의
- SMTP 발송 설정 저장
- SMTP 테스트 발송 기능
- 연결 실패/인증 실패 에러 메시지 정리

산출물:
- IMAP account onboarding
- IMAP sync worker
- SMTP sender

완료 기준:
- 일반 IMAP 계정을 등록할 수 있다.
- INBOX 메일이 DB에 저장된다.
- SMTP 테스트 메일 발송이 된다.

리스크:
- 서버별 IMAP 구현 편차
- 폴더 구조 차이
- UTF-8/인코딩 이슈

권장 기간:
- 4~6일

---

### Phase 4. Unified Inbox API와 기본 메일 읽기 UX

목표:
실제 사용 가능한 첫 번째 사용자 경험인 통합 메일함을 만든다.

주요 작업:
- Unified Inbox 조회 API
- 계정별 필터 API
- 읽음/안읽음 필터
- 첨부파일 여부 필터
- 상세 메일 조회 API
- Thread 단위 조회 API
- 메일 리스트 UI
- 메일 상세 UI
- 계정 배지/라벨 표시
- 기본 검색 초안

산출물:
- 통합 인박스 화면
- 메일 상세 화면
- 기본 필터/정렬 기능

완료 기준:
- 여러 계정의 메일이 하나의 리스트에 표시된다.
- 메일 상세에서 본문/메타데이터/첨부파일 메타를 볼 수 있다.
- 계정별 필터가 동작한다.

리스크:
- 대량 메일 렌더링 성능
- 본문 HTML 렌더링 보안

권장 기간:
- 4~5일

---

### Phase 5. 메일 액션 처리

목표:
사용자가 메일을 실제로 처리할 수 있도록 핵심 액션을 붙인다.

주요 작업:
- 읽음 처리
- 안읽음 처리
- 보관
- 삭제
- Gmail label 적용
- IMAP 폴더 이동 또는 상태 반영 전략 구현
- 액션 큐 및 재시도 처리
- AgentActionLog 기록
- UI 낙관적 업데이트 여부 결정

산출물:
- 메일 액션 API
- 액션 처리 UI
- 실패 재시도/로그 구조

완료 기준:
- 메일 상태 변경이 Provider와 로컬 DB에 모두 반영된다.
- 실패 시 사용자에게 상태가 명확히 보인다.
- 액션 로그가 남는다.

리스크:
- Provider별 액션 의미 차이
- 로컬 상태와 실제 Provider 상태 불일치

권장 기간:
- 3~4일

---

### Phase 6. 메일 작성/답장/전달

목표:
읽기 전용을 넘어 실제 메일 클라이언트로 사용할 수 있게 만든다.

주요 작업:
- 새 메일 작성 API/UI
- 답장 API/UI
- 전체 답장 API/UI
- 전달 API/UI
- Gmail API 발송 구현
- SMTP 발송 구현
- 초안 저장 구조 초안
- 발송 전 유효성 검사
- 기본 스니펫 기능

산출물:
- Compose UI
- Reply/Forward UI
- Gmail/SMTP send path

완료 기준:
- Gmail 계정으로 발송 가능
- SMTP 계정으로 발송 가능
- 답장/전달 시 원본 컨텍스트가 유지된다.

리스크:
- thread 연결 방식 차이
- HTML/plain text 조합 처리

권장 기간:
- 4~5일

---

### Phase 7. Notion OAuth 및 DB 매핑

목표:
메일과 Notion을 연결하기 위한 계정/데이터베이스 기반을 만든다.

주요 작업:
- Notion OAuth 구현
- Notion workspace 연결
- Task DB 선택
- Archive DB 선택
- Project DB 선택 optional
- People DB 선택 optional
- DB property mapping 설정 UI/API
- NotionConnection, NotionDatabaseMapping 모델 구현

산출물:
- Notion 연결 기능
- DB mapping 설정 기능

완료 기준:
- 사용자가 자신의 Notion workspace를 연결할 수 있다.
- 최소 Task/Archive DB를 매핑할 수 있다.

리스크:
- 사용자별 DB 구조 차이
- Notion property type 대응 복잡도

권장 기간:
- 3~4일

---

### Phase 8. Mail -> Notion Task / Archive 연결

목표:
중요 메일을 Notion 작업과 기록으로 변환하는 MVP 핵심 기능을 완성한다.

주요 작업:
- 메일 상세에서 Task 생성 액션
- 메일 상세에서 Archive 생성 액션
- Notion page 생성 API
- Message <-> NotionPageMapping 저장
- Mail Agent 링크 생성
- 생성 성공 후 연결 상태 UI 표시
- 오류 메시지와 재시도 처리

산출물:
- Create Notion Task
- Create Notion Archive
- Linked Notion 표시 패널

완료 기준:
- 메일에서 Task를 만들 수 있다.
- 메일에서 Archive를 만들 수 있다.
- 생성된 Notion 페이지와 메일 간 연결이 남는다.

리스크:
- Notion API rate limit
- property mapping 누락 시 생성 실패

권장 기간:
- 3~4일

---

### Phase 9. AI 분석 파이프라인

목표:
메일에 대한 요약과 분류 결과를 생성해 사용자의 처리 속도를 높인다.

주요 작업:
- LLM 호출 추상화
- 메일 요약 프롬프트 작성
- 중요도 분류 프롬프트 작성
- 답장 필요 여부 판단
- 액션 필요 여부 판단
- 마감일 추출
- 분석 결과 저장 모델 구현
- 분석 큐 작업 작성
- 분석 실패/재시도 정책 정의

산출물:
- AgentAnalysis 저장 구조
- 메일별 요약/분류 결과
- AI 분석 큐

완료 기준:
- 새 메일 동기화 후 AI 분석이 비동기로 수행된다.
- 상세 화면에서 요약/중요도/추천 액션이 보인다.

리스크:
- 잘못된 분류
- 비용 관리
- 긴 본문 처리

권장 기간:
- 4~5일

---

### Phase 10. AI 기반 보조 UX

목표:
AI 결과를 사용자가 실제 행동으로 이어갈 수 있게 UI에 연결한다.

주요 작업:
- 메일 상세에 AI 요약 패널 표시
- 추천 액션 표시
- 답장 초안 생성
- Task 제목/우선순위/마감일 추천
- Smart View용 requiresAction 플래그 활용
- 사용자 확인 후 실행 흐름 구성

산출물:
- AI Agent Panel
- Reply draft UI
- Task recommendation UI

완료 기준:
- 사용자가 AI 추천을 검토하고 수락/수정할 수 있다.
- AI가 직접 실행하지 않고도 처리 시간을 줄여준다.

리스크:
- 신뢰도가 낮은 추천이 UX를 해칠 수 있음

권장 기간:
- 3~4일

---

### Phase 11. Smart View와 생산성 고도화

목표:
사용자별 중요 메일 모아보기와 작업 중심 탐색을 지원한다.

주요 작업:
- Smart View 데이터 모델 구현
- 규칙 기반 View 생성
- AI category 기반 View 생성
- 기본 제공 View 템플릿
  - 답장 필요
  - 오늘 처리
  - 학교 중요 메일
  - 프로젝트 관련 메일
- 저장된 View 조회 API/UI

산출물:
- Smart View 기능
- View 관리 UI

완료 기준:
- 사용자가 특정 조건의 메일을 빠르게 모아볼 수 있다.
- 기본 제공 View가 실제 사용 흐름에 도움이 된다.

리스크:
- 필터 조합 복잡도 증가

권장 기간:
- 3일

---

### Phase 12. Notion 양방향 동기화와 자동화

목표:
Notion 상태 변화가 Mail Agent 작업 상태에 반영되는 흐름을 만든다.

주요 작업:
- Notion webhook 수신
- pageId 기준 매핑 조회
- Task 완료 시 메일 처리 완료 상태 반영
- 설정 기반 자동 archive
- 자동 실행 시 로그 기록
- 자동화 설정 화면

산출물:
- Notion -> Mail Agent sync
- 자동 archive 옵션

완료 기준:
- Notion Task 완료 이벤트를 받아 연결된 메일 상태를 갱신할 수 있다.
- 자동 archive는 opt-in 설정으로만 동작한다.

리스크:
- webhook 안정성
- 사용자 의도와 다른 자동 처리

권장 기간:
- 3~4일

## 4. 병렬 작업 전략

다음 작업은 병렬 진행이 가능하다.

- Phase 0 중 프론트엔드 초기화와 백엔드 초기화
- Phase 1 중 DB 스키마 설계와 Connector interface 초안
- Phase 4 중 Inbox API와 메일 리스트 UI
- Phase 7 중 Notion OAuth와 DB mapping UI 초안
- Phase 9 중 프롬프트 설계와 분석 결과 저장 모델 구현

다음 작업은 선행 완료가 필요하다.

- Gmail/IMAP 동기화 전에 Phase 1 완료 필요
- Unified Inbox 전에 Gmail 또는 IMAP 중 최소 1개 sync 완료 필요
- Notion Task 생성 전에 Notion OAuth + DB mapping 완료 필요
- AI 추천 UI 전에 AgentAnalysis 파이프라인 완료 필요

## 5. 실제 우선순위

### 1차 마일스톤

- Phase 0
- Phase 1
- Phase 2
- Phase 4

의미:
Gmail 기반 읽기 전용 통합 인박스를 먼저 완성한다.

### 2차 마일스톤

- Phase 3
- Phase 5
- Phase 6

의미:
여러 계정에서 메일을 실제로 처리할 수 있게 만든다.

### 3차 마일스톤

- Phase 7
- Phase 8

의미:
메일을 Notion Task/Archive로 연결하는 핵심 차별점을 완성한다.

### 4차 마일스톤

- Phase 9
- Phase 10

의미:
AI가 메일 처리 속도를 높이는 보조 역할을 한다.

### 5차 마일스톤

- Phase 11
- Phase 12

의미:
Smart View, 양방향 동기화, 자동화까지 확장한다.

## 6. MVP 정의

MVP에서 반드시 포함할 것:

- Gmail 연결
- IMAP 연결
- 초기/증분 메일 동기화
- Unified Inbox
- 메일 상세 보기
- 읽음/보관/삭제
- 답장/전달/작성
- Notion OAuth
- Task/Archive 생성
- 기본 AI 요약

MVP에서 제외 가능:

- Outlook 지원
- People DB 자동 연결
- Project 자동 추천
- 완전 자동 실행 규칙
- Notion 양방향 자동화
- 고급 검색
- embedding 검색

## 7. Phase별 상세 체크리스트

### 체크리스트 A. 인프라

- 프로젝트 구조 확정
- DB/Redis 실행
- Prisma migration
- 환경 변수 규칙
- 공통 에러 포맷
- 로깅 규칙

### 체크리스트 B. 메일 수집

- Gmail OAuth
- Gmail sync
- IMAP 등록
- IMAP sync
- Thread 매핑
- Attachment metadata 저장

### 체크리스트 C. 메일 UX

- 통합 리스트
- 상세 화면
- 계정 필터
- 읽음/보관/삭제
- 답장/전달/작성

### 체크리스트 D. Notion

- OAuth
- DB 선택
- property mapping
- Task 생성
- Archive 생성
- 링크 표시

### 체크리스트 E. AI

- 요약
- 중요도
- 답장 필요 여부
- 액션 필요 여부
- 마감일 추출
- 답장 초안

## 8. 완료 판단 기준

다음 조건이 충족되면 `실사용 가능한 MVP`로 본다.

- Gmail과 IMAP 계정 각각 최소 1개 이상 연결 가능
- 메일 동기화가 재실행되어도 중복 저장되지 않음
- 통합 인박스에서 여러 계정 메일을 안정적으로 조회 가능
- 기본 메일 액션이 Provider와 내부 DB 모두에 반영됨
- Notion Task/Archive 생성이 실제 사용자 DB 구조에서 동작함
- AI 요약 결과가 메일 상세에서 확인 가능

## 9. 권장 개발 순서 요약

1. 기반 환경 구축
2. 메일 데이터 모델 정규화
3. Gmail 연결 및 sync 완성
4. Unified Inbox UI 완성
5. IMAP/SMTP 추가
6. 메일 액션과 작성 기능 추가
7. Notion 연결 및 Task/Archive 추가
8. AI 분석과 추천 UX 추가
9. Smart View와 자동화 고도화

## 10. 다음 액션 제안

문서 작성 후 바로 이어서 할 작업:

1. Gmail 실제 sync를 구현해 connector skeleton을 실제 수집 경로로 전환한다.
2. sync service를 mock fixture 기반에서 실제 provider 응답 기반으로 교체한다.
3. IMAP 실제 sync를 구현해 멀티 계정 수집 기준을 맞춘다.
4. 메일 액션 API를 추가해 읽음 / 보관 / 삭제 흐름을 provider와 DB에 함께 반영한다.
5. web inbox/detail UI를 현재 API와 연결한다.

## 11. 현재 체크포인트

현재 저장소는 다음 단계까지 완료된 상태로 본다.

- Phase 0 성격의 기반 환경 구성
- Phase 1 성격의 account / provider 경계 / 암호화 저장
- Phase 2 일부인 Gmail OAuth 초안 및 session 유지 계층
- Phase 3 일부인 IMAP onboarding, SMTP sender, sync cursor 저장
- Phase 4 일부인 normalized mail persistence와 unified inbox / message detail DB 조회 API

아직 본격적으로 남아 있는 핵심 구현은 아래다.

- Gmail 실제 message sync
- IMAP 실제 message sync
- 메일 액션 처리
- compose / reply / forward
- web UI 연결
- Notion 수동 연동
- AI 분석 파이프라인

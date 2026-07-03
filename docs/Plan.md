자체 메일 에이전트 설계서
Multi-Account Mail Agent with Notion Integration
1. 프로젝트 개요
1.1 목적

Notion Mail 서비스 종료 이후에도 사용자가 여러 메일 계정을 하나의 환경에서 관리하고, 중요한 메일을 Notion 기반 업무·기록 시스템과 연결할 수 있는 자체 메일 에이전트를 구축한다.

본 서비스는 단순한 메일 클라이언트가 아니라, 다음 역할을 수행한다.

1. 여러 메일 계정 통합
2. 메일 분류 및 검색
3. 답장 / 보관 / 삭제 / 라벨링 등 메일 처리
4. AI 기반 요약 및 업무 추출
5. Notion Task / Archive / Project / People DB와 연결
2. 서비스 방향성
2.1 핵심 포지셔닝

여러 메일 계정을 하나의 작업 공간으로 통합하고, 중요한 메일을 Notion 기반 업무와 지식으로 전환하는 개인 메일 에이전트

Notion Mail을 단순히 복제하는 것이 아니라, Notion Mail의 한계였던 진짜 통합 인박스 부재를 보완하고, Notion과의 연결성을 유지한다.

2.2 역할 분리
Mail Agent
- 메일 수신 / 발신
- 여러 계정 통합
- 메일 검색
- 메일 상태 관리
- AI 요약 / 분류 / 액션 추천
- 자동화 실행

Notion
- 업무 관리
- 프로젝트 기록
- 회의록
- 연구 노트
- 사람 / 기관 관리
- 장기 아카이브

중요한 원칙은 다음이다.

Notion은 원본 메일 저장소가 아니라, 메일에서 파생된 업무와 지식의 정리 공간으로 사용한다.

3. 주요 사용자 시나리오
3.1 통합 인박스

사용자는 Gmail, 학교 계정, 연구실 계정 등을 연결한 뒤 하나의 인박스에서 모든 메일을 확인한다.

예시:
- 개인 Gmail
- 학교 Gmail / Google Workspace
- 학교 IMAP 계정
- 연구실 계정
- 추후 Outlook / Microsoft 365
3.2 메일을 Notion Task로 전환

교수님이나 조교가 보낸 과제 안내 메일을 확인한 뒤, 사용자는 버튼 한 번으로 Notion Task를 생성한다.

메일 제목:
[컴퓨터비전] 과제 제출 안내

생성되는 Notion Task:
- 제목: 컴퓨터비전 과제 제출
- 마감일: 2026-07-05
- 우선순위: High
- 상태: Not Started
- 원본 메일 링크: Mail Agent 내부 링크
- 요약: 제출 방식, 제출 기한, 첨부파일 정보
3.3 연구 관련 메일을 Notion 프로젝트와 연결

FCTM, MPEG, 논문 제출, 연구 미팅 관련 메일을 특정 Notion Project DB 항목과 연결한다.

메일 스레드:
"FCTM crosscheck result discussion"

연결 대상:
Notion Project DB → Single Feature Map Compression

이후 사용자는 다음과 같이 요청할 수 있다.

“FCTM 관련 메일만 보여줘”
“이 프로젝트와 연결된 최근 메일 요약해줘”
“이 메일 스레드를 연구 노트에 정리해줘”
3.4 답장 필요한 메일 탐지

AI가 메일 내용을 분석해 사용자가 조치해야 할 메일을 별도 View로 분류한다.

Smart View:
- 답장 필요
- 오늘 처리할 메일
- 학교 중요 메일
- 연구 관련 메일
- 결제 / 영수증
- 일정 조율
4. 전체 시스템 아키텍처
4.1 전체 구조
[Client]
  - Web App
  - 추후 Desktop App / Mobile App

        ↓

[API Server]
  - Auth
  - Account Management
  - Mail API
  - Notion API
  - Agent API

        ↓

[Provider Connector Layer]
  - Gmail Connector
  - IMAP Connector
  - SMTP Connector
  - Outlook Connector, later

        ↓

[Sync Worker / Queue]
  - 메일 동기화
  - 상태 변경 반영
  - Notion 동기화
  - AI 분석 작업

        ↓

[Normalized Mail Store]
  - User
  - Account
  - Message
  - Thread
  - Label
  - Attachment
  - AgentActionLog

        ↓

[Integration Layer]
  - Notion Task
  - Notion Archive
  - Notion Project
  - Notion People
  - Notion Meeting Note

        ↓

[AI Agent Layer]
  - 요약
  - 분류
  - 답장 초안
  - 업무 추출
  - 일정 추출
  - 자동화 규칙 추천
5. 핵심 설계 원칙
5.1 Provider와 내부 모델 분리

Gmail, IMAP, Outlook은 각각 메일 구조와 기능이 다르다.

따라서 서비스 내부에서는 모든 메일을 공통 모델로 정규화한다.

Provider 원본 데이터
→ Provider Connector
→ Normalized Mail Model
→ Unified Inbox / Search / Agent / Notion Integration

이렇게 해야 Gmail 전용 기능에 종속되지 않고 학교 계정, Outlook, 자체 메일 서버까지 확장할 수 있다.

5.2 Gmail은 Gmail API 우선

Gmail 계정은 IMAP보다 Gmail API 기반 연동을 우선한다.

이유:

- Gmail label 직접 제어 가능
- threadId 사용 가능
- OAuth 인증 안정적
- Gmail 검색 연산자 활용 가능
- Push notification 확장 가능
- Gmail API 기반 발송 가능
5.3 일반 학교 계정은 IMAP + SMTP

학교 계정이 Google Workspace가 아닌 경우에는 IMAP/SMTP를 사용한다.

IMAP:
- 메일 수신
- 폴더 조회
- 읽음 / 안 읽음
- 삭제 / 이동

SMTP:
- 새 메일 발송
- 답장
- 전달

단, IMAP 계정은 Gmail과 달리 라벨, 스레드, 검색 기능이 서버마다 다를 수 있으므로 내부에서 보정한다.

5.4 Notion은 선택적 연동

모든 메일을 Notion에 동기화하지 않는다.

Notion에는 다음만 저장한다.

- 사용자가 직접 저장한 메일
- AI가 중요하다고 판단하고 사용자가 승인한 메일
- Task로 전환된 메일
- 프로젝트 / 연구 / 회의와 연결된 메일 요약
5.5 AI 자동화는 설명 가능해야 함

AI가 라벨링, Task 생성, 요약, 보관 등의 행동을 할 경우 모든 액션을 로그로 남긴다.

기록할 정보:
- 어떤 메일을 대상으로 했는가
- 어떤 판단을 했는가
- 어떤 액션을 실행했는가
- 자동 실행인지 수동 승인인지
- Notion 페이지를 생성했는가
- 실패했는가 / 성공했는가
6. 주요 모듈 설계
6.1 Account Module

사용자의 메일 계정을 관리한다.

기능
- Gmail OAuth 연결
- IMAP 계정 등록
- SMTP 설정 등록
- 계정별 동기화 상태 확인
- 계정별 별칭 설정
- 계정 활성화 / 비활성화
예시 계정
{
  "id": "account_01",
  "userId": "user_01",
  "provider": "gmail",
  "email": "user@gmail.com",
  "displayName": "개인 Gmail",
  "syncEnabled": true,
  "lastSyncedAt": "2026-06-29T10:00:00+09:00"
}
6.2 Provider Connector Layer

메일 제공자별 차이를 추상화한다.

공통 인터페이스
interface MailProvider {
  listMessages(accountId: string, cursor?: string): Promise<MessageSummary[]>;
  getMessage(accountId: string, providerMessageId: string): Promise<MessageDetail>;
  sendMessage(accountId: string, payload: SendMailPayload): Promise<void>;
  replyMessage(accountId: string, providerMessageId: string, payload: ReplyPayload): Promise<void>;
  archiveMessage(accountId: string, providerMessageId: string): Promise<void>;
  deleteMessage(accountId: string, providerMessageId: string): Promise<void>;
  markRead(accountId: string, providerMessageId: string): Promise<void>;
  markUnread(accountId: string, providerMessageId: string): Promise<void>;
  applyLabel(accountId: string, providerMessageId: string, label: string): Promise<void>;
}
6.3 Sync Worker

메일 동기화와 외부 상태 반영을 담당한다.

주요 작업
- 신규 메일 가져오기
- 기존 메일 상태 업데이트
- 읽음 / 안 읽음 상태 반영
- 라벨 / 폴더 변경 반영
- 삭제 / 보관 상태 반영
- 실패 작업 재시도
- Notion 동기화 작업 처리
- AI 분석 작업 큐 등록
동기화 전략
Gmail:
- historyId 기반 증분 동기화
- 추후 push notification 확장

IMAP:
- UID 기반 증분 동기화
- 주기적 polling
- 서버 지원 시 IDLE 사용 가능

Outlook:
- Microsoft Graph delta query, later
6.4 Unified Inbox Module

여러 계정의 메일을 하나의 인박스로 병합한다.

기본 정렬 기준
receivedAt DESC
필터
- 전체 계정
- 특정 계정
- 읽지 않음
- 중요
- 첨부파일 있음
- 답장 필요
- Notion과 연결됨
- 특정 프로젝트와 연결됨
표시 예시
[학교 계정] [과제] 컴퓨터비전 과제 제출 안내
[개인 Gmail] GitHub security alert
[연구실 계정] FCTM meeting schedule
6.5 Smart View Module

사용자가 저장한 조건 기반 View 또는 AI 기반 View를 제공한다.

View 예시
- 학교 중요 메일
- 교수님 / 조교 메일
- 연구 관련 메일
- 답장 필요
- 오늘 처리할 메일
- 일정 조율
- 결제 / 영수증
- GitHub / 개발 알림
View 조건 예시
{
  "name": "학교 중요 메일",
  "conditions": {
    "accounts": ["school_account"],
    "fromContains": ["ac.kr"],
    "aiCategory": ["academic", "urgent"],
    "requiresAction": true
  }
}
6.6 Mail Composer Module

메일 작성, 답장, 전달을 담당한다.

기능
- 새 메일 작성
- 답장
- 전체 답장
- 전달
- 임시저장
- 예약 발송, later
- Snippet 삽입
- AI 답장 초안 생성
Snippet 예시
안녕하세요, 교수님.
확인했습니다. 안내해주신 내용에 따라 진행하겠습니다.
감사합니다.
전상균 드림.
6.7 AI Agent Module

메일 내용을 분석하고 사용자의 작업을 보조한다.

주요 기능
- 메일 요약
- 답장 필요 여부 판단
- 중요도 판단
- 카테고리 분류
- 마감일 추출
- 일정 후보 추출
- 답장 초안 생성
- Notion Task 생성 제안
- 프로젝트 연결 추천
분석 결과 예시
{
  "summary": "컴퓨터비전 과제 제출 기한과 제출 방식에 대한 안내 메일입니다.",
  "category": "academic",
  "priority": "high",
  "requiresReply": false,
  "requiresAction": true,
  "dueDate": "2026-07-05",
  "suggestedActions": [
    "create_notion_task",
    "add_to_school_view"
  ]
}
6.8 Notion Integration Module

메일과 Notion을 연결한다.

연결 대상
- Notion Task DB
- Notion Mail Archive DB
- Notion Project DB
- Notion People DB
- Notion Meeting Notes DB
주요 액션
- 메일을 Notion Task로 생성
- 메일 요약을 Notion Archive에 저장
- 메일 스레드를 Notion Project에 연결
- 발신자를 Notion People DB에 연결
- 회의 메일을 Meeting Note로 생성
- Notion Task 상태 변경을 Mail Agent에 반영
7. Notion 연동 상세 설계
7.1 Notion OAuth 연결

사용자는 서비스 설정에서 Notion 계정을 연결한다.

흐름
1. 사용자가 Notion 연결 버튼 클릭
2. Notion OAuth 인증
3. 사용자가 접근 허용할 workspace/page/database 선택
4. access token 저장
5. 사용자가 Task DB / Archive DB / Project DB 매핑
7.2 Notion Database Mapping

사용자마다 Notion DB 구조가 다를 수 있으므로 property mapping을 제공한다.

Mapping 예시
{
  "type": "task",
  "notionDatabaseId": "notion_db_abc",
  "propertyMap": {
    "title": "Name",
    "status": "Status",
    "priority": "Priority",
    "dueDate": "Due Date",
    "summary": "Summary",
    "sourceEmailId": "Source Email ID",
    "mailAgentLink": "Mail Agent Link"
  }
}
7.3 Mail → Notion Task
생성 조건
- 사용자가 수동으로 Task 생성
- 또는 AI가 requiresAction = true로 판단
- 사용자가 승인
Notion Task 속성
Name              메일 기반 Task 제목
Status            Not Started
Priority          AI 판단 또는 사용자 지정
Due Date          메일에서 추출한 날짜
Source            Email
Email Subject     원본 메일 제목
Email From        발신자
Email Account     수신 계정
Source Email ID   내부 messageId
Mail Agent Link   자체 서비스 메일 상세 URL
Summary           AI 요약
7.4 Mail → Notion Archive
저장 대상
- 중요한 공지
- 연구 관련 메일
- 계약 / 영수증 / 공식 문서
- 회의 결과
- 사용자가 장기 보관하려는 메일
Archive Page 본문
# 메일 요약

# 주요 내용

# 필요한 조치

# 첨부파일

# 원본 메일 링크
7.5 Mail Thread ↔ Notion Project

메일 스레드와 Notion Project 페이지를 연결한다.

예시
{
  "mailThreadId": "thread_123",
  "notionPageId": "page_456",
  "relationType": "project",
  "projectName": "Single Feature Map Compression"
}
사용 가능 기능
- 프로젝트별 관련 메일 보기
- 프로젝트별 최근 메일 요약
- 메일 내용을 프로젝트 노트에 append
- 프로젝트 관련 답장 필요 메일 필터링
7.6 Notion → Mail Agent 동기화

초기에는 선택 기능으로 둔다.

예시
Notion Task 상태가 Done으로 변경됨
→ Mail Agent에서 해당 메일을 처리 완료로 표시
→ 옵션에 따라 메일 보관

단, 실제 Gmail archive까지 자동 수행할지는 사용자 설정으로 둔다.

8. 데이터 모델 설계
8.1 User
{
  "id": "user_01",
  "email": "main@example.com",
  "name": "Sang Kyun Jeon",
  "createdAt": "2026-06-29T10:00:00+09:00"
}
8.2 Account
{
  "id": "account_01",
  "userId": "user_01",
  "provider": "gmail",
  "email": "user@gmail.com",
  "displayName": "개인 Gmail",
  "authType": "oauth",
  "accessTokenEncrypted": "...",
  "refreshTokenEncrypted": "...",
  "syncEnabled": true,
  "lastSyncedAt": "2026-06-29T10:00:00+09:00"
}
8.3 Message
{
  "id": "msg_01",
  "userId": "user_01",
  "accountId": "account_01",
  "provider": "gmail",
  "providerMessageId": "18c123abc",
  "providerThreadId": "thread_provider_01",
  "threadId": "thread_01",
  "fromName": "Professor Kim",
  "fromEmail": "kim@example.ac.kr",
  "to": ["user@example.com"],
  "cc": [],
  "subject": "과제 제출 안내",
  "snippet": "이번 주 과제 제출 기한은...",
  "bodyText": "....",
  "bodyHtml": "<p>...</p>",
  "receivedAt": "2026-06-29T09:10:00+09:00",
  "isRead": false,
  "isStarred": false,
  "hasAttachments": true,
  "labels": ["INBOX", "학교"],
  "createdAt": "2026-06-29T10:00:00+09:00",
  "updatedAt": "2026-06-29T10:00:00+09:00"
}
8.4 Thread
{
  "id": "thread_01",
  "userId": "user_01",
  "subjectNormalized": "과제 제출 안내",
  "participants": [
    "kim@example.ac.kr",
    "user@example.com"
  ],
  "lastMessageAt": "2026-06-29T09:10:00+09:00",
  "messageCount": 3,
  "linkedNotionPageIds": ["page_123"]
}
8.5 Attachment
{
  "id": "att_01",
  "messageId": "msg_01",
  "filename": "assignment.pdf",
  "mimeType": "application/pdf",
  "size": 124000,
  "providerAttachmentId": "att_provider_01",
  "storageMode": "provider_reference"
}

초기에는 첨부파일을 자체 서버에 저장하지 않고 provider reference만 저장한다.

8.6 Label
{
  "id": "label_01",
  "userId": "user_01",
  "accountId": "account_01",
  "name": "학교",
  "providerLabelId": "Label_123",
  "type": "user"
}
8.7 SmartView
{
  "id": "view_01",
  "userId": "user_01",
  "name": "답장 필요",
  "conditions": {
    "requiresReply": true,
    "isArchived": false
  },
  "sort": {
    "field": "receivedAt",
    "order": "desc"
  }
}
8.8 AgentAnalysis
{
  "id": "analysis_01",
  "messageId": "msg_01",
  "summary": "과제 제출 기한과 제출 방식 안내 메일입니다.",
  "category": "academic",
  "priority": "high",
  "requiresReply": false,
  "requiresAction": true,
  "dueDate": "2026-07-05",
  "confidence": 0.91,
  "createdAt": "2026-06-29T10:00:00+09:00"
}
8.9 AgentActionLog
{
  "id": "action_01",
  "userId": "user_01",
  "messageId": "msg_01",
  "actionType": "create_notion_task",
  "triggerType": "manual",
  "reason": "사용자가 메일 상세 화면에서 Task 생성 버튼을 클릭함",
  "result": "success",
  "notionPageId": "page_123",
  "createdAt": "2026-06-29T10:00:00+09:00"
}
8.10 NotionConnection
{
  "id": "notion_conn_01",
  "userId": "user_01",
  "workspaceId": "workspace_01",
  "workspaceName": "Personal Workspace",
  "accessTokenEncrypted": "...",
  "createdAt": "2026-06-29T10:00:00+09:00"
}
8.11 NotionDatabaseMapping
{
  "id": "mapping_01",
  "userId": "user_01",
  "type": "task",
  "notionDatabaseId": "db_123",
  "propertyMap": {
    "title": "Name",
    "status": "Status",
    "dueDate": "Due Date",
    "priority": "Priority",
    "summary": "Summary",
    "sourceEmailId": "Source Email ID"
  }
}
8.12 NotionPageMapping
{
  "id": "page_map_01",
  "userId": "user_01",
  "messageId": "msg_01",
  "threadId": "thread_01",
  "notionPageId": "page_123",
  "mappingType": "task",
  "syncDirection": "mail_to_notion",
  "lastSyncedAt": "2026-06-29T10:00:00+09:00"
}
9. 주요 플로우 설계
9.1 Gmail 계정 연결
1. 사용자가 Gmail 연결 클릭
2. Google OAuth 진행
3. 권한 승인
4. access token / refresh token 암호화 저장
5. Gmail profile 조회
6. Account 생성
7. 초기 동기화 job 등록
8. 최근 메일 가져오기
9. Unified Inbox에 표시
9.2 IMAP 계정 연결
1. 사용자가 학교 계정 정보 입력
2. IMAP 서버 / 포트 / 보안 설정 입력
3. SMTP 서버 / 포트 / 보안 설정 입력
4. 연결 테스트
5. 인증 정보 암호화 저장
6. Account 생성
7. 초기 동기화 job 등록
8. INBOX 메일 가져오기
9.3 메일 동기화
1. Sync Worker 실행
2. account별 provider connector 호출
3. 신규 message 목록 조회
4. 내부 Message 모델로 정규화
5. Thread 매핑
6. Attachment metadata 저장
7. AI 분석 job 등록
8. Inbox 갱신
9.4 메일 읽음 처리
1. 사용자가 메일을 읽음 처리
2. local pending action 생성
3. provider API 호출
4. 성공 시 Message.isRead = true
5. 실패 시 retry queue 등록
6. AgentActionLog 기록
9.5 메일을 Notion Task로 생성
1. 사용자가 메일 상세 화면에서 [Task로 만들기] 클릭
2. AI가 제목 / 마감일 / 요약 / 우선순위 추천
3. 사용자가 확인 또는 수정
4. Notion Task DB에 page 생성
5. NotionPageMapping 저장
6. Message에 notionLinked = true 표시
7. AgentActionLog 기록
9.6 Notion Task 완료 동기화
1. Notion Task 상태가 Done으로 변경됨
2. Notion Webhook 수신
3. Notion pageId로 NotionPageMapping 조회
4. 연결된 messageId 확인
5. Mail Agent에서 처리 완료 표시
6. 사용자 설정에 따라 메일 archive 실행
7. AgentActionLog 기록
10. 권한 및 보안 설계
10.1 OAuth Scope 최소화

초기에는 읽기 중심 권한으로 시작한다.

Phase 1:
- 메일 읽기
- 사용자 이메일 확인

Phase 2:
- 메일 전송
- 라벨 / 보관 / 삭제

Phase 3:
- 자동화 액션
10.2 민감 정보 암호화

다음 정보는 반드시 암호화 저장한다.

- Gmail refresh token
- Notion access token
- IMAP password
- SMTP password
- OAuth secret
10.3 메일 본문 저장 정책

초기 MVP에서는 본문 저장 범위를 제한한다.

저장:
- subject
- from / to / cc
- receivedAt
- snippet
- labels
- thread metadata
- AI summary

선택 저장:
- bodyText
- bodyHtml

기본 미저장:
- 첨부파일 원본

첨부파일은 초기에 provider reference만 저장하고, 사용자가 열 때 provider에서 가져온다.

10.4 Agent Action 승인 정책

초기에는 AI가 직접 메일을 삭제하거나 전송하지 않는다.

AI 자동 가능:
- 요약
- 분류 추천
- View 추천
- Task 생성 제안

사용자 승인 필요:
- 메일 전송
- 메일 삭제
- 메일 보관
- Notion Task 생성
- 자동 라벨링 규칙 적용

추후 사용자가 허용한 규칙에 한해서 자동 실행한다.

11. UI / UX 설계
11.1 메인 레이아웃
좌측 사이드바:
- All Inbox
- 계정별 Inbox
- Smart Views
- Notion Linked
- Drafts
- Sent
- Archive
- Trash
- Settings

중앙:
- 메일 리스트

우측:
- 메일 상세
- AI 요약
- 추천 액션
- Notion 연결 정보
11.2 메일 리스트

각 메일은 다음 정보를 표시한다.

[계정 배지] 발신자
제목
snippet
수신 시간
라벨
첨부파일 여부
답장 필요 여부
Notion 연결 여부

예시:

[학교] 김교수
과제 제출 안내
이번 주 과제 제출 기한은...
오늘 09:10
#학교 #과제 #답장불필요 #NotionTask
11.3 메일 상세 화면
상단:
- 제목
- 발신자
- 수신 계정
- 수신 시간

본문:
- 원본 메일 내용

우측 Agent Panel:
- 요약
- 중요도
- 답장 필요 여부
- 마감일
- 추천 액션

액션 버튼:
- 답장
- 전달
- 보관
- 삭제
- 읽지 않음
- Notion에 저장
- Task로 만들기
- 프로젝트에 연결
11.4 Notion 연결 패널

메일이 Notion과 연결된 경우 다음을 보여준다.

Linked Notion:
- Task: 컴퓨터비전 과제 제출
- Status: Not Started
- Due: 2026-07-05
- Project: 컴퓨터비전 수업
- Open in Notion
12. 기술 스택 제안
12.1 Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand 또는 TanStack Query
- TipTap 또는 Lexical editor
12.2 Backend
- NestJS 권장
- Express도 가능하지만 장기적으로는 NestJS 구조가 유리
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
12.3 Mail
Gmail:
- Gmail API
- Google OAuth

IMAP:
- imapflow

SMTP:
- nodemailer

Outlook, later:
- Microsoft Graph API
12.4 Notion
- Notion OAuth
- Notion API
- Notion Webhook
- Database property mapping
12.5 AI
- OpenAI API 또는 기타 LLM API
- Classification prompt
- Summary prompt
- Due date extraction
- Reply draft generation
- 추후 embedding search
12.6 Search

초기:

- PostgreSQL full-text search

확장:

- Meilisearch
- OpenSearch
- pgvector
13. MVP 범위
13.1 MVP v0.1 — 통합 인박스
목표

여러 계정의 메일을 하나의 화면에서 볼 수 있다.

기능
- 사용자 로그인
- Gmail 계정 연결
- IMAP 계정 연결
- 계정별 동기화
- 통합 인박스
- 계정별 필터
- 메일 상세 보기
- 읽음 / 안 읽음
- 기본 검색
제외
- AI 자동화
- Notion 양방향 동기화
- 예약 발송
- Outlook 연동
13.2 MVP v0.2 — 메일 처리
목표

메일을 실제로 처리할 수 있다.

기능
- 답장
- 전체 답장
- 전달
- 새 메일 작성
- Gmail API 발송
- SMTP 발송
- 보관
- 삭제
- 라벨 / 폴더 매핑
- Draft 저장
13.3 MVP v0.3 — Notion 연결
목표

중요한 메일을 Notion 업무와 기록으로 보낼 수 있다.

기능
- Notion OAuth 연결
- Task DB 선택
- Archive DB 선택
- 메일 → Notion Task 생성
- 메일 → Notion Archive 저장
- NotionPageMapping 저장
- Mail Detail에서 Notion 연결 상태 표시
13.4 MVP v0.4 — AI 보조
목표

메일을 요약하고, 필요한 액션을 추천한다.

기능
- 메일 요약
- 답장 필요 여부 판단
- 중요도 판단
- 마감일 추출
- Task 제목 추천
- 답장 초안 생성
13.5 v1.0 — 메일 에이전트
목표

사용자의 메일 업무를 능동적으로 정리하는 에이전트로 확장한다.

기능
- Smart View
- AI 자동 라벨링
- Notion Project 연결 추천
- People DB 연결
- Notion Task Done → Mail 처리 완료
- 일일 메일 브리핑
- 자연어 검색
14. 개발 우선순위
1순위: 메일 계정 연결과 동기화
- Gmail OAuth
- Gmail message sync
- IMAP sync
- 내부 Message 모델 정규화

이 부분이 가장 중요하다. 여기서 설계를 잘못 잡으면 이후 AI와 Notion 기능을 붙이기 어렵다.

2순위: 통합 인박스 UX
- 계정 배지
- 계정 필터
- 읽음 / 안 읽음
- 메일 상세
- 기본 검색

서비스의 첫 인상은 통합 인박스의 완성도에서 결정된다.

3순위: Notion 수동 연동
- Notion OAuth
- DB 매핑
- Task 생성
- Archive 저장

처음에는 자동화보다 수동 액션 중심이 안전하다.

4순위: AI 요약과 추천
- 요약
- 중요도
- 답장 필요 여부
- Task 생성 추천

AI는 메일 처리를 직접 실행하기보다 “추천”부터 시작한다.

5순위: 양방향 동기화와 자동화
- Notion Webhook
- Task Done 반영
- 자동 라벨링
- 자동 Task 생성
- 일일 브리핑
15. 리스크와 대응 전략
15.1 메일 동기화 복잡도
리스크

Provider마다 메일 상태, 라벨, 폴더, 스레드 모델이 다르다.

대응
- Provider Adapter 패턴 사용
- 내부 Message / Thread 모델로 정규화
- providerMessageId와 internalMessageId 분리
15.2 인증 보안
리스크

메일 계정 token과 password는 매우 민감하다.

대응
- token 암호화 저장
- 환경변수 분리
- refresh token rotation 고려
- 최소 권한 OAuth scope 사용
15.3 Notion 과동기화
리스크

모든 메일을 Notion에 넣으면 속도, API 제한, 개인정보 문제가 발생한다.

대응
- Notion에는 선택된 메일만 저장
- 원본 대신 요약과 링크 중심 저장
- Notion DB mapping은 사용자 설정형으로 제공
15.4 AI 오작동
리스크

AI가 잘못된 메일을 중요하다고 판단하거나 잘못된 Task를 생성할 수 있다.

대응
- 초기에는 추천만 수행
- 자동 실행은 사용자 승인 후
- AgentActionLog 저장
- Undo 기능 제공
15.5 메일 전송 사고
리스크

AI가 생성한 답장을 사용자가 검토하지 않고 보내면 문제가 될 수 있다.

대응
- AI 답장은 항상 draft로 생성
- 자동 발송 금지
- 사용자 명시 승인 후 발송
16. 최종 정리

이 서비스의 핵심은 다음과 같다.

Mail Agent:
여러 메일 계정을 하나로 모으고, 메일을 처리 가능한 작업 단위로 정리한다.

Notion:
메일에서 파생된 업무, 기록, 프로젝트, 사람 정보를 장기적으로 관리한다.

AI:
메일을 이해하고 요약하며, 사용자가 해야 할 다음 행동을 추천한다.

최종적으로 만들 서비스는 다음 형태가 된다.

Gmail, 학교 계정, 연구실 계정을 하나로 묶는 통합 메일 에이전트이며, 중요한 메일을 Notion Task / Archive / Project / People DB로 연결하는 생산성 시스템

가장 먼저 구현해야 할 것은 AI가 아니라 다음 3가지다.

1. 안정적인 멀티 계정 동기화
2. 통합 인박스
3. 메일 → Notion Task / Archive 수동 생성

그다음 AI 요약, 답장 필요 판단, Smart View, Notion 양방향 동기화를 단계적으로 추가하는 방식이 가장 현실적이다.
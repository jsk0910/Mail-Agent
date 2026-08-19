import type { Account, MessageDetail, MessageSummary } from "@mail-agent/shared";

export const demoAccounts: Account[] = [
  {
    id: "account_demo_work",
    userId: "demo-user",
    provider: "gmail" as Account["provider"],
    email: "sangk@company.com",
    displayName: "업무용 Gmail (데모)",
    authType: "oauth",
    syncEnabled: true,
    syncStatus: "idle",
    lastSyncedAt: "2026-08-18T09:12:00+09:00",
    createdAt: "2026-08-01T09:00:00+09:00",
    updatedAt: "2026-08-18T09:12:00+09:00"
  },
  {
    id: "account_demo_personal",
    userId: "demo-user",
    provider: "imap" as Account["provider"],
    email: "dev@mail-agent.local",
    displayName: "개인 메일 (데모)",
    authType: "password",
    syncEnabled: true,
    syncStatus: "idle",
    lastSyncedAt: "2026-08-18T08:58:00+09:00",
    createdAt: "2026-08-01T09:00:00+09:00",
    updatedAt: "2026-08-18T09:10:00+09:00"
  }
];

export const demoDetails: MessageDetail[] = [
  {
    id: "demo-msg-1",
    userId: "demo-user",
    accountId: "account_demo_work",
    provider: "gmail" as MessageDetail["provider"],
    providerMessageId: "gmail-demo-1-3",
    providerThreadId: "thread-demo-1",
    threadId: "thread-demo-1",
    fromName: "정혜원 팀장",
    fromEmail: "hw.jung@partner-corp.com",
    subject: "Re: [긴급] 2026년 3분기 AI 메일 에이전트 파일럿 도입 일정 조율 건",
    snippet: "상기님, 제안해주신 수요일 14시 일정으로 기술 미팅 확정하겠습니다. 회의실 링크 보내드립니다.",
    receivedAt: "2026-08-18T09:05:00+09:00",
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    labels: ["INBOX", "IMPORTANT"],
    to: ["sangk@company.com"],
    cc: ["dev-team@company.com"],
    bodyText:
      "상기님, 빠른 회신 감사합니다.\n\n제안해주신 [8월 21일(수) 14:00 - 15:00]에 기술 미팅을 진행하도록 하겠습니다.\n개발팀 담당자분들도 함께 참석해주시면 논의가 훨씬 수월할 것 같습니다.\n\n[미팅 접속 정보]\n- 화상회의 링크: https://meet.google.com/abc-defg-hij\n- 안건: 1) 로컬 Qwen 모델 사양 및 보안 가이드라인, 2) 3분기 도입 로드맵\n\n추가로 미팅 전에 필요하신 자료가 있으시면 언제든 말씀해주세요.\n수요일에 뵙겠습니다.\n\n감사합니다.\n정혜원 드림",
    bodyHtml:
      "<p>상기님, 빠른 회신 감사합니다.</p><p>제안해주신 <strong>[8월 21일(수) 14:00 - 15:00]</strong>에 기술 미팅을 진행하도록 하겠습니다.<br/>개발팀 담당자분들도 함께 참석해주시면 논의가 훨씬 수월할 것 같습니다.</p><p><strong>[미팅 접속 정보]</strong><br/>- 화상회의 링크: <a href='https://meet.google.com/abc-defg-hij'>https://meet.google.com/abc-defg-hij</a><br/>- 안건: 1) 로컬 Qwen 모델 사양 및 보안 가이드라인, 2) 3분기 도입 로드맵</p><p>추가로 미팅 전에 필요하신 자료가 있으시면 언제든 말씀해주세요.<br/>수요일에 뵙겠습니다.</p><p>감사합니다.<br/>정혜원 드림</p>",
    attachments: [
      {
        id: "att-demo-1",
        messageId: "demo-msg-1",
        filename: "파일럿_요구사항_명세서_v1.2.pdf",
        mimeType: "application/pdf",
        size: 342_180,
        providerAttachmentId: "pilot-spec-pdf",
        storageMode: "provider_reference"
      },
      {
        id: "att-demo-2",
        messageId: "demo-msg-1",
        filename: "인프라_보안검토_체크리스트.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 154_820,
        providerAttachmentId: "security-check-xlsx",
        storageMode: "provider_reference"
      }
    ],
    analysis: {
      id: "analysis-demo-1",
      messageId: "demo-msg-1",
      priority: "high",
      priorityReason: "거래처 파트너 팀장의 최종 미팅 확정 및 접속 링크 안내 메일입니다.",
      intent: "8/21(수) 14:00 기술 미팅 확정 및 Google Meet 링크 공유",
      category: "업무/프로젝트",
      requiresReply: false,
      requiresAction: true,
      dueDate: "2026-08-21T14:00:00+09:00",
      confidence: 0.98,
      summary: "8월 21일(수) 14:00~15:00에 Google Meet을 통해 기술 미팅을 진행하기로 최종 확정함. 로컬 모델 사양 및 보안 가이드라인 안건 논의 예정.",
      keyPoints: [
        "미팅 일시: 8월 21일(수) 14:00 ~ 15:00 (확정)",
        "접속 링크: Google Meet (meet.google.com/abc-defg-hij)",
        "주요 안건: 로컬 LLM 사양 검토 및 3분기 도입 로드맵"
      ],
      suggestedActions: [
        "캘린더에 8/21(수) 14:00 Google Meet 미팅 등록",
        "개발팀(dev-team) 담당자에게 미팅 확정 일정 및 링크 공유",
        "미팅 자료(로컬 Qwen 모델 사양서) 사전 점검"
      ],
      suggestedReply: "정혜원 팀장님, 확인 감사합니다. 수요일 14시 화상회의에서 뵙겠습니다.",
      createdAt: "2026-08-18T09:06:00+09:00"
    },
    // 스레드 내 이전 대화 내역 (과거 순서대로 정렬)
    threadMessages: [
      {
        id: "demo-msg-1-step1",
        userId: "demo-user",
        accountId: "account_demo_work",
        provider: "gmail" as MessageDetail["provider"],
        providerMessageId: "gmail-demo-1-1",
        providerThreadId: "thread-demo-1",
        threadId: "thread-demo-1",
        fromName: "정혜원 팀장",
        fromEmail: "hw.jung@partner-corp.com",
        subject: "[긴급] 2026년 3분기 AI 메일 에이전트 파일럿 도입 일정 조율 건",
        snippet: "안녕하세요 상기님, 보내주신 메일 에이전트 제안서 검토 완료했습니다. 기술 미팅 일정을 제안드립니다.",
        receivedAt: "2026-08-17T14:20:00+09:00",
        isRead: true,
        isStarred: true,
        hasAttachments: true,
        labels: ["INBOX"],
        to: ["sangk@company.com"],
        cc: ["dev-team@company.com"],
        bodyText:
          "안녕하세요 상기님,\n\n지난주 전달해주신 AI 메일 에이전트 솔루션 도입 제안서를 임원진과 함께 검토 완료했습니다.\n\n3분기 내 파일럿 적용을 긍정적으로 검토 중이며, 몇 가지 세부 사항(보안 규정 및 로컬 LLM 사양)에 대해 기술 미팅을 진행하고자 합니다.\n\n[미팅 후보 일정]\n1. 8월 21일(수) 14:00 - 15:00\n2. 8월 22일(목) 10:30 - 11:30\n\n참석 가능하신 일정을 회신해 주시면 감사하겠습니다.\n\n감사합니다.\n정혜원 드림",
        bodyHtml:
          "<p>안녕하세요 상기님,</p><p>지난주 전달해주신 <strong>AI 메일 에이전트 솔루션 도입 제안서</strong>를 임원진과 함께 검토 완료했습니다.</p><p>3분기 내 파일럿 적용을 긍정적으로 검토 중이며, 몇 가지 세부 사항(보안 규정 및 로컬 LLM 사양)에 대해 기술 미팅을 진행하고자 합니다.</p><p><strong>[미팅 후보 일정]</strong><br/>1. 8월 21일(수) 14:00 - 15:00<br/>2. 8월 22일(목) 10:30 - 11:30</p><p>참석 가능하신 일정을 회신해 주시면 감사하겠습니다.</p><p>감사합니다.<br/>정혜원 드림</p>",
        attachments: [
          {
            id: "att-demo-old-1",
            messageId: "demo-msg-1-step1",
            filename: "초기_검토_의견서.pdf",
            mimeType: "application/pdf",
            size: 198_000,
            providerAttachmentId: "initial-review-pdf",
            storageMode: "provider_reference"
          }
        ]
      },
      {
        id: "demo-msg-1-step2",
        userId: "demo-user",
        accountId: "account_demo_work",
        provider: "gmail" as MessageDetail["provider"],
        providerMessageId: "gmail-demo-1-2",
        providerThreadId: "thread-demo-1",
        threadId: "thread-demo-1",
        fromName: "이상기 (나)",
        fromEmail: "sangk@company.com",
        subject: "Re: [긴급] 2026년 3분기 AI 메일 에이전트 파일럿 도입 일정 조율 건",
        snippet: "안녕하세요 정혜원 팀장님, 긍정적인 검토 감사드립니다. 8월 21일(수) 14:00에 참석 가능합니다.",
        receivedAt: "2026-08-17T16:45:00+09:00",
        isRead: true,
        isStarred: false,
        hasAttachments: false,
        labels: ["SENT"],
        to: ["hw.jung@partner-corp.com"],
        cc: ["dev-team@company.com"],
        bodyText:
          "안녕하세요 정혜원 팀장님,\n\n제안해주신 긍정적인 검토 의견에 감사드립니다.\n\n제안해주신 일정 중 [8월 21일(수) 14:00 - 15:00]에 개발팀 담당자와 함께 참석 가능합니다.\n사전에 기술 검토에 필요한 요구사항 명세서가 있으시면 공유 부탁드립니다.\n\n감사합니다.\n이상기 드림",
        bodyHtml:
          "<p>안녕하세요 정혜원 팀장님,</p><p>제안해주신 긍정적인 검토 의견에 감사드립니다.</p><p>제안해주신 일정 중 <strong>[8월 21일(수) 14:00 - 15:00]</strong>에 개발팀 담당자와 함께 참석 가능합니다.<br/>사전에 기술 검토에 필요한 요구사항 명세서가 있으시면 공유 부탁드립니다.</p><p>감사합니다.<br/>이상기 드림</p>",
        attachments: []
      },
      {
        id: "demo-msg-1",
        userId: "demo-user",
        accountId: "account_demo_work",
        provider: "gmail" as MessageDetail["provider"],
        providerMessageId: "gmail-demo-1-3",
        providerThreadId: "thread-demo-1",
        threadId: "thread-demo-1",
        fromName: "정혜원 팀장",
        fromEmail: "hw.jung@partner-corp.com",
        subject: "Re: [긴급] 2026년 3분기 AI 메일 에이전트 파일럿 도입 일정 조율 건",
        snippet: "상기님, 제안해주신 수요일 14시 일정으로 기술 미팅 확정하겠습니다. 회의실 링크 보내드립니다.",
        receivedAt: "2026-08-18T09:05:00+09:00",
        isRead: false,
        isStarred: true,
        hasAttachments: true,
        labels: ["INBOX", "IMPORTANT"],
        to: ["sangk@company.com"],
        cc: ["dev-team@company.com"],
        bodyText:
          "상기님, 빠른 회신 감사합니다.\n\n제안해주신 [8월 21일(수) 14:00 - 15:00]에 기술 미팅을 진행하도록 하겠습니다.\n개발팀 담당자분들도 함께 참석해주시면 논의가 훨씬 수월할 것 같습니다.\n\n[미팅 접속 정보]\n- 화상회의 링크: https://meet.google.com/abc-defg-hij\n- 안건: 1) 로컬 Qwen 모델 사양 및 보안 가이드라인, 2) 3분기 도입 로드맵\n\n추가로 미팅 전에 필요하신 자료가 있으시면 언제든 말씀해주세요.\n수요일에 뵙겠습니다.\n\n감사합니다.\n정혜원 드림",
        bodyHtml:
          "<p>상기님, 빠른 회신 감사합니다.</p><p>제안해주신 <strong>[8월 21일(수) 14:00 - 15:00]</strong>에 기술 미팅을 진행하도록 하겠습니다.<br/>개발팀 담당자분들도 함께 참석해주시면 논의가 훨씬 수월할 것 같습니다.</p><p><strong>[미팅 접속 정보]</strong><br/>- 화상회의 링크: <a href='https://meet.google.com/abc-defg-hij'>https://meet.google.com/abc-defg-hij</a><br/>- 안건: 1) 로컬 Qwen 모델 사양 및 보안 가이드라인, 2) 3분기 도입 로드맵</p><p>추가로 미팅 전에 필요하신 자료가 있으시면 언제든 말씀해주세요.<br/>수요일에 뵙겠습니다.</p><p>감사합니다.<br/>정혜원 드림</p>",
        attachments: [
          {
            id: "att-demo-1",
            messageId: "demo-msg-1",
            filename: "파일럿_요구사항_명세서_v1.2.pdf",
            mimeType: "application/pdf",
            size: 342_180,
            providerAttachmentId: "pilot-spec-pdf",
            storageMode: "provider_reference"
          },
          {
            id: "att-demo-2",
            messageId: "demo-msg-1",
            filename: "인프라_보안검토_체크리스트.xlsx",
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: 154_820,
            providerAttachmentId: "security-check-xlsx",
            storageMode: "provider_reference"
          }
        ]
      }
    ]
  },
  {
    id: "demo-msg-2",
    userId: "demo-user",
    accountId: "account_demo_work",
    provider: "gmail" as MessageDetail["provider"],
    providerMessageId: "gmail-demo-2",
    providerThreadId: "thread-demo-2",
    threadId: "thread-demo-2",
    fromName: "전정·소융종합행정실",
    fromEmail: "admin@univ.ac.kr",
    subject: "2026학년도 2학기 연구실 서버실 전력 정기점검 및 전원 차단 안내",
    snippet: "연구실 서버 관리자 여러분께. 8월 25일(일) 09:00~18:00 교내 정기 전기설비 검사로 인하여 서버실 전원이 일시 차단됩니다.",
    receivedAt: "2026-08-18T08:40:00+09:00",
    isRead: false,
    isStarred: false,
    hasAttachments: true,
    labels: ["INBOX", "CATEGORY_UPDATES"],
    to: ["sangk@company.com"],
    cc: [],
    bodyText:
      "안녕하십니까, 전정·소융종합행정실입니다.\n\n2026학년도 2학기 개강을 맞이하여 교내 변전실 및 전기설비 정기 안전점검이 실시됩니다.\n점검 시간 동안 건물 전체 전력 공급이 중단되오니, 연구실 내 모든 서버 및 워크스테이션을 사전에 안전하게 셧다운(Shut Down)하여 주시기 바랍니다.\n\n1. 정전 일시: 2026년 8월 25일(일) 09:00 ~ 18:00 (총 9시간)\n2. 정전 대상: IT공학관 전 층 및 서버실\n3. 권장 조치: 8월 24일(토) 18시 이전 서버 정상 종료 및 UPS 확인\n\n문의사항: 행정실 내선 (02-1234-5678)",
    bodyHtml:
      "<p>안녕하십니까, 전정·소융종합행정실입니다.</p><p>2026학년도 2학기 개강을 맞이하여 교내 변전실 및 전기설비 정기 안전점검이 실시됩니다.<br/>점검 시간 동안 건물 전체 전력 공급이 중단되오니, 연구실 내 모든 서버 및 워크스테이션을 사전에 안전하게 셧다운(Shut Down)하여 주시기 바랍니다.</p><p><strong>1. 정전 일시:</strong> 2026년 8월 25일(일) 09:00 ~ 18:00 (총 9시간)<br/><strong>2. 정전 대상:</strong> IT공학관 전 층 및 서버실<br/><strong>3. 권장 조치:</strong> 8월 24일(토) 18시 이전 서버 정상 종료 및 UPS 확인</p><p>문의사항: 행정실 내선 (02-1234-5678)</p>",
    attachments: [
      {
        id: "att-demo-3",
        messageId: "demo-msg-2",
        filename: "전기설비_정기점검_안내문.pdf",
        mimeType: "application/pdf",
        size: 188_400,
        providerAttachmentId: "power-check-notice-pdf",
        storageMode: "provider_reference"
      }
    ],
    analysis: {
      id: "analysis-demo-2",
      messageId: "demo-msg-2",
      priority: "medium",
      priorityReason: "연구실 서버 장비 운영에 영향을 주는 공지사항입니다.",
      intent: "서버실 전력 점검 및 사전 서버 셧다운 요청 공지",
      category: "공지/인프라",
      requiresReply: false,
      requiresAction: true,
      dueDate: "2026-08-24T18:00:00+09:00",
      confidence: 0.98,
      summary: "8월 25일(일) 09:00~18:00 교내 정기 전기안전점검으로 인한 전체 정전 예정. 8월 24일(토) 18시 이전까지 연구실 서버 사전 정상 종료 필요.",
      keyPoints: [
        "정전 일시: 8월 25일(일) 09:00 ~ 18:00",
        "대상: IT공학관 전 층 및 서버실",
        "조치 기한: 8월 24일(토) 18:00까지 서버 안전 셧다운"
      ],
      suggestedActions: [
        "연구실 구성원에게 서버 점검 일정 공지",
        "8/24(토) 18시 이전 실행 중인 실험/작업 저장 및 서버 정상 종료 예약"
      ],
      createdAt: "2026-08-18T08:41:00+09:00"
    }
  },
  {
    id: "demo-msg-3",
    userId: "demo-user",
    accountId: "account_demo_personal",
    provider: "imap" as MessageDetail["provider"],
    providerMessageId: "imap-demo-1",
    providerThreadId: "thread-demo-3",
    threadId: "thread-demo-3",
    fromName: "GitHub Notifications",
    fromEmail: "notifications@github.com",
    subject: "[Mail-Agent] Run failed: Build and Test Workflow (#42)",
    snippet: "Mail-Agent / build-and-test: 1 job failed on branch main (commit 8a1f49b)",
    receivedAt: "2026-08-18T07:22:00+09:00",
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    labels: ["INBOX", "CATEGORY_FORUMS"],
    to: ["dev@mail-agent.local"],
    cc: [],
    bodyText:
      "GitHub Actions build failed on branch main.\n\nWorkflow: Build and Test (#42)\nCommit: 8a1f49b 'feat: update detail and composer layout'\nFailed step: Run e2e tests on web app (timeout after 120s)\n\nPlease check the workflow run logs at: https://github.com/org/mail-agent/actions/runs/42",
    bodyHtml:
      "<p><strong>GitHub Actions</strong> build failed on branch <code>main</code>.</p><p>Workflow: <em>Build and Test (#42)</em><br/>Commit: <code>8a1f49b</code> 'feat: update detail and composer layout'<br/>Failed step: <code>Run e2e tests on web app</code> (timeout after 120s)</p><p>Please check the workflow run logs at: <a href='https://github.com/org/mail-agent/actions/runs/42'>https://github.com/org/mail-agent/actions/runs/42</a></p>",
    attachments: [],
    analysis: {
      id: "analysis-demo-3",
      messageId: "demo-msg-3",
      priority: "low",
      priorityReason: "자동화된 CI 빌드 실패 알림 메일입니다.",
      intent: "GitHub CI 테스트 실패 알림",
      category: "알림/개발",
      requiresReply: false,
      requiresAction: false,
      confidence: 0.99,
      summary: "main 브랜치의 Build and Test 워크플로우 42번 실행에서 e2e 테스트 타임아웃으로 빌드 실패.",
      keyPoints: [
        "실패 워크플로우: Build and Test (#42)",
        "실패 단계: Run e2e tests on web app",
        "원인: 120초 타임아웃 발생"
      ],
      suggestedActions: [
        "GitHub Actions 로그 확인 및 e2e 테스트 재실행"
      ],
      createdAt: "2026-08-18T07:23:00+09:00"
    }
  },
  {
    id: "demo-msg-4",
    userId: "demo-user",
    accountId: "account_demo_work",
    provider: "gmail" as MessageDetail["provider"],
    providerMessageId: "gmail-demo-4",
    providerThreadId: "thread-demo-4",
    threadId: "thread-demo-4",
    fromName: "Notion Team",
    fromEmail: "team@makenotion.com",
    subject: "이상기님, 2026 Q3 프로젝트 로드맵 스페이스에 초대되었습니다",
    snippet: "팀 협업 워크스페이스에 초대되었습니다. 지금 바로 로드맵 문서를 확인해보세요.",
    receivedAt: "2026-08-17T17:15:00+09:00",
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    labels: ["INBOX", "CATEGORY_SOCIAL", "notion-linked"],
    to: ["sangk@company.com"],
    cc: [],
    bodyText:
      "이상기님, '2026 Q3 프로젝트 로드맵' 워크스페이스에 멤버로 추가되었습니다.\n프로젝트 마일스톤 및 주요 태스크 일정을 확인하세요.",
    bodyHtml:
      "<p>이상기님, <strong>'2026 Q3 프로젝트 로드맵'</strong> 워크스페이스에 멤버로 추가되었습니다.</p><p>프로젝트 마일스톤 및 주요 태스크 일정을 확인하세요.</p>",
    attachments: [],
    analysis: {
      id: "analysis-demo-4",
      messageId: "demo-msg-4",
      priority: "low",
      priorityReason: "Notion 워크스페이스 초대 알림 메일입니다.",
      intent: "Notion 워크스페이스 초대 안내",
      category: "소셜/초대",
      requiresReply: false,
      requiresAction: false,
      confidence: 0.95,
      summary: "2026 Q3 프로젝트 로드맵 Notion 워크스페이스에 성공적으로 초대 완료됨.",
      keyPoints: [
        "워크스페이스명: 2026 Q3 프로젝트 로드맵"
      ],
      createdAt: "2026-08-17T17:16:00+09:00"
    }
  }
];

function toSummary(detail: MessageDetail): MessageSummary {
  return {
    id: detail.id,
    userId: detail.userId,
    accountId: detail.accountId,
    provider: detail.provider,
    providerMessageId: detail.providerMessageId,
    providerThreadId: detail.providerThreadId,
    threadId: detail.threadId,
    fromName: detail.fromName,
    fromEmail: detail.fromEmail,
    subject: detail.subject,
    snippet: detail.snippet,
    receivedAt: detail.receivedAt,
    isRead: detail.isRead,
    isStarred: detail.isStarred,
    hasAttachments: detail.hasAttachments,
    labels: [...detail.labels],
    analysis: detail.analysis
  };
}

function cloneDetail(detail: MessageDetail): MessageDetail {
  return {
    ...detail,
    labels: [...detail.labels],
    to: [...detail.to],
    cc: [...detail.cc],
    attachments: detail.attachments.map((attachment) => ({ ...attachment })),
    analysis: detail.analysis ? { ...detail.analysis } : undefined,
    threadMessages: detail.threadMessages ? detail.threadMessages.map(cloneDetail) : undefined
  };
}

export function createDemoInboxData() {
  const detailsById = Object.fromEntries(
    demoDetails.map((detail) => [detail.id, cloneDetail(detail)])
  ) as Record<string, MessageDetail>;

  return {
    accounts: demoAccounts.map((account) => ({ ...account })),
    detailsById,
    messages: demoDetails.map((detail) => toSummary(cloneDetail(detail)))
  };
}

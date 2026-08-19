import { FormEvent, useEffect, useState } from "react";
import { Attachment, MessageDetail } from "@mail-agent/shared";
import { ArchiveIcon, ChevronDownIcon, MoreIcon, ReplyIcon, SparkIcon } from "./icons";
import { ComposerAttachmentItem, getAttachmentSummary } from "./attachmentUtils";
import { ComposerPanel } from "./ComposerPanel";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";
import styles from "./DetailColumn.module.css";

type DetailFetchState = "idle" | "loading" | "ready" | "error";
type ComposerMode = "compose" | "reply" | "replyAll" | "forward";
type AnalysisState = "pending" | "loading" | "ready" | "basic" | "invalid" | "failed";

interface ComposerDraft {
  accountId: string;
  bodyHtml: string;
  bodyText: string;
  cc: string;
  subject: string;
  to: string;
}

interface ComposerAppearance {
  fontFamily: "geist" | "mono" | "pretendard";
}

interface DetailColumnProps {
  accounts: Array<{ id: string; displayName: string }>;
  canApplyLabel: boolean;
  composerAttachments: ComposerAttachmentItem[];
  composerAppearance: ComposerAppearance;
  composerDraft: ComposerDraft;
  composerError: string;
  composerMode: ComposerMode;
  composerOpen: boolean;
  composerSending: boolean;
  composerSuccess: string;
  detailActionError: string;
  detailActionLoading: boolean;
  detailActionSuccess: string;
  detailErrorMessage: string;
  detailFetchState: DetailFetchState;
  detailHtml: string;
  formatFileSize: (size: number) => string;
  formatReceivedAtLong: (value: string) => string;
  labelInput: string;
  latestFailedAction: { actionType: string; createdAt: string; id: string; reason: string } | null;
  onArchive: () => void;
  onAttachFiles: (files: FileList | null) => void;
  onAppearanceChange: (appearance: ComposerAppearance) => void;
  onApplyLabel: (event: FormEvent<HTMLFormElement>) => void;
  onComposerChange: (field: keyof ComposerDraft, value: string) => void;
  onComposerClose: () => void;
  onRemoveAttachment: (id: string) => void;
  onComposerSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onDismissDetailFeedback: () => void;
  onLabelInputChange: (value: string) => void;
  onMarkReadToggle: () => void;
  onOpenComposer: (mode: ComposerMode) => void;
  onRetryFailedAction: (() => void) | null;
  onSelectBack: () => void;
  onDownloadAttachment?: (attachment: Attachment) => void;
  onTriggerAnalysis?: () => void;
  onUseSuggestedReply?: (suggestedText: string) => void;
  selectedAccountLabel: string;
  selectedDetail: MessageDetail | null;
  analysisState: AnalysisState;
}

function formatParticipant(value: string, fallbackName?: string) {
  if (fallbackName) {
    return `${fallbackName} <${value}>`;
  }

  return value;
}

function getThreadStatus(detail: MessageDetail) {
  if (!detail.isRead) {
    return "Unread";
  }

  if (detail.isStarred) {
    return "Flagged";
  }

  return "Read";
}

function createAiPreview(detail: MessageDetail) {
  if (detail.analysis) {
    const priority =
      detail.analysis.priority === "high"
        ? "High"
        : detail.analysis.priority === "medium"
          ? "Medium"
          : "Low";
    const needsReply = detail.analysis.requiresReply;
    const actionItems: Array<{ id: string; text: string }> = [];

    if (detail.analysis.suggestedActions && detail.analysis.suggestedActions.length > 0) {
      detail.analysis.suggestedActions.forEach((action, idx) => {
        actionItems.push({
          id: `action-${idx}`,
          text: action
        });
      });
    }

    const suggestedReply =
      detail.analysis.suggestedReply ||
      (needsReply
        ? `안녕하세요 ${detail.fromName || detail.fromEmail.split("@")[0]}님, 보내주신 메일 확인했습니다. 검토 후 회신 드리겠습니다.`
        : "");

    return {
      actionItems,
      needsReply,
      priority,
      priorityReason: detail.analysis.priorityReason,
      intent: detail.analysis.intent,
      keyPoints: detail.analysis.keyPoints || [],
      suggestedReply,
      summary: detail.analysis.summary,
      category: detail.analysis.category,
      dueDate: detail.analysis.dueDate,
      confidence: detail.analysis.confidence,
      source: detail.analysis.source || "heuristic",
      status: detail.analysis.status || "completed",
      model: detail.analysis.model,
      qualityIssues: detail.analysis.qualityIssues || []
    };
  }

  return null;
}

function getInitials(name?: string, fallback = "M") {
  if (!name || !name.trim()) {
    return fallback;
  }
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getCategoryInfo(detail: MessageDetail) {
  if (detail.analysis?.category) {
    return {
      label: `✨ ${detail.analysis.category}`,
      isAi: detail.analysis.source === "qwen" && detail.analysis.status === "completed"
    };
  }

  const categoryLabel = detail.labels.find((label) => label.startsWith("CATEGORY_"));
  if (categoryLabel) {
    const raw = categoryLabel.replace("CATEGORY_", "").toLowerCase().replace(/_/g, " ");
    const nameMap: Record<string, string> = {
      personal: "Personal",
      social: "Social",
      promotions: "Promotions",
      updates: "Updates",
      forums: "Forums"
    };
    return {
      label: nameMap[raw] || raw,
      isAi: false
    };
  }

  return null;
}

function renderAttachments(
  attachments: Attachment[],
  formatFileSize: (size: number) => string,
  onDownloadAttachment?: (attachment: Attachment) => void
) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={styles.attachmentGrid}>
      {attachments.map((attachment) => {
        const summary = getAttachmentSummary(attachment);

        return (
          <article key={attachment.id} className={styles.attachmentCard}>
            <div className={styles.attachmentIconBox}>
              <span className={styles.attachmentIconText}>
                {summary.filename.split(".").pop()?.toUpperCase().slice(0, 4) || "FILE"}
              </span>
            </div>
            <div className={styles.attachmentBody}>
              <p className={styles.attachmentTitle} title={summary.filename}>{summary.filename}</p>
              <p className={styles.attachmentMeta}>
                {formatFileSize(attachment.size)}
              </p>
            </div>
            {onDownloadAttachment && (
              <Button
                compact
                variant="secondary"
                onClick={() => onDownloadAttachment(attachment)}
              >
                Download
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function DetailColumn({
  accounts,
  canApplyLabel,
  composerAttachments,
  composerAppearance,
  composerDraft,
  composerError,
  composerMode,
  composerOpen,
  composerSending,
  composerSuccess,
  detailActionError,
  detailActionLoading,
  detailActionSuccess,
  detailErrorMessage,
  detailFetchState,
  detailHtml,
  formatFileSize,
  formatReceivedAtLong,
  labelInput,
  latestFailedAction,
  onApplyLabel,
  onArchive,
  onAttachFiles,
  onAppearanceChange,
  onComposerChange,
  onComposerClose,
  onRemoveAttachment,
  onComposerSubmit,
  onDelete,
  onDismissDetailFeedback,
  onDownloadAttachment,
  onLabelInputChange,
  onMarkReadToggle,
  onOpenComposer,
  onRetryFailedAction,
  onSelectBack,
  onTriggerAnalysis,
  onUseSuggestedReply,
  analysisState,
  selectedAccountLabel,
  selectedDetail
}: DetailColumnProps) {
  const showInlineComposer = composerOpen && composerMode !== "compose";
  const showDockComposer = composerOpen && composerMode === "compose";
  const showComposeWorkspace = showDockComposer && !selectedDetail;
  const aiPreview = selectedDetail ? createAiPreview(selectedDetail) : null;
  const categoryInfo = selectedDetail ? getCategoryInfo(selectedDetail) : null;
  const isAiHigh = selectedDetail?.analysis?.priority === "high";
  const [workspaceLinked, setWorkspaceLinked] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);

  // 다중 스레드 메시지 목록
  const threadMessages: MessageDetail[] =
    selectedDetail?.threadMessages && selectedDetail.threadMessages.length > 0
      ? selectedDetail.threadMessages
      : selectedDetail
        ? [selectedDetail]
        : [];

  const threadCount = threadMessages.length;
  const latestMessageId = threadMessages[threadMessages.length - 1]?.id;
  const threadMessageIds = threadMessages.map((message) => message.id).join("|");

  // 펼쳐진 메시지 ID 집합 (최신 메시지는 기본 펼침)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedDetail) {
      setWorkspaceLinked(false);
      setShowAiDetails(false);
      setExpandedIds({});
      return;
    }

    setWorkspaceLinked(selectedDetail.labels.includes("notion-linked"));
    setShowAiDetails(false);

    // 기본값: 최신 메시지만 펼치고 이전 메시지는 접힘
    const initialExpanded: Record<string, boolean> = {};
    threadMessages.forEach((msg, idx) => {
      // 마지막(최신) 메시지는 기본 펼침
      initialExpanded[msg.id] = idx === threadMessages.length - 1;
    });
    setExpandedIds(initialExpanded);
  }, [selectedDetail?.id, threadMessageIds]);

  function toggleMessageExpand(messageId: string) {
    setExpandedIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  }

  function expandAllMessages() {
    const allExpanded: Record<string, boolean> = {};
    threadMessages.forEach((msg) => {
      allExpanded[msg.id] = true;
    });
    setExpandedIds(allExpanded);
  }

  function collapseOlderMessages() {
    const olderCollapsed: Record<string, boolean> = {};
    threadMessages.forEach((msg, idx) => {
      olderCollapsed[msg.id] = idx === threadMessages.length - 1;
    });
    setExpandedIds(olderCollapsed);
  }

  const allExpanded =
    threadMessages.length > 1 &&
    threadMessages.every((msg) => expandedIds[msg.id]);

  return (
    <section className={styles.column}>
      {/* Top Sticky Toolbar */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Button variant="ghost" compact onClick={onSelectBack}>
            ← Back
          </Button>
          {selectedDetail && (
            <div className={styles.toolbarStatusGroup}>
              {isAiHigh ? (
                <Chip tone="warning">🔥 중요</Chip>
              ) : (
                <Chip tone={!selectedDetail.isRead ? "active" : "default"}>
                  {getThreadStatus(selectedDetail)}
                </Chip>
              )}
              {categoryInfo && (
                <Chip tone={categoryInfo.isAi ? "active" : "default"}>
                  {categoryInfo.label}
                </Chip>
              )}
              {selectedAccountLabel && (
                <Chip tone="default">{selectedAccountLabel}</Chip>
              )}
              {threadCount > 1 && (
                <Chip tone="active">대화 {threadCount}개</Chip>
              )}
            </div>
          )}
        </div>

        <div className={styles.toolbarActions}>
          <Button
            id="detail-reply-button"
            variant="primary"
            disabled={!selectedDetail}
            icon={<ReplyIcon width={16} height={16} />}
            shortcut="R"
            tooltip="Reply to selected message"
            onClick={() => onOpenComposer("reply")}
          >
            Reply
          </Button>
          <Button
            variant="secondary"
            disabled={!selectedDetail || detailActionLoading}
            icon={<ArchiveIcon width={16} height={16} />}
            shortcut="E"
            tooltip="Archive selected message"
            onClick={onArchive}
          >
            Archive
          </Button>
          <details className={styles.menu}>
            <summary className={styles.menuSummary}>
              <MoreIcon width={16} height={16} />
            </summary>
            <div className={styles.menuCard}>
              <div className={styles.menuGroup}>
                <Button
                  variant="ghost"
                  disabled={!selectedDetail}
                  onClick={() => onOpenComposer("replyAll")}
                >
                  Reply all
                </Button>
                <Button
                  variant="ghost"
                  disabled={!selectedDetail}
                  icon={<ChevronDownIcon width={16} height={16} />}
                  onClick={() => onOpenComposer("forward")}
                >
                  Forward
                </Button>
                <Button
                  variant="ghost"
                  disabled={!selectedDetail || detailActionLoading}
                  shortcut="U"
                  tooltip="Toggle read state"
                  onClick={onMarkReadToggle}
                >
                  {selectedDetail?.isRead ? "Mark unread" : "Mark read"}
                </Button>
                <Button
                  variant="danger"
                  disabled={!selectedDetail || detailActionLoading}
                  shortcut="#"
                  tooltip="Move selected message to trash"
                  onClick={onDelete}
                >
                  Delete
                </Button>
                {onRetryFailedAction && (
                  <Button variant="ghost" disabled={detailActionLoading} onClick={onRetryFailedAction}>
                    Retry failed action
                  </Button>
                )}
              </div>

              <form className={styles.labelForm} onSubmit={onApplyLabel}>
                <input
                  className={styles.labelInput}
                  type="text"
                  value={labelInput}
                  onChange={(event) => onLabelInputChange(event.target.value)}
                  placeholder={canApplyLabel ? "new-label" : "Gmail account only"}
                  disabled={!selectedDetail || !canApplyLabel || detailActionLoading}
                />
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={!selectedDetail || !canApplyLabel || !labelInput.trim() || detailActionLoading}
                >
                  Apply label
                </Button>
              </form>
            </div>
          </details>
        </div>
      </header>

      {/* Action feedback message */}
      {(detailActionError || detailActionSuccess || latestFailedAction) && (
        <div className={styles.feedback} aria-live="polite">
          {detailActionError && (
            <div className={styles.feedbackCard} aria-live="polite">
              <div>
                <strong>Action failed.</strong>
                <div>{detailActionError}</div>
              </div>
              <div className={styles.feedbackActions}>
                {onRetryFailedAction && (
                  <Button variant="secondary" compact onClick={onRetryFailedAction}>
                    Retry
                  </Button>
                )}
                <Button variant="ghost" compact onClick={onDismissDetailFeedback}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          {!detailActionError && detailActionSuccess && (
            <div className={`${styles.feedbackCard} ${styles.feedbackSuccess}`} aria-live="polite">
              <div>
                <strong>Updated.</strong>
                <div>{detailActionSuccess}</div>
              </div>
              <div className={styles.feedbackActions}>
                <Button variant="ghost" compact onClick={onDismissDetailFeedback}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Scrollable Body */}
      <div className={styles.body}>
        {showComposeWorkspace && (
          <section className={styles.composeWorkspace}>
            <ComposerPanel
              accounts={accounts}
              attachments={composerAttachments}
              appearance={composerAppearance}
              draft={composerDraft}
              error={composerError}
              formatFileSize={formatFileSize}
              mode={composerMode}
              onAttachFiles={onAttachFiles}
              onAppearanceChange={onAppearanceChange}
              onChange={onComposerChange}
              onClose={onComposerClose}
              onRemoveAttachment={onRemoveAttachment}
              onSubmit={onComposerSubmit}
              sending={composerSending}
              success={composerSuccess}
            />
          </section>
        )}

        {!showComposeWorkspace && detailFetchState === "idle" && (
          <section className={styles.idle}>
            <div className={styles.idleCard}>
              <div className={styles.idleIcon}>✉️</div>
              <h3 className={styles.emptyTitle}>Select a message</h3>
              <p className={styles.emptyCopy}>Open any thread to review participants, context, and next action here.</p>
              <div className={styles.keyboardHints}>
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>R</kbd> reply</span>
                <span><kbd>E</kbd> archive</span>
              </div>
            </div>
          </section>
        )}

        {!showComposeWorkspace && detailFetchState === "loading" && (
          <div className={styles.skeletonContainer}>
            <span className={`${styles.skeleton} ${styles.skeletonHeader}`} />
            <span className={`${styles.skeleton} ${styles.skeletonCard}`} />
            <span className={`${styles.skeleton} ${styles.skeletonBody}`} />
          </div>
        )}

        {!showComposeWorkspace && detailFetchState === "error" && (
          <section className={styles.idle}>
            <div className={styles.idleCard}>
              <h3 className={styles.emptyTitle}>Message unavailable</h3>
              <p className={styles.emptyCopy}>{detailErrorMessage}</p>
            </div>
          </section>
        )}

        {detailFetchState === "ready" && selectedDetail && (
          <div className={styles.contentStream}>
            {/* Thread Header Card */}
            <article className={styles.messageHeaderCard}>
              <div className={styles.subjectTopRow}>
                <h1 className={styles.messageSubject}>{selectedDetail.subject}</h1>
                {threadCount > 1 && (
                  <div className={styles.threadControls}>
                    <button
                      type="button"
                      className={styles.threadExpandButton}
                      onClick={allExpanded ? collapseOlderMessages : expandAllMessages}
                    >
                      {allExpanded
                        ? `모든 대화 접기 (총 ${threadCount}개)`
                        : `모든 대화 펼치기 (총 ${threadCount}개)`}
                    </button>
                  </div>
                )}
              </div>
            </article>

            {/* Smart AI Executive Briefing (Prominent Top Position) */}
            <section className={styles.aiBriefCard}>
              <div className={styles.aiBriefHeader}>
                <div className={styles.aiBriefTitleGroup}>
                  <span className={styles.aiSparkIcon}>
                    <SparkIcon width={16} height={16} />
                  </span>
                  <h2 className={styles.aiBriefTitle}>AI Smart Brief (Local Qwen)</h2>
                </div>
                <div className={styles.aiBriefHeaderRight}>
                  <Chip tone={analysisState === "ready" ? "active" : analysisState === "invalid" ? "warning" : "default"}>
                    {analysisState === "loading"
                      ? "분석 중..."
                      : analysisState === "failed"
                        ? "분석 실패"
                        : analysisState === "invalid"
                          ? "분석 품질 낮음"
                          : analysisState === "basic"
                            ? "기본 분류"
                        : analysisState === "ready"
                          ? `분석 완료${aiPreview?.model ? ` · ${aiPreview.model}` : ""}`
                          : "미분석"}
                  </Chip>
                  {(analysisState === "basic" || analysisState === "invalid") && (
                    <Button variant="secondary" compact onClick={onTriggerAnalysis}>
                      {analysisState === "invalid" ? "다시 분석" : "Qwen으로 분석"}
                    </Button>
                  )}
                  {aiPreview && (
                    <Button
                      variant="ghost"
                      compact
                      onClick={() => setShowAiDetails(!showAiDetails)}
                    >
                      {showAiDetails ? "간략히 보기" : "세부 분석 보기"}
                    </Button>
                  )}
                </div>
              </div>

              {analysisState === "loading" ? (
                <div className={styles.aiLoadingState}>
                  <p className={styles.aiLoadingText}>로컬 AI 모델(Qwen)로 대화 내용을 종합 분석하고 있습니다...</p>
                  <div className={styles.aiSkeletonBars}>
                    <span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "80%" }} />
                    <span className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: "60%" }} />
                  </div>
                </div>
              ) : aiPreview ? (
                <div className={styles.aiBriefContent}>
                  {analysisState === "basic" && (
                    <div className={styles.aiQualityNotice}>
                      현재 내용은 키워드 기반 기본 분류입니다. 정확한 요약이 필요하면 Qwen 분석을 실행하세요.
                    </div>
                  )}
                  {analysisState === "invalid" && (
                    <div className={styles.aiQualityNotice}>
                      <strong>분석 결과를 신뢰하기 어렵습니다.</strong>
                      {aiPreview.qualityIssues.length > 0 && (
                        <span>{aiPreview.qualityIssues.join(" ")}</span>
                      )}
                    </div>
                  )}
                  {aiPreview.intent && (
                    <div className={styles.aiIntentRow}>
                      <span className={styles.aiIntentBadge}>발신 의도</span>
                      <span className={styles.aiIntentText}>{aiPreview.intent}</span>
                    </div>
                  )}

                  <div className={styles.aiSummaryBox}>
                    <p className={styles.aiSummaryText}>{aiPreview.summary}</p>
                  </div>

                  {/* Badges row */}
                  <div className={styles.aiTagsRow}>
                    <Chip tone={aiPreview.priority === "High" ? "warning" : "active"}>
                      우선순위: {aiPreview.priority}
                    </Chip>
                    {aiPreview.category && (
                      <Chip tone="default">분류: {aiPreview.category}</Chip>
                    )}
                    {aiPreview.dueDate && (
                      <Chip tone="warning">마감/일정: {new Date(aiPreview.dueDate).toLocaleDateString()}</Chip>
                    )}
                    <Chip tone={aiPreview.needsReply ? "active" : "default"}>
                      {aiPreview.needsReply ? "답장 필요" : "답장 불필요"}
                    </Chip>
                  </div>

                  {/* Expandable Details */}
                  {showAiDetails && (
                    <div className={styles.aiExpandedSection}>
                      {aiPreview.keyPoints && aiPreview.keyPoints.length > 0 && (
                        <div className={styles.aiSubBlock}>
                          <h4 className={styles.aiSubHeading}>주요 세부 사항 (Key Points)</h4>
                          <ul className={styles.aiBulletList}>
                            {aiPreview.keyPoints.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiPreview.actionItems.length > 0 && (
                        <div className={styles.aiSubBlock}>
                          <h4 className={styles.aiSubHeading}>추천 후속 조치 (Next Actions)</h4>
                          <ul className={styles.aiBulletList}>
                            {aiPreview.actionItems.map((item) => (
                              <li key={item.id}>{item.text}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiPreview.priorityReason && (
                        <p className={styles.aiPriorityReason}>
                          💡 중요도 사유: {aiPreview.priorityReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* AI Quick Reply Draft Box */}
                  {aiPreview.suggestedReply && (
                    <div className={styles.aiReplyDraftCard}>
                      <div className={styles.aiReplyDraftHeader}>
                        <span className={styles.aiReplyDraftLabel}>AI 추천 회신 초안</span>
                        <Button
                          variant="primary"
                          compact
                          onClick={() => {
                            if (onUseSuggestedReply) {
                              onUseSuggestedReply(aiPreview.suggestedReply);
                            } else {
                              onOpenComposer("reply");
                            }
                          }}
                        >
                          초안 적용하여 답장하기
                        </Button>
                      </div>
                      <div className={styles.aiReplyDraftBody}>
                        {aiPreview.suggestedReply}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.aiEmptyState}>
                  <p className={styles.aiEmptyText}>아직 로컬 AI 분석이 수행되지 않은 메일입니다.</p>
                  <Button variant="secondary" compact onClick={onTriggerAnalysis}>
                    <SparkIcon width={14} height={14} />
                    <span style={{ marginLeft: "6px" }}>AI 분석 실행 (Qwen)</span>
                  </Button>
                </div>
              )}
            </section>

            {/* Conversation Thread Messages Stream */}
            <div className={styles.threadStream}>
              {threadMessages.map((msg, index) => {
                const isExpanded = Boolean(expandedIds[msg.id]);
                const isLatest = index === threadMessages.length - 1;
                const isSelf = msg.labels.includes("SENT") || msg.fromName?.includes("나");
                const recipients = msg.to.slice(0, 2).join(", ");
                const remaining = Math.max(msg.to.length - 2, 0);

                return (
                  <article
                    key={msg.id}
                    className={`${styles.threadMessageCard}${
                      isExpanded ? ` ${styles.threadMessageExpanded}` : ` ${styles.threadMessageCollapsed}`
                    }${isSelf ? ` ${styles.threadMessageSelf}` : ""}${
                      isLatest ? ` ${styles.threadMessageLatest}` : ""
                    }`}
                  >
                    {/* Collapsed view header */}
                    {!isExpanded ? (
                      <div
                        className={styles.collapsedHeader}
                        onClick={() => toggleMessageExpand(msg.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            toggleMessageExpand(msg.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={false}
                        aria-controls={`thread-message-${msg.id}`}
                      >
                        <div className={styles.collapsedLeft}>
                          <div
                            className={`${styles.avatarCircleSmall}${
                              isSelf ? ` ${styles.avatarSelf}` : ""
                            }`}
                          >
                            {getInitials(msg.fromName || msg.fromEmail, isSelf ? "ME" : "M")}
                          </div>
                          <span className={styles.collapsedSender}>
                            {msg.fromName || msg.fromEmail}
                          </span>
                          <span className={styles.collapsedSnippet}>
                            {msg.snippet || msg.bodyText?.slice(0, 80)}
                          </span>
                        </div>
                        <div className={styles.collapsedRight}>
                          {msg.attachments.length > 0 && (
                            <span className={styles.collapsedAttachmentBadge} title={`${msg.attachments.length} attachments`}>
                              📎 {msg.attachments.length}
                            </span>
                          )}
                          <span className={styles.collapsedDate}>
                            {formatReceivedAtLong(msg.receivedAt)}
                          </span>
                          <span className={styles.expandChevron}>▼</span>
                        </div>
                      </div>
                    ) : (
                      /* Expanded Full Message */
                      <div
                        className={styles.expandedContainer}
                        id={`thread-message-${msg.id}`}
                      >
                        <div
                          className={styles.expandedHeader}
                          onClick={() => {
                            if (threadCount > 1) {
                              toggleMessageExpand(msg.id);
                            }
                          }}
                        >
                          <div className={styles.senderLeft}>
                            <div
                              className={`${styles.avatarCircle}${
                                isSelf ? ` ${styles.avatarSelf}` : ""
                              }`}
                            >
                              {getInitials(msg.fromName || msg.fromEmail, isSelf ? "ME" : "M")}
                            </div>
                            <div className={styles.senderDetails}>
                              <div className={styles.senderNameLine}>
                                <span className={styles.senderName}>
                                  {msg.fromName || msg.fromEmail}
                                </span>
                                {isSelf && (
                                  <span className={styles.selfBadge}>내 회신</span>
                                )}
                                {msg.fromName && (
                                  <span className={styles.senderEmail}>
                                    &lt;{msg.fromEmail}&gt;
                                  </span>
                                )}
                              </div>
                              <div className={styles.recipientLine}>
                                <span>to {recipients}{remaining > 0 ? ` +${remaining}` : ""}</span>
                                <span className={styles.dotSeparator}>·</span>
                                <span>via {selectedAccountLabel}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.expandedRight}>
                            <span className={styles.dateDisplay}>
                              {formatReceivedAtLong(msg.receivedAt)}
                            </span>
                            {threadCount > 1 && (
                              <button
                                type="button"
                                className={styles.collapseToggleBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageExpand(msg.id);
                                }}
                                title="접기"
                              >
                                ▲
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Email Content Body */}
                        <div className={styles.expandedContentBody}>
                          {msg.bodyHtml ? (
                            <div
                              className={`${styles.emailContentHtml}`}
                              dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                            />
                          ) : (
                            <pre className={styles.emailPlainText}>
                              {msg.bodyText || msg.snippet || "This message is empty."}
                            </pre>
                          )}
                        </div>

                        {/* Attachments (if message has any) */}
                        {msg.attachments.length > 0 && (
                          <div className={styles.expandedAttachments}>
                            <div className={styles.panelHeader}>
                              <h4 className={styles.attachmentHeading}>첨부파일 ({msg.attachments.length})</h4>
                            </div>
                            {renderAttachments(msg.attachments, formatFileSize, onDownloadAttachment)}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Workspace Project Context Section */}
            <section className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Workspace Integration</h3>
                <Chip tone={workspaceLinked ? "success" : "default"}>
                  {workspaceLinked ? "Linked" : "Not linked"}
                </Chip>
              </div>
              <div className={styles.workspaceBody}>
                {workspaceLinked ? (
                  <>
                    <p className={styles.workspaceText}>
                      이 스레드는 <strong>{selectedDetail.subject}</strong> 프로젝트 페이지와 연결되어 있습니다.
                    </p>
                    <div className={styles.workspaceActions}>
                      <Button variant="secondary" compact type="button">
                        워크스페이스 페이지 열기
                      </Button>
                      <Button
                        variant="ghost"
                        compact
                        type="button"
                        onClick={() => setWorkspaceLinked(false)}
                      >
                        연결 해제
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className={styles.workspaceText}>
                      이 메일을 프로젝트나 지식베이스 문서와 연결하여 후속 작업을 관리할 수 있습니다.
                    </p>
                    <div className={styles.workspaceActions}>
                      <Button
                        variant="secondary"
                        compact
                        type="button"
                        onClick={() => setWorkspaceLinked(true)}
                      >
                        스레드 연결
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Inline Quick Reply (Opens cleanly below email conversation thread) */}
            {showInlineComposer && (
              <section className={styles.inlineComposerSection} id="inline-composer-target">
                <ComposerPanel
                  accounts={accounts}
                  attachments={composerAttachments}
                  appearance={composerAppearance}
                  context={{
                    from: formatParticipant(selectedDetail.fromEmail, selectedDetail.fromName),
                    receivedAt: formatReceivedAtLong(selectedDetail.receivedAt),
                    subject: selectedDetail.subject
                  }}
                  draft={composerDraft}
                  error={composerError}
                  formatFileSize={formatFileSize}
                  mode={composerMode}
                  onAttachFiles={onAttachFiles}
                  onAppearanceChange={onAppearanceChange}
                  onChange={onComposerChange}
                  onClose={onComposerClose}
                  onRemoveAttachment={onRemoveAttachment}
                  onSubmit={onComposerSubmit}
                  sending={composerSending}
                  success={composerSuccess}
                />
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

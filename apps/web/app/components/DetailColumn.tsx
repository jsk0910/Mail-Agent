import { FormEvent, useEffect, useState } from "react";
import { Attachment, MessageDetail } from "@mail-agent/shared";
import { ArchiveIcon, ChevronDownIcon, MoreIcon, ReplyIcon } from "./icons";
import { ComposerAttachmentItem, getAttachmentSummary } from "./attachmentUtils";
import { ComposerPanel } from "./ComposerPanel";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";
import styles from "./DetailColumn.module.css";

type DetailFetchState = "idle" | "loading" | "ready" | "error";
type ComposerMode = "compose" | "reply" | "replyAll" | "forward";
type AnalysisState = "pending" | "loading" | "ready" | "failed";

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
  const rawText = (detail.bodyText || detail.snippet || "").trim();
  const sentences = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const summary = sentences[0] || "AI summary will appear here once message content is available.";
  const priority = detail.isStarred ? "High" : detail.isRead ? "Medium" : "High";
  const needsReply =
    /reply|respond|follow up|can you|please send|let me know/i.test(rawText) ||
    detail.fromEmail.includes("vc") ||
    !detail.isRead;
  const actionItems: Array<{ id: string; text: string }> = [];

  if (needsReply) {
    actionItems.push({
      id: "reply-draft",
      text: "Open a reply draft before leaving this thread."
    });
  }

  if (detail.hasAttachments) {
    actionItems.push({
      id: "review-attachment",
      text: "Review the attachment before archiving."
    });
  }

  if (detail.labels.includes("finance")) {
    actionItems.push({
      id: "finance-follow-up",
      text: "Track the due date or hand this to finance."
    });
  }

  if (actionItems.length === 0) {
    actionItems.push({
      id: "archive-fyi",
      text: "This thread looks informational and can be archived after review."
    });
  }

  const suggestedReply = needsReply
    ? `Thanks ${detail.fromName || detail.fromEmail.split("@")[0]}, I reviewed this and will follow up shortly.`
    : "No reply suggested for this thread right now.";

  return {
    actionItems,
    needsReply,
    priority,
    suggestedReply,
    summary
  };
}

function getThreadIntent(detail: MessageDetail) {
  if (detail.isStarred) {
    return {
      label: "Priority thread",
      description: "Flagged for follow-up and should stay visible until you act."
    };
  }

  if (!detail.isRead) {
    return {
      label: "Needs review",
      description: "Unread and waiting for a first pass before you decide the next step."
    };
  }

  if (detail.hasAttachments) {
    return {
      label: "Review attachment",
      description: "The message is mostly informational, but the attachment likely matters."
    };
  }

  return {
    label: "Informational",
    description: "This thread looks safe to scan quickly and archive if nothing else is needed."
  };
}

function renderAttachments(
  attachments: Attachment[],
  formatFileSize: (size: number) => string
) {
  if (attachments.length === 0) {
    return <p className={styles.emptyCopy}>No attachments on this message.</p>;
  }

  return (
    <div className={styles.attachmentList}>
      {attachments.map((attachment) => {
        const summary = getAttachmentSummary(attachment);

        return (
          <article key={attachment.id} className={styles.attachmentCard}>
            <div className={styles.attachmentBody}>
              <div className={styles.attachmentHeader}>
                <p className={styles.attachmentTitle}>{summary.filename}</p>
                <Chip tone={summary.tone}>{summary.kindLabel}</Chip>
              </div>
              <p className={styles.attachmentMeta}>
                {summary.mimeType} · {formatFileSize(attachment.size)}
              </p>
              <p className={styles.attachmentFootnote}>
                {summary.kind === "image" &&
                  "Preview-friendly asset for design or visual review."}
                {summary.kind === "video" &&
                  "Playback asset that usually benefits from inline preview later."}
                {summary.kind === "archive" &&
                  "Bundled files that should stay explicit before download or extraction."}
                {summary.kind === "code" &&
                  "Source or log artifact that may need inspection before reply or archive."}
                {summary.kind === "document" &&
                  "Reference document kept visible for review and follow-up."}
                {summary.kind === "other" && "Stored as a standard file attachment."}
                {summary.kind === "audio" &&
                  "Audio attachment available for later playback support."}
              </p>
            </div>
            <Chip>{attachment.storageMode === "mirror" ? "Mirrored" : "Provider file"}</Chip>
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
  onLabelInputChange,
  onMarkReadToggle,
  onOpenComposer,
  onRetryFailedAction,
  onSelectBack,
  analysisState,
  selectedAccountLabel,
  selectedDetail
}: DetailColumnProps) {
  const showInlineComposer = composerOpen && composerMode !== "compose";
  const showDockComposer = composerOpen && composerMode === "compose";
  const showComposeWorkspace = showDockComposer && !selectedDetail;
  const recipientSummary = selectedDetail?.to.slice(0, 2).join(", ") || "-";
  const remainingRecipients = Math.max((selectedDetail?.to.length ?? 0) - 2, 0);
  const aiPreview = selectedDetail ? createAiPreview(selectedDetail) : null;
  const threadIntent = selectedDetail ? getThreadIntent(selectedDetail) : null;
  const [queuedActionItems, setQueuedActionItems] = useState<string[]>([]);
  const [workspaceLinked, setWorkspaceLinked] = useState(false);

  useEffect(() => {
    if (!selectedDetail) {
      setQueuedActionItems([]);
      setWorkspaceLinked(false);
      return;
    }

    setQueuedActionItems([]);
    setWorkspaceLinked(selectedDetail.labels.includes("notion-linked"));
  }, [selectedDetail]);

  function toggleQueuedActionItem(itemId: string) {
    setQueuedActionItems((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId]
    );
  }

  return (
    <section className={styles.column}>
      <header className={styles.toolbar}>
        <div className={styles.subjectBlock}>
          {selectedDetail ? (
            <>
              <div className={styles.threadMeta}>
                <Chip tone={!selectedDetail.isRead ? "active" : "default"}>
                  {getThreadStatus(selectedDetail)}
                </Chip>
                <Chip>{selectedAccountLabel}</Chip>
                <Chip>{selectedDetail.attachments.length > 0 ? "Attachments" : "No attachments"}</Chip>
              </div>
              <h2 className={styles.subject}>{selectedDetail.subject}</h2>
            </>
          ) : showComposeWorkspace ? (
            <>
              <div className={styles.threadMeta}>
                <Chip tone="active">Compose</Chip>
              </div>
              <h2 className={styles.subject}>New message</h2>
            </>
          ) : (
            <div className={styles.subjectPlaceholder}>Select a message to read it here</div>
          )}
        </div>
        <div className={styles.toolbarActions}>
          <Button variant="ghost" compact onClick={onSelectBack}>
            Back
          </Button>
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

      <div className={`${styles.body}${showInlineComposer ? ` ${styles.bodyWithReplyOverlay}` : ""}`}>
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
              <h3 className={styles.emptyTitle}>Select a message</h3>
              <p className={styles.emptyCopy}>Open any thread to review participants, context, and next action here.</p>
              <p className={styles.emptyCopy}>Keyboard: ↑↓ navigate, r reply, e archive.</p>
            </div>
          </section>
        )}

        {!showComposeWorkspace && detailFetchState === "loading" && (
          <>
            <span className={`${styles.skeleton} ${styles.skeletonTitle}`} />
            <span className={`${styles.skeleton} ${styles.skeletonMeta}`} />
            <span className={`${styles.skeleton} ${styles.skeletonBody}`} />
            <span className={`${styles.skeleton} ${styles.skeletonBody}`} />
          </>
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
          <>
            <section className={styles.overviewCard}>
              <div className={styles.overviewHero}>
                <div className={styles.overviewBlock}>
                  <span className={styles.overviewLabel}>Latest message</span>
                  <span className={styles.overviewValue}>
                    {formatParticipant(selectedDetail.fromEmail, selectedDetail.fromName)}
                  </span>
                  <p className={styles.overviewCopy}>
                    Sent to {recipientSummary}
                    {remainingRecipients > 0 ? ` +${remainingRecipients} more` : ""} via{" "}
                    {selectedAccountLabel}.
                  </p>
                </div>
                <div className={styles.overviewCallout}>
                  <span className={styles.overviewLabel}>What to do next</span>
                  <span className={styles.overviewValue}>{threadIntent?.label}</span>
                  <p className={styles.overviewCopy}>{threadIntent?.description}</p>
                </div>
              </div>

              <div className={styles.overviewFacts}>
                <div className={styles.overviewBlock}>
                  <span className={styles.overviewLabel}>Received</span>
                  <span className={styles.overviewValue}>
                    {formatReceivedAtLong(selectedDetail.receivedAt)}
                  </span>
                </div>
                <div className={styles.overviewBlock}>
                  <span className={styles.overviewLabel}>Thread</span>
                  <span className={styles.overviewValue}>
                    {selectedDetail.threadId ? "Tracked conversation" : "Single message"}
                  </span>
                </div>
                <div className={styles.overviewBlock}>
                  <span className={styles.overviewLabel}>Recipients</span>
                  <span className={styles.overviewValue}>
                    {selectedDetail.to.length + selectedDetail.cc.length}
                  </span>
                </div>
                <div className={styles.overviewBlock}>
                  <span className={styles.overviewLabel}>Attachments</span>
                  <span className={styles.overviewValue}>
                    {selectedDetail.attachments.length || "None"}
                  </span>
                </div>
              </div>
            </section>

            <details className={styles.metaBar}>
              <summary className={styles.metaSummary}>
                <span>Participants and full headers</span>
                <span>·</span>
                <span>Expand details</span>
              </summary>
              <div className={styles.metaGrid}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>From</span>
                  <span className={styles.metaValue}>
                    {formatParticipant(selectedDetail.fromEmail, selectedDetail.fromName)}
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>To</span>
                  <span className={styles.metaValue}>{selectedDetail.to.join(", ") || "-"}</span>
                </div>
                {selectedDetail.cc.length > 0 && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Cc</span>
                    <span className={styles.metaValue}>{selectedDetail.cc.join(", ")}</span>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Account</span>
                  <span className={styles.metaValue}>{selectedAccountLabel}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Received</span>
                  <span className={styles.metaValue}>
                    {formatReceivedAtLong(selectedDetail.receivedAt)}
                  </span>
                </div>
              </div>
            </details>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Thread reader</h3>
                <div className={styles.panelChips}>
                  <Chip>{detailHtml ? "HTML preferred" : "Text fallback"}</Chip>
                  <Chip>{selectedDetail.threadId ? "Latest message visible" : "Single message"}</Chip>
                </div>
              </div>
              <div className={styles.readerNote}>
                This view is showing the latest available message from the conversation. Earlier
                thread history will appear here as synced message history expands.
              </div>
              {detailHtml ? (
                <div
                  className={`${styles.bodyCard} ${styles.bodyHtml}`}
                  dangerouslySetInnerHTML={{ __html: detailHtml }}
                />
              ) : (
                <div className={styles.bodyCard}>
                  <pre>{selectedDetail.bodyText || selectedDetail.snippet || "This message is empty."}</pre>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Attachments</h3>
                <Chip>{selectedDetail.attachments.length} files</Chip>
              </div>
              {renderAttachments(selectedDetail.attachments, formatFileSize)}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>AI analysis</h3>
                <Chip>
                  {analysisState === "loading"
                    ? "Loading"
                    : analysisState === "failed"
                      ? "Unavailable"
                      : analysisState === "ready"
                        ? "Ready"
                        : "Pending"}
                </Chip>
              </div>
              {analysisState === "loading" ? (
                <div className={styles.analysisList}>
                  <article className={styles.analysisCard}>
                    <div className={styles.analysisSkeletonBlock}>
                      <span className={`${styles.skeleton} ${styles.analysisSkeletonTitle}`} />
                      <span className={`${styles.skeleton} ${styles.analysisSkeletonLine}`} />
                      <span className={`${styles.skeleton} ${styles.analysisSkeletonLineShort}`} />
                    </div>
                  </article>
                </div>
              ) : (
                <div className={styles.analysisList}>
                  <article className={styles.analysisCard}>
                    <div className={styles.analysisBody}>
                      <div className={styles.analysisBlock}>
                        <p className={styles.analysisLabel}>Summary</p>
                        <p className={styles.analysisMeta}>
                          {analysisState === "failed"
                            ? "Analysis is temporarily unavailable for this message."
                            : aiPreview?.summary}
                        </p>
                      </div>
                      {analysisState !== "failed" && aiPreview && (
                        <>
                          <div className={styles.analysisSignals}>
                            <Chip tone={aiPreview.priority === "High" ? "warning" : "active"}>
                              Priority {aiPreview.priority}
                            </Chip>
                            <Chip tone={aiPreview.needsReply ? "active" : "default"}>
                              {aiPreview.needsReply ? "Reply suggested" : "No reply needed"}
                            </Chip>
                          </div>
                          <div className={styles.analysisBlock}>
                            <p className={styles.analysisLabel}>Next action</p>
                            <div className={styles.actionItemList}>
                              {aiPreview.actionItems.map((item) => {
                                const isQueued = queuedActionItems.includes(item.id);
                                return (
                                  <article key={item.id} className={styles.actionItemCard}>
                                    <div className={styles.actionItemBody}>
                                      <p className={styles.analysisLabel}>{item.text}</p>
                                      <p className={styles.analysisMeta}>
                                        {isQueued
                                          ? "Queued for workspace review. You can remove it before anything is pushed."
                                          : "Nothing happens until you explicitly queue or send this task."}
                                      </p>
                                    </div>
                                    <Button
                                      variant={isQueued ? "ghost" : "secondary"}
                                      compact
                                      type="button"
                                      onClick={() => toggleQueuedActionItem(item.id)}
                                    >
                                      {isQueued ? "Remove from queue" : "Push to workspace"}
                                    </Button>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                          <div className={styles.analysisBlock}>
                            <p className={styles.analysisLabel}>Suggested reply opener</p>
                            <p className={styles.analysisMeta}>{aiPreview.suggestedReply}</p>
                          </div>
                          <div className={styles.analysisActions}>
                            <Button
                              variant="secondary"
                              compact
                              onClick={() => onOpenComposer("reply")}
                            >
                              Open reply draft
                            </Button>
                            <Button
                              variant="ghost"
                              compact
                              disabled={detailActionLoading}
                              onClick={onArchive}
                            >
                              Archive after review
                            </Button>
                          </div>
                          <p className={styles.analysisFootnote}>
                            AI suggestions do nothing until you choose an action.
                          </p>
                        </>
                      )}
                    </div>
                  </article>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Workspace link</h3>
                <Chip tone={workspaceLinked ? "success" : "default"}>
                  {workspaceLinked ? "Linked" : "Not linked"}
                </Chip>
              </div>
              <article className={styles.workspaceCard}>
                {workspaceLinked ? (
                  <>
                    <div className={styles.workspaceBody}>
                      <p className={styles.analysisLabel}>Connected project context</p>
                      <p className={styles.analysisMeta}>
                        This thread is linked to a workspace page for {selectedDetail.subject}.
                        Related context can be enriched here before you archive or reply.
                      </p>
                    </div>
                    <div className={styles.workspaceActions}>
                      <Button variant="secondary" compact type="button">
                        Open workspace page
                      </Button>
                      <Button
                        variant="ghost"
                        compact
                        type="button"
                        onClick={() => setWorkspaceLinked(false)}
                      >
                        Unlink preview
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.workspaceBody}>
                      <p className={styles.analysisLabel}>No workspace linked yet</p>
                      <p className={styles.analysisMeta}>
                        Link this thread when it belongs to a project, task, or shared knowledge
                        page. The preview is local until a real integration is connected.
                      </p>
                    </div>
                    <div className={styles.workspaceActions}>
                      <Button
                        variant="secondary"
                        compact
                        type="button"
                        onClick={() => setWorkspaceLinked(true)}
                      >
                        Link thread
                      </Button>
                    </div>
                  </>
                )}
              </article>
            </section>
          </>
        )}
      </div>

      {showInlineComposer && selectedDetail && (
        <section className={styles.replyOverlay}>
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
    </section>
  );
}

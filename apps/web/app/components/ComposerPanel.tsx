"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PaperclipIcon } from "./icons";
import {
  COMPOSER_ATTACHMENT_HARD_SIZE,
  COMPOSER_ATTACHMENT_WARNING_SIZE,
  ComposerAttachmentItem,
  getComposerAttachmentWarnings,
  getAttachmentSummary
} from "./attachmentUtils";
import { Button } from "./ui/Button";
import { Chip } from "./ui/Chip";
import { Kbd } from "./ui/Kbd";
import styles from "./ComposerPanel.module.css";

interface AccountOption {
  id: string;
  displayName: string;
}

interface ComposerDraft {
  accountId: string;
  bodyHtml: string;
  bodyText: string;
  cc: string;
  subject: string;
  to: string;
}

interface ComposerContext {
  from?: string;
  receivedAt?: string;
  subject?: string;
}

interface ComposerAppearance {
  fontFamily: "geist" | "mono" | "pretendard";
}

interface ComposerPanelProps {
  accounts: AccountOption[];
  attachments: ComposerAttachmentItem[];
  appearance: ComposerAppearance;
  context?: ComposerContext;
  draft: ComposerDraft;
  error: string;
  formatFileSize: (size: number) => string;
  mode: "compose" | "reply" | "replyAll" | "forward";
  onAttachFiles: (files: FileList | null) => void;
  onAppearanceChange: (appearance: ComposerAppearance) => void;
  onChange: (field: keyof ComposerDraft, value: string) => void;
  onClose: () => void;
  onRemoveAttachment: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  sending: boolean;
  success: string;
}

function getModeCopy(mode: ComposerPanelProps["mode"]) {
  if (mode === "compose") {
    return { eyebrow: "New message", title: "Compose message" };
  }

  if (mode === "reply") {
    return { eyebrow: "Reply", title: "Reply to message" };
  }

  if (mode === "replyAll") {
    return { eyebrow: "Reply all", title: "Reply to everyone" };
  }

  return { eyebrow: "Forward", title: "Forward message" };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToEditorHtml(value: string) {
  if (!value.trim()) {
    return "";
  }

  return value
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "<div><br></div>" : `<div>${escapeHtml(line)}</div>`))
    .join("");
}

export function ComposerPanel({
  accounts,
  attachments,
  appearance,
  context,
  draft,
  error,
  formatFileSize,
  mode,
  onAttachFiles,
  onAppearanceChange,
  onChange,
  onClose,
  onRemoveAttachment,
  onSubmit,
  sending,
  success
}: ComposerPanelProps) {
  const copy = getModeCopy(mode);
  const requiresAccount = mode === "compose";
  const recipientCount = draft.to
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean).length;
  const bodyLength = draft.bodyText.trim().length;
  const showThreadContext = mode !== "compose" && Boolean(context?.subject || context?.from);
  const isReplyMode = mode !== "compose";
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const attachmentCount = attachments.length;
  const largeAttachmentCount = attachments.filter(
    (attachment) => attachment.size >= COMPOSER_ATTACHMENT_WARNING_SIZE
  ).length;
  const blockedSizeCount = attachments.filter(
    (attachment) => attachment.size >= COMPOSER_ATTACHMENT_HARD_SIZE
  ).length;
  const riskyAttachmentCount = attachments.filter(
    (attachment) => getComposerAttachmentWarnings(attachment).length > 0
  ).length;

  function syncEditorState() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const html = editor.innerHTML === "<br>" ? "" : editor.innerHTML;
    const text = editor.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n");
    onChange("bodyHtml", html);
    onChange("bodyText", text.trimEnd());
  }

  function focusEditor() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
  }

  function applyExecCommand(command: string, value?: string) {
    focusEditor();
    document.execCommand(command, false, value);
    syncEditorState();
  }

  function insertChecklist() {
    focusEditor();
    document.execCommand(
      "insertHTML",
      false,
      '<ul data-mail-agent-checklist="true"><li>Checklist item</li></ul>'
    );
    syncEditorState();
  }

  function insertLink() {
    focusEditor();
    const selection = window.getSelection()?.toString().trim();
    document.execCommand("createLink", false, "https://example.com");
    if (!selection) {
      document.execCommand("insertText", false, "link");
    }
    syncEditorState();
  }

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextHtml = draft.bodyHtml.trim() || plainTextToEditorHtml(draft.bodyText);
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [draft.bodyHtml, draft.bodyText]);

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      applyExecCommand(event.shiftKey ? "outdent" : "indent");
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      applyExecCommand("bold");
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      applyExecCommand("italic");
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      insertLink();
    }
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    onAttachFiles(event.dataTransfer.files);
  }

  return (
    <section
      className={`${styles.composer} ${mode === "compose" ? styles.dock : styles.inline}${
        isReplyMode ? ` ${styles.replyOverlayPanel}` : ""
      }`}
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h2 className={styles.title}>{copy.title}</h2>
          <p className={styles.subcopy}>
            {requiresAccount
              ? "Choose an account and draft a new outbound message."
              : "Review the thread context, then send a reply when you are ready."}
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </header>

      <form id="composer-form" className={styles.form} onSubmit={onSubmit}>
        {showThreadContext && (
          <section className={styles.contextCard} aria-label="Reply context">
            <div className={styles.contextHeader}>
              <span className={styles.contextTitle}>Thread context</span>
              {context?.receivedAt && <span className={styles.contextMeta}>{context.receivedAt}</span>}
            </div>
            {context?.subject && <p className={styles.contextSubject}>{context.subject}</p>}
            {context?.from && <p className={styles.contextMeta}>From {context.from}</p>}
          </section>
        )}

        {requiresAccount && (
          <label className={styles.field}>
            <span className={styles.label}>Account</span>
            <select
              autoFocus={requiresAccount}
              className={styles.select}
              value={draft.accountId}
              onChange={(event) => onChange("accountId", event.target.value)}
              disabled={!requiresAccount || sending}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={styles.field}>
          <span className={styles.label}>To</span>
          <input
            autoFocus={!requiresAccount}
            className={styles.input}
            type="text"
            value={draft.to}
            onChange={(event) => onChange("to", event.target.value)}
            placeholder="person@example.com, team@example.com"
            disabled={sending}
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Cc</span>
            <input
              className={styles.input}
              type="text"
              value={draft.cc}
              onChange={(event) => onChange("cc", event.target.value)}
              placeholder="Optional"
              disabled={sending}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Subject</span>
            <input
              className={styles.input}
              type="text"
              value={draft.subject}
              onChange={(event) => onChange("subject", event.target.value)}
              placeholder="Subject"
              disabled={sending}
            />
          </label>
        </div>

        <section className={styles.field} aria-label="Composer formatting">
          <div className={styles.labelRow}>
            <span className={styles.label}>Formatting</span>
            <span className={styles.metaPill}>Default font: Pretendard</span>
          </div>
          <div className={styles.toolbar}>
            <label className={styles.fontSelectWrap}>
              <span className={styles.toolbarLabel}>Font</span>
              <select
                className={styles.toolbarSelect}
                value={appearance.fontFamily}
                onChange={(event) =>
                  onAppearanceChange({
                    fontFamily: event.target.value as ComposerAppearance["fontFamily"]
                  })
                }
              >
                <option value="pretendard">Pretendard</option>
                <option value="geist">Geist</option>
                <option value="mono">IBM Plex Mono</option>
              </select>
            </label>
            <div className={styles.toolbarActions}>
              <Button compact type="button" variant="secondary" onClick={() => applyExecCommand("bold")}>
                Bold
              </Button>
              <Button compact type="button" variant="secondary" onClick={() => applyExecCommand("italic")}>
                Italic
              </Button>
              <Button compact type="button" variant="secondary" onClick={() => applyExecCommand("insertUnorderedList")}>
                Bullet
              </Button>
              <Button compact type="button" variant="secondary" onClick={() => applyExecCommand("insertOrderedList")}>
                Numbered
              </Button>
              <Button compact type="button" variant="secondary" onClick={() => applyExecCommand("formatBlock", "blockquote")}>
                Quote
              </Button>
              <Button compact type="button" variant="secondary" onClick={() => applyExecCommand("formatBlock", "h2")}>
                Heading
              </Button>
              <Button compact type="button" variant="secondary" onClick={insertChecklist}>
                Checklist
              </Button>
              <Button compact type="button" variant="secondary" onClick={insertLink}>
                Link
              </Button>
            </div>
          </div>
          <p className={styles.toolbarHint}>
            Use <Kbd>Tab</Kbd> to indent and <Kbd>Shift+Tab</Kbd> to outdent inside the body editor.
          </p>
        </section>

        <div className={styles.field}>
          <span className={styles.labelRow}>
            <span className={styles.label}>Body</span>
            <span className={styles.metaPill}>
              {recipientCount} recipient{recipientCount === 1 ? "" : "s"} · {bodyLength} chars
            </span>
          </span>
          <div
            ref={editorRef}
            className={`${styles.editor} ${styles[appearance.fontFamily]}`}
            contentEditable={!sending}
            suppressContentEditableWarning
            data-placeholder="Write your message"
            onInput={syncEditorState}
            onKeyDown={handleEditorKeyDown}
            role="textbox"
            aria-multiline="true"
          />
        </div>

        <section className={styles.field} aria-label="Attachments">
          <div className={styles.labelRow}>
            <span className={styles.label}>Attachments</span>
            <div className={styles.attachmentMetaGroup}>
              {blockedSizeCount > 0 && (
                <Chip tone="danger">
                  {blockedSizeCount} oversize file{blockedSizeCount === 1 ? "" : "s"}
                </Chip>
              )}
              {largeAttachmentCount > 0 && (
                <Chip tone="warning">
                  {largeAttachmentCount} large file{largeAttachmentCount === 1 ? "" : "s"}
                </Chip>
              )}
              <span className={styles.metaPill}>
                {attachmentCount} file{attachmentCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <label
            className={`${styles.dropzone}${isDragActive ? ` ${styles.dropzoneActive}` : ""}`}
            onDragEnter={() => setIsDragActive(true)}
            onDragLeave={() => setIsDragActive(false)}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isDragActive) {
                setIsDragActive(true);
              }
            }}
            onDrop={handleDrop}
          >
            <input
              className={styles.fileInput}
              type="file"
              multiple
              onChange={(event) => {
                onAttachFiles(event.target.files);
                event.currentTarget.value = "";
              }}
              disabled={sending}
            />
            <div className={styles.dropzoneBody}>
              <span className={styles.dropzoneIcon}>
                <PaperclipIcon width={18} height={18} />
              </span>
              <div className={styles.dropzoneCopy}>
                <strong>Drop files here or click to browse</strong>
                <span>Images, video, zip, code files, and documents are supported in the UI.</span>
              </div>
            </div>
          </label>
          {attachments.length > 0 ? (
            <>
              <div className={styles.attachmentStatus} aria-live="polite">
                {blockedSizeCount > 0
                  ? "Some files exceed the recommended 25 MB send size and may fail in a real transport flow."
                  : riskyAttachmentCount > 0
                    ? "Some attachments need review because of size or file type."
                    : "All attached files are queued and ready in this MVP draft."}
              </div>
              <div className={styles.attachmentList}>
              {attachments.map((attachment) => {
                const summary = getAttachmentSummary(attachment);
                const warnings = getComposerAttachmentWarnings(attachment);
                const isLarge = attachment.size >= COMPOSER_ATTACHMENT_WARNING_SIZE;
                const isOversize = attachment.size >= COMPOSER_ATTACHMENT_HARD_SIZE;

                return (
                  <article key={attachment.id} className={styles.attachmentCard}>
                    {summary.kind === "image" && attachment.previewUrl ? (
                      <div className={styles.attachmentPreview}>
                        <img
                          src={attachment.previewUrl}
                          alt={`${summary.filename} preview`}
                          className={styles.attachmentPreviewImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.attachmentPreviewFallback}>
                        <span>{summary.kindLabel}</span>
                      </div>
                    )}
                    <div className={styles.attachmentBody}>
                      <div className={styles.attachmentHeader}>
                        <p className={styles.attachmentName}>{summary.filename}</p>
                        <div className={styles.attachmentChips}>
                          <Chip tone={summary.tone}>{summary.kindLabel}</Chip>
                          {isOversize && <Chip tone="danger">Oversize</Chip>}
                          {isLarge && <Chip tone="warning">Large</Chip>}
                        </div>
                      </div>
                      <p className={styles.attachmentMeta}>
                        {summary.mimeType} · {formatFileSize(attachment.size)}
                      </p>
                      <p className={styles.attachmentState}>
                        {isOversize
                          ? "Kept in draft with an oversize warning."
                          : isLarge
                            ? "Kept in draft with a size warning."
                          : summary.kind === "image"
                            ? "Thumbnail preview available in the composer."
                            : "Attached and ready in the current draft."}
                      </p>
                      {warnings.length > 0 && (
                        <div className={styles.attachmentWarnings}>
                          {warnings.map((warning) => (
                            <Chip key={warning} tone={warning.includes("risky") ? "danger" : "warning"}>
                              {warning}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      compact
                      type="button"
                      onClick={() => onRemoveAttachment(attachment.id)}
                    >
                      Remove
                    </Button>
                  </article>
                );
              })}
              </div>
            </>
          ) : (
            <div className={styles.attachmentEmpty}>
              No files attached yet. Drag files in or click the drop area to add them.
            </div>
          )}
        </section>

        {(error || success) && (
          <p className={styles.hint} aria-live="polite">
            {error || success}
          </p>
        )}

        <div className={styles.footer}>
          <span className={styles.hint}>
            <Kbd>Esc</Kbd>
            <span>Dismiss</span>
            <Kbd>Cmd+Enter</Kbd>
            <span>Send</span>
          </span>
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              shortcut="Cmd+Enter"
              tooltip="Send message"
              type="submit"
              disabled={
                sending ||
                !draft.subject.trim() ||
                !draft.bodyText.trim() ||
                !draft.to.trim() ||
                (requiresAccount && !draft.accountId.trim())
              }
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}

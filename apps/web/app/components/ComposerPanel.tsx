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
    return { eyebrow: "New message", title: "새 메일 작성" };
  }

  if (mode === "reply") {
    return { eyebrow: "Reply", title: "답장 작성" };
  }

  if (mode === "replyAll") {
    return { eyebrow: "Reply all", title: "전체 답장 작성" };
  }

  return { eyebrow: "Forward", title: "메일 전달" };
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
  const [showCc, setShowCc] = useState(Boolean(draft.cc.trim()));
  const [isDragActive, setIsDragActive] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastInternalHtmlRef = useRef<string>("");

  const recipientCount = draft.to
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean).length;
  const bodyLength = draft.bodyText.trim().length;

  function syncEditorState() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const html = editor.innerHTML === "<br>" ? "" : editor.innerHTML;
    const text = editor.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n");
    lastInternalHtmlRef.current = html;
    onChange("bodyHtml", html);
    onChange("bodyText", text);
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

    const incomingHtml = draft.bodyHtml || plainTextToEditorHtml(draft.bodyText);
    if (incomingHtml !== lastInternalHtmlRef.current && editor.innerHTML !== incomingHtml) {
      editor.innerHTML = incomingHtml;
      lastInternalHtmlRef.current = incomingHtml;
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

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    onAttachFiles(event.dataTransfer.files);
  }

  const isFormValid =
    !sending &&
    draft.subject.trim().length > 0 &&
    draft.bodyText.trim().length > 0 &&
    draft.to.trim().length > 0 &&
    (!requiresAccount || draft.accountId.trim().length > 0);

  return (
    <section className={styles.composerCard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleArea}>
          <span className={styles.eyebrowBadge}>{copy.eyebrow}</span>
          <h3 className={styles.title}>{copy.title}</h3>
        </div>
        <Button variant="ghost" compact onClick={onClose}>
          ✕ Close
        </Button>
      </header>

      <form id="composer-form" className={styles.form} onSubmit={onSubmit}>
        {/* Recipient & Metadata Section */}
        <div className={styles.fieldsContainer}>
          {requiresAccount && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>보내는 계정</span>
              <select
                autoFocus={requiresAccount}
                className={styles.selectInput}
                value={draft.accountId}
                onChange={(event) => onChange("accountId", event.target.value)}
                disabled={sending}
              >
                <option value="">계정 선택</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>받는 사람</span>
            <div className={styles.inputWithToggle}>
              <input
                autoFocus={!requiresAccount}
                className={styles.textInput}
                type="text"
                value={draft.to}
                onChange={(event) => onChange("to", event.target.value)}
                placeholder="이메일 주소 입력 (쉼표로 구분)"
                disabled={sending}
              />
              {!showCc && (
                <button
                  type="button"
                  className={styles.toggleCcButton}
                  onClick={() => setShowCc(true)}
                >
                  Cc 참조 추가
                </button>
              )}
            </div>
          </div>

          {showCc && (
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>참조 (Cc)</span>
              <input
                className={styles.textInput}
                type="text"
                value={draft.cc}
                onChange={(event) => onChange("cc", event.target.value)}
                placeholder="참조 이메일 주소 (선택)"
                disabled={sending}
              />
            </div>
          )}

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>제목</span>
            <input
              className={styles.textInput}
              type="text"
              value={draft.subject}
              onChange={(event) => onChange("subject", event.target.value)}
              placeholder="메일 제목"
              disabled={sending}
            />
          </div>
        </div>

        {/* Unified Rich Text Editor Box */}
        <div
          className={`${styles.editorBox}${isDragActive ? ` ${styles.editorBoxDragOver}` : ""}`}
          onDragEnter={() => setIsDragActive(true)}
          onDragLeave={() => setIsDragActive(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Integrated Editor Toolbar */}
          <div className={styles.editorToolbar}>
            <div className={styles.toolbarButtonGroup}>
              <button
                type="button"
                className={styles.toolBtn}
                title="Bold (Ctrl+B)"
                onClick={() => applyExecCommand("bold")}
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                title="Italic (Ctrl+I)"
                onClick={() => applyExecCommand("italic")}
              >
                <em>I</em>
              </button>
              <span className={styles.toolbarDivider} />
              <button
                type="button"
                className={styles.toolBtn}
                title="Bullet List"
                onClick={() => applyExecCommand("insertUnorderedList")}
              >
                • List
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                title="Numbered List"
                onClick={() => applyExecCommand("insertOrderedList")}
              >
                1. List
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                title="Quote"
                onClick={() => applyExecCommand("formatBlock", "blockquote")}
              >
                “ Quote
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                title="Link (Ctrl+K)"
                onClick={insertLink}
              >
                🔗 Link
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                title="Checklist"
                onClick={insertChecklist}
              >
                ☑ Checklist
              </button>
            </div>

            <div className={styles.toolbarRightGroup}>
              <select
                className={styles.fontSelect}
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
            </div>
          </div>

          {/* Editor Editable Body */}
          <div
            ref={editorRef}
            className={`${styles.editorArea} ${styles[appearance.fontFamily]}`}
            contentEditable={!sending}
            suppressContentEditableWarning
            data-placeholder="메일 내용을 작성하세요..."
            onInput={syncEditorState}
            onKeyDown={handleEditorKeyDown}
            role="textbox"
            aria-multiline="true"
          />

          {/* Attached Files List (Inside Editor Box) */}
          {attachments.length > 0 && (
            <div className={styles.attachmentChipsContainer}>
              <div className={styles.attachmentChipsHeader}>
                <span className={styles.attachmentChipsTitle}>첨부파일 ({attachments.length})</span>
              </div>
              <div className={styles.attachmentChipsList}>
                {attachments.map((attachment) => {
                  const summary = getAttachmentSummary(attachment);
                  const warnings = getComposerAttachmentWarnings(attachment);
                  const isLarge = attachment.size >= COMPOSER_ATTACHMENT_WARNING_SIZE;
                  const isOversize = attachment.size >= COMPOSER_ATTACHMENT_HARD_SIZE;

                  return (
                    <div key={attachment.id} className={styles.attachedChip}>
                      <span className={styles.attachedChipName}>{summary.filename}</span>
                      <span className={styles.attachedChipSize}>({formatFileSize(attachment.size)})</span>
                      {isOversize && <Chip tone="danger">용량초과</Chip>}
                      {isLarge && !isOversize && <Chip tone="warning">대용량</Chip>}
                      <button
                        type="button"
                        className={styles.attachedChipRemove}
                        onClick={() => onRemoveAttachment(attachment.id)}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.hiddenFileInput}
          onChange={(event) => {
            onAttachFiles(event.target.files);
            event.currentTarget.value = "";
          }}
          disabled={sending}
        />

        {/* Error / Success feedback */}
        {(error || success) && (
          <div className={error ? styles.errorNotice : styles.successNotice} aria-live="polite">
            {error || success}
          </div>
        )}

        {/* Sticky Action Footer */}
        <footer className={styles.stickyFooter}>
          <div className={styles.footerLeft}>
            <button
              type="button"
              className={styles.attachButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <PaperclipIcon width={16} height={16} />
              <span>파일 첨부</span>
            </button>
            <span className={styles.metaInfo}>
              {recipientCount > 0 && `${recipientCount}명에게 발송 · `}{bodyLength}자
            </span>
          </div>

          <div className={styles.footerRight}>
            <span className={styles.shortcutHint}>
              <Kbd>Esc</Kbd> 닫기 · <Kbd>Cmd+Enter</Kbd> 전송
            </span>
            <Button variant="secondary" type="button" onClick={onClose}>
              취소
            </Button>
            <Button
              variant="primary"
              shortcut="Cmd+Enter"
              tooltip="Send message"
              type="submit"
              disabled={!isFormValid}
            >
              {sending ? "전송 중..." : "전송"}
            </Button>
          </div>
        </footer>
      </form>
    </section>
  );
}

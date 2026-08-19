"use client";

import { useState } from "react";
import { MailIcon, SparkIcon, LayersIcon, StarIcon } from "./icons";
import styles from "./LoginGate.module.css";

interface LoginGateProps {
  onLogin: () => Promise<void>;
  error?: string | null;
}

export function LoginGate({ onLogin, error }: LoginGateProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      await onLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoBadge}>
          <MailIcon style={{ width: 28, height: 28 }} />
        </div>

        <h1 className={styles.title}>Mail Agent</h1>
        <p className={styles.subtitle}>
          AI 기반 지능형 메일 워크스페이스에 오신 것을 환영합니다.<br />
          Google 계정으로 로그인하여 나만의 메일함을 시작하세요.
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <SparkIcon style={{ width: 16, height: 16 }} />
            </div>
            <span>AI 기반 자동 분류, 요약 및 스마트 답장 추천</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <LayersIcon style={{ width: 16, height: 16 }} />
            </div>
            <span>완벽히 격리된 안전한 개인 워크스페이스</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <StarIcon style={{ width: 16, height: 16 }} />
            </div>
            <span>Notion 및 다양한 생산성 도구 연동 지원</span>
          </div>
        </div>

        <button
          className={styles.googleButton}
          onClick={handleConnect}
          disabled={loading}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          {loading ? "Google 로그인 연결 중..." : "Google 계정으로 시작하기"}
        </button>

        <p className={styles.footerNote}>
          Google OAuth 2.0 공식 표준을 통해 안전하게 인증되며,<br />
          비밀번호는 일체 저장되지 않습니다.
        </p>

        <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", width: "100%" }}>
          <a
            href="/download"
            style={{
              color: "#818cf8",
              fontSize: "13px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>💻 데스크탑 앱(100% 로컬 AI & DB) 다운로드 →</span>
          </a>
        </div>
      </div>
    </div>
  );
}

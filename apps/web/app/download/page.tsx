"use client";

import Link from "next/link";
import { MailIcon, SparkIcon, LayersIcon, StarIcon } from "../components/icons";
import styles from "./download.module.css";

export default function DownloadPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerNav}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <MailIcon style={{ width: 20, height: 20 }} />
          </div>
          <span>Mail Agent</span>
        </Link>
        <Link href="/" className={styles.backLink}>
          ← 웹 메일함으로 돌아가기
        </Link>
      </header>

      <main className={styles.heroSection}>
        <div className={styles.badge}>
          <SparkIcon style={{ width: 14, height: 14 }} />
          <span>Desktop Edition · 100% 온디바이스 로컬 AI & 보안</span>
        </div>
        <h1 className={styles.title}>Mail Agent 데스크탑 다운로드</h1>
        <p className={styles.subtitle}>
          외부 클라우드로 이메일 본문을 전송하지 않고, 내 PC에서 로컬 AI 모델(Qwen 4B)과<br />
          로컬 데이터베이스를 통해 안전하고 빠른 메일 워크스페이스를 경험하세요.
        </p>
      </main>

      <section className={styles.downloadGrid}>
        {/* Windows Card */}
        <div className={styles.downloadCard}>
          <div className={styles.platformHeader}>
            <div className={styles.platformIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.802" />
              </svg>
            </div>
            <div>
              <h2 className={styles.platformName}>Windows</h2>
              <p className={styles.platformDesc}>Windows 10 / 11 (64-bit)</p>
            </div>
          </div>

          <div className={styles.specList}>
            <div className={styles.specItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>llama.cpp 기반 Qwen 4B 로컬 AI 모델 내장</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>PC 로컬 스토리지 데이터 격리 저장</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>오프라인 캐싱 및 백그라운드 실시간 동기화</span>
            </div>
          </div>

          <a
            href="https://github.com/jsk0910/Mail-Agent/releases/latest"
            target="_blank"
            rel="noreferrer"
            className={styles.downloadButton}
          >
            <span>Windows용 다운로드 (.zip)</span>
          </a>
          <span className={styles.cardFooter}>버전 0.1.0 Beta · x64 아키텍처</span>
        </div>

        {/* macOS Card */}
        <div className={styles.downloadCard}>
          <div className={styles.platformHeader}>
            <div className={styles.platformIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.96 2.77 1.01.08 2.06-.52 2.69-1.27z" />
              </svg>
            </div>
            <div>
              <h2 className={styles.platformName}>macOS</h2>
              <p className={styles.platformDesc}>macOS 12.0+ (Apple Silicon & Intel)</p>
            </div>
          </div>

          <div className={styles.specList}>
            <div className={styles.specItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>Apple Silicon (Metal GPU 가속) 지원</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>로컬 AI 추론 및 초고속 메일 요약/답장 추천</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>macOS 네이티브 알림 및 단축키(⌘K) 통합</span>
            </div>
          </div>

          <a
            href="https://github.com/jsk0910/Mail-Agent/releases/latest"
            target="_blank"
            rel="noreferrer"
            className={styles.downloadButton}
          >
            <span>macOS용 다운로드 (.dmg)</span>
          </a>
          <span className={styles.cardFooter}>Universal Binary (M1/M2/M3 & Intel)</span>
        </div>
      </section>

      {/* Local Advantage Features */}
      <section className={styles.featureGrid} style={{ marginBottom: "48px" }}>
        <div className={styles.featureBox}>
          <div className={styles.featureBoxIcon}>
            <LayersIcon style={{ width: 20, height: 20 }} />
          </div>
          <h3 className={styles.featureBoxTitle}>100% 로컬 데이터베이스</h3>
          <p className={styles.featureBoxDesc}>
            데스크탑 앱은 외부 중앙 서버에 의존하지 않고 PC 로컬 저장소에 메일 및 설정을 보관하여
            궁극의 보안과 프라이버시를 보장합니다.
          </p>
        </div>

        <div className={styles.featureBox}>
          <div className={styles.featureBoxIcon}>
            <SparkIcon style={{ width: 20, height: 20 }} />
          </div>
          <h3 className={styles.featureBoxTitle}>온디바이스 Qwen 4B AI</h3>
          <p className={styles.featureBoxDesc}>
            OpenAI나 클라우드 API 호출 비용 없이, PC 하드웨어(CPU/GPU) 자원을 활용해
            무제한으로 메일 분석, 카테고리 분류 및 답장 추천을 실행합니다.
          </p>
        </div>

        <div className={styles.featureBox}>
          <div className={styles.featureBoxIcon}>
            <StarIcon style={{ width: 20, height: 20 }} />
          </div>
          <h3 className={styles.featureBoxTitle}>오프라인 환경에서도 작동</h3>
          <p className={styles.featureBoxDesc}>
            인터넷 연결이 불안정하거나 비행기 모드에서도 기존 메일 검색, 작성, AI 초안 작성이
            즉시 가능합니다.
          </p>
        </div>
      </section>

      {/* Local Build & Run Guide */}
      <section
        style={{
          width: "100%",
          maxWidth: "900px",
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "16px",
          padding: "28px 32px"
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>
          ⚡ 로컬 PC에서 즉시 실행 및 패키징 빌드하기
        </h3>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.6 }}>
          현재 저장소 코드를 내려받은 상태라면 터미널에서 다음 명령어로 데스크탑 앱을 즉시 띄우거나 설치 파일(.zip)을 생성할 수 있습니다:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 600 }}>1. 데스크탑 앱 즉시 실행 (개발 모드)</span>
            <pre style={{ margin: "6px 0 0", padding: "12px 16px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#a5b4fc", fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
              npm run dev:desktop
            </pre>
          </div>
          <div>
            <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 600 }}>2. Windows 독립 실행 패키지(.zip) 생성</span>
            <pre style={{ margin: "6px 0 0", padding: "12px 16px", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#a5b4fc", fontSize: "13px", fontFamily: "monospace", overflowX: "auto" }}>
              npm run package:desktop:win
            </pre>
            <span style={{ fontSize: "12px", color: "#64748b", display: "inline-block", marginTop: "4px" }}>
              빌드 완료 시 <code>apps/desktop/release/</code> 경로에 Windows 실행용 압축 파일이 생성됩니다.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

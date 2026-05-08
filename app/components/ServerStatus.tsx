'use client';

import { useState } from 'react';
import styles from './ServerStatus.module.css';

interface ServerStatusProps {
  running: boolean | null;
  loading: boolean;
  lastUpdated: Date | null;
}

const SERVER_ADDRESS = `${process.env.NEXT_PUBLIC_SERVER_IP}:25565`;

export default function ServerStatus({ running, loading, lastUpdated }: ServerStatusProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SERVER_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>서버 상태</h2>
      <div className={styles.statusRow}>
        {loading && running === null ? (
          <span className={styles.loading}>확인 중...</span>
        ) : (
          <>
            <span className={`${styles.dot} ${running ? styles.online : styles.offline}`} />
            <span className={`${styles.label} ${running ? styles.onlineText : styles.offlineText}`}>
              {running ? '온라인' : '오프라인'}
            </span>
          </>
        )}
      </div>

      {running && (
        <div className={styles.addressRow}>
          <span className={styles.address}>{SERVER_ADDRESS}</span>
          <button className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} onClick={handleCopy}>
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      )}

      {lastUpdated && (
        <p className={styles.timestamp}>
          마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
        </p>
      )}
    </div>
  );
}

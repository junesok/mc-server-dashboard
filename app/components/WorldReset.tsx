'use client';

import { useState } from 'react';
import styles from './WorldReset.module.css';

interface WorldResetProps {
  onReset: () => void;
}

export default function WorldReset({ onReset }: WorldResetProps) {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleReset = async () => {
    const confirmMsg = seed
      ? `맵을 시드 "${seed}"로 초기화하시겠습니까?\n현재 맵 데이터가 영구적으로 삭제됩니다.`
      : '맵을 초기화하시겠습니까?\n현재 맵 데이터가 영구적으로 삭제됩니다.';

    if (!confirm(confirmMsg)) return;
    if (!confirm('정말로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/reset-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: seed.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setMessage(data.message);
        setSeed('');
        setTimeout(() => onReset(), 3000);
      } else {
        setIsError(true);
        setMessage(data.error || '맵 초기화 실패');
      }
    } catch {
      setIsError(true);
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>맵 초기화</h2>
      <p className={styles.warning}>
        맵 초기화 시 현재 월드 데이터가 영구적으로 삭제됩니다.
      </p>
      <div className={styles.seedRow}>
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="시드 입력 (선택사항, 빈칸 = 랜덤)"
          className={styles.input}
          disabled={loading}
        />
        <button
          className={styles.resetBtn}
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? '초기화 중...' : '맵 초기화'}
        </button>
      </div>
      {message && (
        <p className={`${styles.message} ${isError ? styles.errorMsg : styles.successMsg}`}>
          {message}
        </p>
      )}
    </div>
  );
}

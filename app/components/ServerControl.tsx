'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ServerControl.module.css';

interface ServerControlProps {
  onAction: () => void;
  running: boolean | null;
  statusLoading: boolean;
}

type ActionType = 'stop' | 'restart';

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
}

export default function ServerControl({ onAction, running, statusLoading }: ServerControlProps) {
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | 'restart' | null>(null);
  const [pending, setPending] = useState<'start' | 'stop' | 'restart' | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showStartOptions, setShowStartOptions] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const restartPhase = useRef<'stopping' | 'starting'>('stopping');

  // 서버 상태 변화로 pending 해제
  useEffect(() => {
    if (pending === null || running === null) return;

    if (pending === 'start' && running === true) {
      setPending(null);
      setMessage('');
    }
    if (pending === 'stop' && running === false) {
      setPending(null);
      setMessage('');
    }
    if (pending === 'restart') {
      if (restartPhase.current === 'stopping' && running === false) {
        restartPhase.current = 'starting';
      } else if (restartPhase.current === 'starting' && running === true) {
        restartPhase.current = 'stopping';
        setPending(null);
        setMessage('');
      }
    }
  }, [running, pending]);

  // 90초 안전 타임아웃 (서버 응답 없을 때 잠금 해제)
  useEffect(() => {
    if (pending === null) return;
    const t = setTimeout(() => {
      setPending(null);
      restartPhase.current = 'stopping';
    }, 90000);
    return () => clearTimeout(t);
  }, [pending]);

  const openStartOptions = async () => {
    setShowStartOptions(true);
    setUpdateInfo(null);
    setUpdateError('');
    setUpdateLoading(true);
    try {
      const res = await fetch('/api/check-update');
      const data = await res.json();
      if (res.ok) {
        setUpdateInfo(data);
      } else {
        setUpdateError(data.error || '버전 정보 조회 실패');
      }
    } catch {
      setUpdateError('네트워크 오류가 발생했습니다.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleStart = async (updateMode: 'none' | 'update') => {
    setShowStartOptions(false);
    setActionLoading('start');
    setMessage(updateMode !== 'none' ? '업데이트 다운로드 중... (최대 2분 소요)' : '');
    setIsError(false);
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateMode }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setMessage('서버 시작 중...');
        setPending('start');
        onAction();
      } else {
        setIsError(true);
        setMessage(data.error || '알 수 없는 오류');
      }
    } catch {
      setIsError(true);
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action: ActionType) => {
    const labels: Record<ActionType, string> = {
      stop: '서버를 중지하시겠습니까? 접속 중인 플레이어가 연결 해제됩니다.',
      restart: '서버를 재시작하시겠습니까? 접속 중인 플레이어가 잠시 연결 해제됩니다.',
    };
    if (!confirm(labels[action])) return;

    if (action === 'restart') restartPhase.current = 'stopping';

    setActionLoading(action);
    setMessage('');
    setIsError(false);
    try {
      const res = await fetch(`/api/${action}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsError(false);
        setMessage(action === 'stop' ? '서버 중지 중...' : '서버 재시작 중...');
        setPending(action);
        onAction();
      } else {
        setIsError(true);
        setMessage(data.error || '알 수 없는 오류');
      }
    } catch {
      setIsError(true);
      setMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const isLocked = actionLoading !== null || pending !== null || statusLoading;

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>서버 제어</h2>
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.btn} ${styles.start}`}
          onClick={openStartOptions}
          disabled={isLocked || running === true || showStartOptions}
        >
          {actionLoading === 'start' ? '시작 중...' : '▶ 시작'}
        </button>
        <button
          className={`${styles.btn} ${styles.stop}`}
          onClick={() => handleAction('stop')}
          disabled={isLocked || running !== true || pending === 'start'}
        >
          {actionLoading === 'stop' ? '중지 중...' : '■ 중지'}
        </button>
        <button
          className={`${styles.btn} ${styles.restart}`}
          onClick={() => handleAction('restart')}
          disabled={isLocked || running !== true || pending === 'start'}
        >
          {actionLoading === 'restart' ? '재시작 중...' : '↺ 재시작'}
        </button>
      </div>

      {showStartOptions && (
        <div className={styles.startOptions}>
          <p className={styles.startOptionsTitle}>업데이트 선택</p>
          {updateLoading && <p className={styles.checkingText}>버전 확인 중...</p>}
          {updateError && <p className={styles.errorInline}>{updateError}</p>}
          {!updateLoading && (
            <>
              {updateInfo && (
                <span className={styles.versionBadge}>
                  현재: {updateInfo.currentVersion || '알 수 없음'}
                </span>
              )}
              <div className={styles.optionList}>
                <button className={styles.optionBtn} onClick={() => handleStart('none')}>
                  <span className={styles.optionLabel}>업데이트 없이 시작</span>
                  <span className={styles.optionDesc}>현재 버전 그대로 실행합니다</span>
                </button>
                {updateInfo && (
                  <button
                    className={styles.optionBtn}
                    onClick={() => handleStart('update')}
                    disabled={!updateInfo.hasUpdate}
                  >
                    <span className={styles.optionLabel}>최신 버전으로 업데이트 후 시작</span>
                    <span className={styles.optionDesc}>공식 바닐라 서버를 다운로드합니다</span>
                    {updateInfo.hasUpdate ? (
                      <span className={styles.optionNew}>→ {updateInfo.latestVersion}</span>
                    ) : (
                      <span className={styles.optionUpToDate}>이미 최신 버전입니다</span>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
          <button
            className={styles.cancelBtn}
            onClick={() => setShowStartOptions(false)}
            disabled={updateLoading}
          >
            취소
          </button>
        </div>
      )}

      {message && (
        <p className={`${styles.message} ${isError ? styles.errorMsg : styles.successMsg}`}>
          {message}
        </p>
      )}
    </div>
  );
}

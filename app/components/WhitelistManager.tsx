'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './WhitelistManager.module.css';

interface WhitelistEntry {
  uuid: string;
  name: string;
}

export default function WhitelistManager() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchWhitelist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whitelist');
      const data = await res.json();
      if (res.ok) {
        setWhitelist(data.whitelist || []);
      } else {
        showMessage(data.error || '조회 실패', true);
      }
    } catch {
      showMessage('네트워크 오류', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);

  const showMessage = (msg: string, error = false) => {
    setIsError(error);
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setActionLoading('add');
    try {
      const res = await fetch('/api/whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message);
        setNewUsername('');
        await fetchWhitelist();
      } else {
        showMessage(data.error || '추가 실패', true);
      }
    } catch {
      showMessage('네트워크 오류', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (username: string) => {
    if (!confirm(`"${username}"을(를) 화이트리스트에서 삭제하시겠습니까?`)) return;
    setActionLoading(username);
    try {
      const res = await fetch('/api/whitelist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message);
        await fetchWhitelist();
      } else {
        showMessage(data.error || '삭제 실패', true);
      }
    } catch {
      showMessage('네트워크 오류', true);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.heading}>화이트리스트</h2>
        <button className={styles.refreshBtn} onClick={fetchWhitelist} disabled={loading}>
          {loading ? '...' : '↻ 새로고침'}
        </button>
      </div>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="마인크래프트 닉네임"
          className={styles.input}
          disabled={actionLoading === 'add'}
          pattern="[a-zA-Z0-9_]+"
          title="영문자, 숫자, 언더스코어만 사용 가능"
        />
        <button
          type="submit"
          className={styles.addBtn}
          disabled={actionLoading === 'add' || !newUsername.trim()}
        >
          {actionLoading === 'add' ? '추가 중...' : '+ 추가'}
        </button>
      </form>

      {message && (
        <p className={`${styles.message} ${isError ? styles.errorMsg : styles.successMsg}`}>
          {message}
        </p>
      )}

      <div className={styles.list}>
        {loading && whitelist.length === 0 ? (
          <p className={styles.empty}>불러오는 중...</p>
        ) : whitelist.length === 0 ? (
          <p className={styles.empty}>화이트리스트가 비어 있습니다.</p>
        ) : (
          whitelist.map((entry) => (
            <div key={entry.uuid || entry.name} className={styles.listItem}>
              <span className={styles.username}>{entry.name}</span>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(entry.name)}
                disabled={actionLoading === entry.name}
              >
                {actionLoading === entry.name ? '...' : '삭제'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

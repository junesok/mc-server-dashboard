'use client';

import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import ServerStatus from './components/ServerStatus';
import ServerControl from './components/ServerControl';
import WhitelistManager from './components/WhitelistManager';
import WorldReset from './components/WorldReset';
import { useServerStatus } from './hooks/useServerStatus';
import styles from './page.module.css';

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const { running, loading, lastUpdated, refresh } = useServerStatus(5000);

  useEffect(() => {
    fetch('/api/auth').then((res) => setAuthenticated(res.ok));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setAuthenticated(false);
  };

  if (authenticated === null) return null;

  if (!authenticated) {
    return <LoginForm onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Minecraft Dashboard</h1>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <ServerStatus running={running} loading={loading} lastUpdated={lastUpdated} />
            <ServerControl onAction={refresh} running={running} statusLoading={loading} />
          </div>
          <div className={styles.col}>
            <WhitelistManager />
          </div>
          <div className={styles.fullWidth}>
            <WorldReset onReset={refresh} />
          </div>
        </div>
      </main>
    </div>
  );
}

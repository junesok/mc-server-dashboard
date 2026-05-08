'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ServerStatusState {
  running: boolean | null;
  loading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export function useServerStatus(intervalMs = 5000) {
  const [state, setState] = useState<ServerStatusState>({
    running: null,
    loading: true,
    lastUpdated: null,
    error: null,
  });

  const isMounted = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (!isMounted.current) return;
      if (res.ok) {
        setState({ running: data.running, loading: false, lastUpdated: new Date(), error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: data.error || '상태 확인 실패' }));
      }
    } catch {
      if (!isMounted.current) return;
      setState((prev) => ({ ...prev, loading: false, error: '네트워크 오류' }));
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchStatus();
    const id = setInterval(fetchStatus, intervalMs);
    return () => {
      isMounted.current = false;
      clearInterval(id);
    };
  }, [fetchStatus, intervalMs]);

  return { ...state, refresh: fetchStatus };
}

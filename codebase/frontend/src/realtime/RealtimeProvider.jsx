import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../auth/useAuth';
import { createRealtimeClient } from './createRealtimeClient';
import { RealtimeContext } from './RealtimeContext';

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const clientRef = useRef(null);
  const [status, setStatus] = useState('offline');

  useEffect(() => {
    if (!user) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setStatus('offline');
      return undefined;
    }

    const client = createRealtimeClient();
    clientRef.current = client;
    const unsubscribeStatus = client.subscribeStatus?.(setStatus);
    setStatus('connecting');
    client
      .connect()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('offline'));

    return () => {
      unsubscribeStatus?.();
      client.disconnect();
      clientRef.current = null;
    };
  }, [user]);

  const value = useMemo(
    () => ({ client: clientRef.current, status }),
    [status],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}


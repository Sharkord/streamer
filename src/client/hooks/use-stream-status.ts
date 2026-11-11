import { usePush } from '@sharkord/plugin-sdk/client';
import { useCallback, useEffect, useState } from 'react';
import type { TPlugin, TStreamStatus } from '../../types';
import { callAction } from '../helpers/call-action';

const IDLE: TStreamStatus = { state: 'idle' };

/** the user's own stream, kept current by the server's pushes */
export const useStreamStatus = () => {
  const [status, setStatus] = useState<TStreamStatus>(IDLE);

  useEffect(() => {
    const load = async () => {
      try {
        const current = await callAction('getStreamStatus');

        setStatus(current);
      } catch {
        // stays idle, and the next push brings the real state
      }
    };

    load();
  }, []);

  usePush<TPlugin>(setStatus);

  const clear = useCallback(() => setStatus(IDLE), []);

  return { status, clear };
};

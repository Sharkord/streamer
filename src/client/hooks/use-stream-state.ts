import { usePush } from '@sharkord/plugin-sdk/client';
import { useEffect, useState } from 'react';
import type { TPlugin, TStreamState } from '../../types';
import { callAction } from '../helpers/call-action';

const INITIAL: TStreamState = { status: { state: 'idle' }, log: [] };

/** the user's own stream and its log, kept current by the server's pushes */
export const useStreamState = () => {
  const [state, setState] = useState<TStreamState>(INITIAL);

  useEffect(() => {
    const load = async () => {
      try {
        setState(await callAction('getStreamState'));
      } catch {
        // stays empty, and the next push brings the real state
      }
    };

    load();
  }, []);

  usePush<TPlugin>(setState);

  return state;
};

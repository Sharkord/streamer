import { useCallback, useEffect, useState } from 'react';
import { callAction } from '../../../helpers/call-action';

/** the user's stream key, loaded once and replaced by `reset` */
export const useStreamToken = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    const load = async () => {
      try {
        const current = await callAction('getStreamToken');

        setToken(current);
      } catch {
        setError(
          'Your stream key could not be loaded. Try reopening settings.'
        );
      }
    };

    load();
  }, []);

  const reset = useCallback(async () => {
    try {
      const next = await callAction('resetStreamToken');

      setToken(next);
      setError(undefined);
    } catch {
      setError('Your stream key could not be reset. Try again.');
    }
  }, []);

  return { token, error, reset };
};

import { useCallback, useEffect, useState } from 'react';

const COPIED_FOR_MS = 1500;

/** copies text and reports `copied` for a moment after, for the button label */
export const useCopy = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => setCopied(false), COPIED_FOR_MS);

    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }, []);

  return { copied, copy };
};

import { Button, Input } from '@sharkord/ui';
import { memo, useCallback, useState } from 'react';
import { useCopy } from './hooks/use-copy';

type TCopyFieldProps = {
  value: string;
  secret?: boolean;
  children?: React.ReactNode;
};

/** a read only value with a copy button, and a show toggle when it is secret */
export const CopyField = memo(
  ({ value, secret, children }: TCopyFieldProps) => {
    const { copied, copy } = useCopy();
    const [revealed, setRevealed] = useState(false);

    const handleCopy = useCallback(() => copy(value), [copy, value]);

    const handleToggleReveal = useCallback(
      () => setRevealed((current) => !current),
      []
    );

    const hidden = secret && !revealed;

    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <Input readOnly value={value} type={hidden ? 'password' : 'text'} />
        {secret && (
          <Button variant="outline" onClick={handleToggleReveal}>
            {revealed ? 'Hide' : 'Show'}
          </Button>
        )}
        <Button variant="outline" onClick={handleCopy} disabled={!value}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {children}
      </div>
    );
  }
);

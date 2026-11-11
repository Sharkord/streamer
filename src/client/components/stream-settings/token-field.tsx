import { Button, Group } from '@sharkord/ui';
import { memo, useCallback } from 'react';
import { CopyField } from './copy-field';

const RESET_CONFIRMATION =
  'Your streaming app stops working until you paste the new token, and a running stream ends. Reset it?';

type TTokenFieldProps = {
  token: string;
  error?: string;
  onReset: () => void;
};

export const TokenField = memo(
  ({ token, error, onReset }: TTokenFieldProps) => {
    const handleReset = useCallback(() => {
      if (confirm(RESET_CONFIRMATION)) onReset();
    }, [onReset]);

    return (
      <Group
        label="Bearer Token"
        description={
          error ?? 'Your stream key. Anyone who has it can stream as you.'
        }
      >
        <CopyField value={token} secret>
          <Button variant="destructive" onClick={handleReset}>
            Reset
          </Button>
        </CopyField>
      </Group>
    );
  }
);

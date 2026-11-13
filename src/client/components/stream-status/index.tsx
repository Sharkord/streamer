import { memo } from 'react';
import type { TStreamStatus } from '../../../types';

type TStreamStatusProps = {
  status: TStreamStatus;
};

export const StreamStatus = memo(({ status }: TStreamStatusProps) =>
  status.state === 'live' ? (
    <span style={{ color: '#ef4444' }}>● Live</span>
  ) : (
    <span style={{ color: 'var(--muted-foreground)' }}>
      Not streaming. Waiting for your streaming app to start.
    </span>
  )
);

import { memo } from 'react';
import type { TStreamStatus } from '../../../types';

const COLORS: Record<TStreamStatus['state'], string> = {
  idle: 'var(--muted-foreground)',
  live: '#ef4444',
  error: 'var(--destructive)'
};

const getLabel = (status: TStreamStatus) => {
  if (status.state === 'live') return '● Live';
  if (status.state === 'error') return `Stream failed: ${status.message}`;

  return 'Not streaming. Waiting for your streaming app to start.';
};

type TStreamStatusProps = {
  status: TStreamStatus;
};

export const StreamStatus = memo(({ status }: TStreamStatusProps) => (
  <span style={{ color: COLORS[status.state] }}>{getLabel(status)}</span>
));

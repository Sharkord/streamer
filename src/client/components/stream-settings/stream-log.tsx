import { Group } from '@sharkord/ui';
import { memo } from 'react';
import type { TStreamLogEntry } from '../../../types';

type TStreamLogProps = {
  log: TStreamLogEntry[];
};

export const StreamLog = memo(({ log }: TStreamLogProps) => (
  <Group
    label="Stream log"
    description="Why a stream started, ended or failed. Your streaming app only shows a generic error."
  >
    {log.length === 0 ? (
      <span style={{ color: 'var(--muted-foreground)' }}>Nothing yet.</span>
    ) : (
      <ol
        style={{
          display: 'grid',
          gap: 4,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          maxHeight: 240,
          overflowY: 'auto'
        }}
      >
        {log.map((entry) => (
          <li
            key={`${entry.at}-${entry.message}`}
            style={{ display: 'flex', gap: 12 }}
          >
            <time
              dateTime={new Date(entry.at).toISOString()}
              style={{
                color: 'var(--muted-foreground)',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0
              }}
            >
              {new Date(entry.at).toLocaleTimeString()}
            </time>
            <span
              style={{
                color: entry.isError ? 'var(--destructive)' : undefined
              }}
            >
              {entry.message}
              {entry.count > 1 && (
                <span style={{ color: 'var(--muted-foreground)' }}>
                  {' '}
                  ×{entry.count}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    )}
  </Group>
));

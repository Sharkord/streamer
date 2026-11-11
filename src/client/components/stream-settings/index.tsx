import { useCanUseAction } from '@sharkord/plugin-sdk/client';
import { Group, SettingsSection } from '@sharkord/ui';
import { memo } from 'react';
import type { TPlugin } from '../../../types';
import { useStreamStatus } from '../../hooks/use-stream-status';
import { StreamStatus } from '../stream-status';
import { AppSettings } from './app-settings';
import { CopyField } from './copy-field';
import { getWhipUrl } from './helpers';
import { useStreamToken } from './hooks/use-stream-token';
import { TitleField } from './title-field';
import { TokenField } from './token-field';

const TITLE = 'Streaming software';

const NoPermission = memo(() => (
  <SettingsSection title={TITLE}>
    <span style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
      You don't have permission to stream on this server.
    </span>
  </SettingsSection>
));

const StreamSetup = memo(() => {
  const { status } = useStreamStatus();
  const { token, error, reset } = useStreamToken();

  return (
    <SettingsSection
      title={TITLE}
      description="Stream from your streaming app into the voice channel you're in, like a screen share."
    >
      <div style={{ display: 'grid', gap: 16, fontSize: 14 }}>
        <Group label="Server">
          <CopyField value={getWhipUrl()} />
        </Group>
        <TokenField token={token} error={error} onReset={reset} />
        <TitleField />
        <AppSettings />
        <StreamStatus status={status} />
      </div>
    </SettingsSection>
  );
});

// split so the stream key is only requested from users allowed to stream
export const StreamSettings = memo(() => {
  const canStream = useCanUseAction<TPlugin>('getStreamToken');

  if (!canStream) return <NoPermission />;

  return <StreamSetup />;
});

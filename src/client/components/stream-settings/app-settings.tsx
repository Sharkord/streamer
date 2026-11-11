import { Group } from '@sharkord/ui';
import { memo } from 'react';

const SETTINGS = [
  ['Service', 'WHIP'],
  ['Server and Bearer Token', 'The values above'],
  ['Video encoder', 'Any H.264 encoder (x264, NVENC, QuickSync, AMF) or AV1'],
  ['H.264 profile', 'High or Baseline'],
  ['Keyframe interval', '1 or 2 seconds'],
  ['B-frames', 'Off'],
  ['Audio encoder', 'Opus']
];

export const AppSettings = memo(() => (
  <Group
    label="Streaming app settings"
    description="Join a voice channel here before you start streaming."
  >
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        gap: '4px 16px',
        margin: 0
      }}
    >
      {SETTINGS.map(([name, value]) => (
        <div key={name} style={{ display: 'contents' }}>
          <dt style={{ color: 'var(--muted-foreground)' }}>{name}</dt>
          <dd style={{ margin: 0 }}>{value}</dd>
        </div>
      ))}
    </dl>
  </Group>
));

import type { TStreamSession } from '../types';
import { getSettings } from './settings';

const CHECK_INTERVAL_MS = 5000;

// keyframes and scene changes spike for a moment, so only a sustained excess
// stops the stream
const CHECKS_OVER_LIMIT = 3;

const getBitrateKbps = async (session: TStreamSession) => {
  let bps = 0;

  for (const producer of Object.values(session.producers)) {
    const stats = await producer.getStats();

    bps += stats.reduce((sum, stat) => sum + (stat.bitrate ?? 0), 0);
  }

  return Math.round(bps / 1000);
};

/** calls `onOverLimit` once the stream stays above the admin's bitrate limit */
const watchBitrate = (
  session: TStreamSession,
  onOverLimit: (kbps: number, maxKbps: number) => void
) => {
  let checksOver = 0;

  session.bitrateTimer = setInterval(async () => {
    const maxKbps = getSettings().get('maxBitrateKbps');

    if (maxKbps <= 0) {
      checksOver = 0;

      return;
    }

    try {
      const kbps = await getBitrateKbps(session);

      checksOver = kbps > maxKbps ? checksOver + 1 : 0;

      if (checksOver < CHECKS_OVER_LIMIT) return;

      onOverLimit(kbps, maxKbps);
    } catch {
      // the producers closed between checks, and the session is ending anyway
    }
  }, CHECK_INTERVAL_MS);
};

export { watchBitrate };

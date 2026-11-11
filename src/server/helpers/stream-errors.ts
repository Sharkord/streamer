import type { TContext } from '../types';

// streaming apps keep retrying after a stream ends and every retry fails the
// same way, so an error the streamer already saw stays quiet while the retries
// keep coming
const QUIET_MS = 60_000;

const lastErrors = new Map<number, { message: string; at: number }>();

const isRepeat = (userId: number, message: string) => {
  const last = lastErrors.get(userId);
  const now = Date.now();

  lastErrors.set(userId, { message, at: now });

  return last?.message === message && now - last.at < QUIET_MS;
};

/** shows the error in Sharkord, unless the streamer just saw the same one */
const notifyStreamError = (ctx: TContext, userId: number, message: string) => {
  if (isRepeat(userId, message)) return;

  ctx.push.toUser(userId, { state: 'error', message });
};

/**
 * Counts an error as already shown, for one the streamer knows the reason
 * for, like being told to join voice right after leaving it.
 */
const markStreamErrorShown = (userId: number, message: string) => {
  lastErrors.set(userId, { message, at: Date.now() });
};

export { markStreamErrorShown, notifyStreamError };

import type { TStreamLogEntry } from '../../types';

const MAX_ENTRIES = 50;

// ponytail: in memory, so a server restart clears it. persist it if anyone
// needs history from before a restart
const logs = new Map<number, TStreamLogEntry[]>();

const getStreamLog = (userId: number) => logs.get(userId) ?? [];

/**
 * Adds an entry, newest first. A repeat of the newest entry is counted on it
 * instead, so a streaming app retrying the same failure is a single line.
 */
const addStreamLogEntry = (
  userId: number,
  message: string,
  isError: boolean
) => {
  const log = getStreamLog(userId);
  const [newest] = log;
  const at = Date.now();

  if (newest?.message === message) {
    log[0] = { ...newest, at, count: newest.count + 1 };
  } else {
    log.unshift({ at, message, isError, count: 1 });
    log.length = Math.min(log.length, MAX_ENTRIES);
  }

  logs.set(userId, log);
};

const deleteStreamLog = (userId: number) => logs.delete(userId);

export { addStreamLogEntry, deleteStreamLog, getStreamLog };

import { expect, test } from 'bun:test';
import { addStreamLogEntry, getStreamLog } from '../stream-log';

test('counts repeats of the newest entry on one line', () => {
  addStreamLogEntry(1, 'A', true);
  addStreamLogEntry(1, 'A', true);
  addStreamLogEntry(1, 'B', false);
  addStreamLogEntry(1, 'B', false);
  addStreamLogEntry(1, 'B', false);

  expect(getStreamLog(1).map(({ message, count }) => [message, count])).toEqual(
    [
      ['B', 3],
      ['A', 2]
    ]
  );
});

test('keeps the newest 50 entries', () => {
  for (let i = 0; i < 60; i++) addStreamLogEntry(2, `${i}`, false);

  const log = getStreamLog(2);

  expect(log).toHaveLength(50);
  expect(log[0]?.message).toBe('59');
});

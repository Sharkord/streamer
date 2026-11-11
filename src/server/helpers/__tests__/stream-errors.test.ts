import { expect, test } from 'bun:test';
import type { TContext } from '../../types';
import { markStreamErrorShown, notifyStreamError } from '../stream-errors';

const createContext = () => {
  const pushed: unknown[] = [];
  const ctx = {
    push: { toUser: (_userId: number, status: unknown) => pushed.push(status) }
  } as unknown as TContext;

  return { ctx, pushed };
};

test('shows an error once while the retries repeat it', () => {
  const { ctx, pushed } = createContext();

  notifyStreamError(ctx, 1, 'A');
  notifyStreamError(ctx, 1, 'A');
  notifyStreamError(ctx, 1, 'B');
  notifyStreamError(ctx, 2, 'A');

  expect(pushed).toHaveLength(3);
});

test('stays quiet about an error marked as shown', () => {
  const { ctx, pushed } = createContext();

  markStreamErrorShown(3, 'Join a voice channel in Sharkord first.');
  notifyStreamError(ctx, 3, 'Join a voice channel in Sharkord first.');

  expect(pushed).toHaveLength(0);
});

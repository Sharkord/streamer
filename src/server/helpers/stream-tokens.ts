import { randomBytes } from 'crypto';
import type { TContext } from '../types';

const tokenKey = (token: string) => `token:${token}`;
const userKey = (userId: number) => `user:${userId}`;

const createToken = async (ctx: TContext, userId: number) => {
  const bytes = randomBytes(24);
  const token = bytes.toString('base64url');

  await ctx.storage.set(tokenKey(token), userId);
  await ctx.storage.set(userKey(userId), token);

  return token;
};

// the settings screen can ask twice at once on first open, and two creations
// would leave the user looking at a key that is not the stored one
const pendingCreations = new Map<number, Promise<string>>();

/** the user's stream key, created the first time they ask for it */
const getStreamToken = async (ctx: TContext, userId: number) => {
  const current = await ctx.storage.get<string>(userKey(userId));

  if (current) return current;

  let pending = pendingCreations.get(userId);

  if (!pending) {
    pending = createToken(ctx, userId);
    pendingCreations.set(userId, pending);
  }

  try {
    return await pending;
  } finally {
    pendingCreations.delete(userId);
  }
};

/** replaces the user's stream key, so the old one stops working at once */
const resetStreamToken = async (ctx: TContext, userId: number) => {
  const current = await ctx.storage.get<string>(userKey(userId));

  if (current) {
    await ctx.storage.delete(tokenKey(current));
  }

  return createToken(ctx, userId);
};

/** forgets the user's stream key, for a deleted account */
const deleteStreamToken = async (ctx: TContext, userId: number) => {
  const current = await ctx.storage.get<string>(userKey(userId));

  if (current) {
    await ctx.storage.delete(tokenKey(current));
  }

  await ctx.storage.delete(userKey(userId));
};

/**
 * Only the key the user currently holds counts, so a key left behind by a
 * reset that failed halfway, or by an earlier version, cannot stream.
 */
const getUserIdByStreamToken = async (ctx: TContext, token: string) => {
  const userId = await ctx.storage.get<number>(tokenKey(token));

  if (!userId) return undefined;

  const current = await ctx.storage.get<string>(userKey(userId));

  return current === token ? userId : undefined;
};

export {
  deleteStreamToken,
  getStreamToken,
  getUserIdByStreamToken,
  resetStreamToken
};

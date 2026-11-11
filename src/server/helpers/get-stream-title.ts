import { MAX_TITLE_LENGTH } from '../../types';
import type { TContext } from '../types';

const getStreamTitle = async (ctx: TContext, userId: number) => {
  const [data, user] = await Promise.all([
    ctx.userData.get(userId),
    ctx.users.get(userId)
  ]);

  // user data is written by the client, so the length is enforced again here
  const trimmed = data.title?.trim() ?? '';
  const title = trimmed.slice(0, MAX_TITLE_LENGTH);

  return title || `${user?.name ?? 'Someone'}'s stream`;
};

export { getStreamTitle };

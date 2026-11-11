import { Permission } from '@sharkord/plugin-sdk';
import { getStreamToken } from '../helpers/stream-tokens';
import type { TContext } from '../types';

const registerGetStreamTokenAction = (ctx: TContext) => {
  ctx.actions.register({
    name: 'getStreamToken',
    requires: Permission.SHARE_SCREEN,
    executes: async ({ userId }) => getStreamToken(ctx, userId)
  });
};

export { registerGetStreamTokenAction };

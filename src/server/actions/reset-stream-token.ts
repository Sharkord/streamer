import { Permission } from '@sharkord/plugin-sdk';
import { stopStream } from '../helpers/stream-sessions';
import { resetStreamToken } from '../helpers/stream-tokens';
import type { TContext } from '../types';

const registerResetStreamTokenAction = (ctx: TContext) => {
  ctx.actions.register({
    name: 'resetStreamToken',
    requires: Permission.SHARE_SCREEN,
    executes: async ({ userId }) => {
      // a leaked key may be what is streaming right now
      stopStream(ctx, userId);

      return resetStreamToken(ctx, userId);
    }
  });
};

export { registerResetStreamTokenAction };

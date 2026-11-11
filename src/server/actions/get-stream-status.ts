import { getStreamStatus } from '../helpers/stream-sessions';
import type { TContext } from '../types';

const registerGetStreamStatusAction = (ctx: TContext) => {
  ctx.actions.register({
    name: 'getStreamStatus',
    executes: async ({ userId }) => getStreamStatus(userId)
  });
};

export { registerGetStreamStatusAction };

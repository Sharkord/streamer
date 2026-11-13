import { getStreamState } from '../helpers/stream-sessions';
import type { TContext } from '../types';

const registerGetStreamStateAction = (ctx: TContext) => {
  ctx.actions.register({
    name: 'getStreamState',
    executes: async ({ userId }) => getStreamState(userId)
  });
};

export { registerGetStreamStateAction };

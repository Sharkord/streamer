import type { UnloadPluginContext } from '@sharkord/plugin-sdk';
import { registerGetStreamStatusAction } from './actions/get-stream-status';
import { registerGetStreamTokenAction } from './actions/get-stream-token';
import { registerResetStreamTokenAction } from './actions/reset-stream-token';
import { registerStreamEvents } from './helpers/register-stream-events';
import { registerSettings } from './helpers/settings';
import { closeAllStreams } from './helpers/stream-sessions';
import { registerCreateWhipSessionRoute } from './routes/create-whip-session';
import { registerDeleteWhipSessionRoute } from './routes/delete-whip-session';
import type { TContext } from './types';

const onLoad = async (ctx: TContext) => {
  await registerSettings(ctx);

  registerCreateWhipSessionRoute(ctx);
  registerDeleteWhipSessionRoute(ctx);

  registerGetStreamTokenAction(ctx);
  registerResetStreamTokenAction(ctx);
  registerGetStreamStatusAction(ctx);

  registerStreamEvents(ctx);

  ctx.ui.enable();
};

const onUnload = (ctx: UnloadPluginContext) => {
  closeAllStreams();
  ctx.logger.log('Streaming unloaded');
};

export { onLoad, onUnload };

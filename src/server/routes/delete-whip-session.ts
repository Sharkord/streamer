import { createWhipHandler } from '../helpers/create-whip-handler';
import { getStreamSession, stopStream } from '../helpers/stream-sessions';
import type { TContext } from '../types';
import { getLastPathSegment, send } from '../utils/http';

/** DELETE /whip/<sessionId>. The streaming app calls it when the streamer stops streaming. */
const registerDeleteWhipSessionRoute = (ctx: TContext) => {
  ctx.http.delete(
    '/whip/*',
    createWhipHandler(ctx, async (userId, req, res) => {
      const sessionId = getLastPathSegment(req);
      const session = getStreamSession(userId);

      // a stream that already ended is a success, not an error: streaming apps
      // send this after Sharkord ended the stream itself, and the streamer
      // does not need a dialog about it
      if (session?.id === sessionId) {
        stopStream(ctx, userId, { sessionId });
      }

      send(res, 200);
    })
  );
};

export { registerDeleteWhipSessionRoute };

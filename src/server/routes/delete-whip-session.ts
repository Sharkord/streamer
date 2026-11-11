import { createWhipHandler } from '../helpers/create-whip-handler';
import { getStreamSession, stopStream } from '../helpers/stream-sessions';
import type { TContext } from '../types';
import { getLastPathSegment, HttpError, send } from '../utils/http';

/** DELETE /whip/<sessionId>. The streaming app calls it when the streamer stops streaming. */
const registerDeleteWhipSessionRoute = (ctx: TContext) => {
  ctx.http.delete(
    '/whip/*',
    createWhipHandler(ctx, async (userId, req, res) => {
      const sessionId = getLastPathSegment(req);
      const session = getStreamSession(userId);

      // another user's session id is answered the same as an unknown one
      if (!session || session.id !== sessionId) {
        throw new HttpError(404, 'No such stream.');
      }

      stopStream(ctx, userId, { sessionId });
      send(res, 200);
    })
  );
};

export { registerDeleteWhipSessionRoute };

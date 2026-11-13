import type { TPluginHttpRouteHandler } from '@sharkord/plugin-sdk';
import type { IncomingMessage, ServerResponse } from 'http';
import type { TContext } from '../types';
import { getBearerToken, HttpError, sendText } from '../utils/http';
import { reportStream } from './stream-sessions';
import { getUserIdByStreamToken } from './stream-tokens';

type TWhipHandler = (
  userId: number,
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void>;

/**
 * Wraps a whip route: authenticates the stream key and turns failures into
 * plain text responses. Streaming apps only show a generic error, so the real reason also
 * goes to the streamer's stream log in Sharkord.
 */
const createWhipHandler =
  (ctx: TContext, handler: TWhipHandler): TPluginHttpRouteHandler =>
  async (req, res) => {
    let userId: number | undefined;

    try {
      const token = getBearerToken(req);

      if (token) {
        userId = await getUserIdByStreamToken(ctx, token);
      }

      if (!userId) {
        throw new HttpError(
          401,
          'Unknown stream key. Copy it again from Sharkord.'
        );
      }

      await handler(userId, req, res);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        error instanceof Error ? error.message : 'Something went wrong.';

      if (status === 500) {
        ctx.logger.error(error);
      }

      if (userId) {
        reportStream(ctx, userId, message, true);
      }

      req.resume();
      sendText(res, status, message);
    }
  };

export { createWhipHandler };

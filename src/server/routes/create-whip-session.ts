import { ChannelPermission, Permission } from '@sharkord/plugin-sdk';
import { createWhipHandler } from '../helpers/create-whip-handler';
import {
  findVoiceChannel,
  NOT_IN_VOICE_MESSAGE
} from '../helpers/find-voice-channel';
import { getStreamBlock } from '../helpers/stream-blocks';
import { startStream } from '../helpers/stream-sessions';
import { parseOffer } from '../sdp/parse-offer';
import type { TContext } from '../types';
import { HttpError, readBody, send } from '../utils/http';

const MAX_OFFER_BYTES = 64 * 1024;

const parseOrReject = (
  ...args: Parameters<typeof parseOffer>
): ReturnType<typeof parseOffer> => {
  try {
    return parseOffer(...args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new HttpError(400, message);
  }
};

/**
 * POST /whip. The streaming app sends its sdp offer here with the stream key
 * as a bearer token, and gets the answer back.
 */
const registerCreateWhipSessionRoute = (ctx: TContext) => {
  // public on purpose: streaming apps cannot log in, the stream key is what
  // authenticates
  ctx.http.post(
    '/whip',
    createWhipHandler(ctx, async (userId, req, res) => {
      const contentType = req.headers['content-type'] ?? '';

      if (!contentType.startsWith('application/sdp')) {
        throw new HttpError(415, 'Expected an application/sdp offer.');
      }

      const sdp = await readBody(req, MAX_OFFER_BYTES);

      if (!sdp.trim()) {
        throw new HttpError(400, 'The offer is empty.');
      }

      const block = getStreamBlock(userId);

      if (block) {
        throw new HttpError(429, block);
      }

      const canShare = await ctx.permissions.userCan(
        userId,
        Permission.SHARE_SCREEN
      );

      if (!canShare) {
        throw new HttpError(403, "You don't have permission to stream.");
      }

      const channelId = await findVoiceChannel(ctx, userId);

      if (!channelId) {
        throw new HttpError(409, NOT_IN_VOICE_MESSAGE);
      }

      const canShareHere = await ctx.permissions.userCanInChannel(
        userId,
        channelId,
        ChannelPermission.SHARE_SCREEN
      );

      if (!canShareHere) {
        throw new HttpError(403, "You can't stream in this voice channel.");
      }

      const router = ctx.voice.getRouter(channelId);
      const offer = parseOrReject(sdp, router.rtpCapabilities);
      const { sessionId, answer } = await startStream(
        ctx,
        userId,
        channelId,
        offer
      );

      send(res, 201, answer, {
        'content-type': 'application/sdp',
        location: `/plugins/${ctx.pluginId}/whip/${sessionId}`
      });
    })
  );
};

export { registerCreateWhipSessionRoute };

import { ChannelPermission } from '@sharkord/plugin-sdk';
import type { TContext } from '../types';
import { NOT_IN_VOICE_MESSAGE } from './find-voice-channel';
import { getSettings } from './settings';
import { markStreamErrorShown } from './stream-errors';
import {
  getStreamSession,
  publishStream,
  stopChannelStreams,
  stopStream
} from './stream-sessions';
import { deleteStreamToken } from './stream-tokens';

// a channel switch arrives as a leave and then a join, so a leave waits this
// long for the join before it counts
const SWITCH_GRACE_MS = 5000;

const handleLeftVoice = (ctx: TContext, userId: number, channelId: number) => {
  const session = getStreamSession(userId);

  if (session?.publication?.channelId !== channelId) return;

  const settings = getSettings();

  if (!settings.get('stopOnLeave')) return;

  // the streaming app reconnects and is refused for not being in voice, which
  // the streamer does not need to be told right after leaving
  const stop = () => {
    markStreamErrorShown(userId, NOT_IN_VOICE_MESSAGE);
    stopStream(ctx, userId, { sessionId: session.id });
  };

  if (!settings.get('followChannelSwitch')) {
    stop();

    return;
  }

  clearTimeout(session.leaveTimer);
  session.leaveTimer = setTimeout(stop, SWITCH_GRACE_MS);
};

const handleJoinedVoice = async (
  ctx: TContext,
  userId: number,
  channelId: number
) => {
  const session = getStreamSession(userId);

  if (!session) return;

  clearTimeout(session.leaveTimer);
  session.leaveTimer = undefined;

  if (!getSettings().get('followChannelSwitch')) return;
  if (session.publication?.channelId === channelId) return;

  const canShare = await ctx.permissions.userCanInChannel(
    userId,
    channelId,
    ChannelPermission.SHARE_SCREEN
  );

  if (!canShare) {
    stopStream(ctx, userId, {
      sessionId: session.id,
      error:
        "You can't stream in the voice channel you moved to, so your stream ended."
    });

    return;
  }

  try {
    await publishStream(ctx, session, channelId);
  } catch (error) {
    ctx.logger.error(error);
    stopStream(ctx, userId, {
      sessionId: session.id,
      error:
        "Your stream couldn't move to your new voice channel. Start it again from your streaming app."
    });
  }
};

/** keeps streams in step with their streamer, and ends the ones left behind */
const registerStreamEvents = (ctx: TContext) => {
  ctx.events.on('user:left_voice', ({ userId, channelId }) =>
    handleLeftVoice(ctx, userId, channelId)
  );

  ctx.events.on('user:joined_voice', ({ userId, channelId }) =>
    handleJoinedVoice(ctx, userId, channelId)
  );

  ctx.events.on('voice:runtime_closed', ({ channelId }) =>
    stopChannelStreams(ctx, channelId)
  );

  // with stop on leave turned off, leaving voice alone would not end these
  ctx.events.on('user:kicked', ({ userId }) => stopStream(ctx, userId));
  ctx.events.on('user:banned', ({ userId }) => stopStream(ctx, userId));

  ctx.events.on('user:deleted', async ({ userId }) => {
    stopStream(ctx, userId);
    await deleteStreamToken(ctx, userId);
  });
};

export { registerStreamEvents };

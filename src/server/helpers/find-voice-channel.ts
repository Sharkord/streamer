import { ChannelType } from '@sharkord/plugin-sdk';
import type { TContext } from '../types';

const NOT_IN_VOICE_MESSAGE = 'Join a voice channel in Sharkord first.';

/**
 * The voice channel the user is connected to, if any. The sdk has no direct
 * lookup, so this asks every live voice runtime.
 *
 * ponytail: scans every voice channel, fine for a server's worth of channels.
 * a lookup in the sdk is the upgrade if that ever shows up in a profile
 */
const findVoiceChannel = async (ctx: TContext, userId: number) => {
  const channels = await ctx.channels.list();

  for (const channel of channels) {
    if (channel.type !== ChannelType.VOICE) continue;

    try {
      const { users } = ctx.voice.getState(channel.id);

      if (users.some((user) => user.userId === userId)) return channel.id;
    } catch {
      // no live runtime means nobody is in the channel
    }
  }

  return undefined;
};

export { findVoiceChannel, NOT_IN_VOICE_MESSAGE };

import type { PluginSettings } from '@sharkord/plugin-sdk';
import type { TContext } from '../types';

const DEFINITIONS = [
  {
    key: 'stopOnLeave',
    name: 'Stop streams when the streamer leaves voice',
    description:
      'End a stream as soon as its owner leaves voice. Turn off to keep streams running until the streaming app stops them.',
    type: 'boolean',
    defaultValue: true
  },
  {
    key: 'followChannelSwitch',
    name: 'Move streams with their streamer',
    description:
      'When a streamer switches voice channels, their stream moves with them instead of ending.',
    type: 'boolean',
    defaultValue: true
  },
  {
    key: 'maxBitrateKbps',
    name: 'Maximum stream bitrate (kbps)',
    description:
      'Streams that stay above this for 15 seconds are stopped, and the streamer is told why. 0 means no limit.',
    type: 'number',
    defaultValue: 0
  }
] as const;

type TSettings = PluginSettings<typeof DEFINITIONS>;

let settings: TSettings | undefined;

const registerSettings = async (ctx: TContext) => {
  const registered = await ctx.settings.register(DEFINITIONS);

  settings = registered;

  return registered;
};

/** the registered settings. only valid after `registerSettings` ran in onLoad */
const getSettings = () => {
  if (!settings) throw new Error('Settings are not registered yet');

  return settings;
};

export { getSettings, registerSettings };

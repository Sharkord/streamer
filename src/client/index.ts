import { PluginSlot } from '@sharkord/plugin-sdk';
import type { TPluginComponentsMapBySlotId } from '@sharkord/plugin-sdk/client';
import { StreamSettings } from './components/stream-settings';

export const components: TPluginComponentsMapBySlotId = {
  [PluginSlot.USER_SETTINGS]: [StreamSettings]
};

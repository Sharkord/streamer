import { PluginSlot } from '@sharkord/plugin-sdk';
import type { TPluginComponentsMapBySlotId } from '@sharkord/plugin-sdk/client';
import { StreamErrorDialog } from './components/stream-error-dialog';
import { StreamSettings } from './components/stream-settings';

export const components: TPluginComponentsMapBySlotId = {
  [PluginSlot.USER_SETTINGS]: [StreamSettings],
  [PluginSlot.TOPBAR_RIGHT]: [StreamErrorDialog]
};

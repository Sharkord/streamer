import { createCallAction } from '@sharkord/plugin-sdk/client';
import type { TPlugin } from '../../types';

export const callAction = createCallAction<TPlugin>();

const MAX_TITLE_LENGTH = 64;

type TStreamStatus =
  | { state: 'idle' }
  | { state: 'live'; channelId: number }
  | { state: 'error'; message: string };

/**
 * The contract between the server and client halves of the plugin, so action
 * names, payloads and pushes are checked on both sides.
 */
type TPlugin = {
  actions: {
    getStreamToken: { payload: void; response: string };
    resetStreamToken: { payload: void; response: string };
    getStreamStatus: { payload: void; response: TStreamStatus };
  };
  push: TStreamStatus;
  userData: { title?: string };
};

export { MAX_TITLE_LENGTH };
export type { TPlugin, TStreamStatus };

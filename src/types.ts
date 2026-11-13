const MAX_TITLE_LENGTH = 64;

type TStreamStatus = { state: 'idle' } | { state: 'live'; channelId: number };

type TStreamLogEntry = {
  at: number;
  message: string;
  isError: boolean;
  /** how many times in a row it happened, as streaming apps retry */
  count: number;
};

type TStreamState = { status: TStreamStatus; log: TStreamLogEntry[] };

/**
 * The contract between the server and client halves of the plugin, so action
 * names, payloads and pushes are checked on both sides.
 */
type TPlugin = {
  actions: {
    getStreamToken: { payload: void; response: string };
    resetStreamToken: { payload: void; response: string };
    getStreamState: { payload: void; response: TStreamState };
  };
  push: TStreamState;
  userData: { title?: string };
};

export { MAX_TITLE_LENGTH };
export type { TPlugin, TStreamLogEntry, TStreamState, TStreamStatus };

// the server cannot tell a streaming app to stop, and apps reconnect after a
// stream is ended, so a stream ended for a reason is kept out for a while
const BLOCK_MS = 60_000;

const blocks = new Map<number, { until: number; message: string }>();

const blockStreams = (userId: number, message: string) => {
  blocks.set(userId, { until: Date.now() + BLOCK_MS, message });
};

/** why the user can't stream right now, if they are still blocked */
const getStreamBlock = (userId: number) => {
  const block = blocks.get(userId);

  if (!block) return undefined;

  if (Date.now() >= block.until) {
    blocks.delete(userId);

    return undefined;
  }

  // the same words the stream ended with, so the retries do not show it again
  return block.message;
};

export { blockStreams, getStreamBlock };

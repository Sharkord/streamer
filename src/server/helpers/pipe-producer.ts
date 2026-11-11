import type { TPipe, TProducer, TRouter } from '../types';

const LISTEN_INFO = { protocol: 'udp', ip: '127.0.0.1' } as const;

/**
 * Copies a producer into a router, the same one included. Unlike
 * `router.pipeToRouter` this also works within one router, which matters
 * because removing a plugin stream closes the producers it was given: the
 * stream only ever gets the copy, so the streaming app's own connection
 * survives a move between channels.
 */
const pipeProducer = async (
  from: TRouter,
  to: TRouter,
  producer: TProducer
): Promise<TPipe> => {
  const local = await from.createPipeTransport({ listenInfo: LISTEN_INFO });
  const remote = await to.createPipeTransport({ listenInfo: LISTEN_INFO });

  const close = () => {
    local.close();
    remote.close();
  };

  try {
    await local.connect({
      ip: remote.tuple.localAddress,
      port: remote.tuple.localPort
    });
    await remote.connect({
      ip: local.tuple.localAddress,
      port: local.tuple.localPort
    });

    const consumer = await local.consume({ producerId: producer.id });
    const piped = await remote.produce({
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      paused: consumer.producerPaused
    });

    consumer.on('producerclose', close);

    return { producer: piped, close };
  } catch (error) {
    close();

    throw error;
  }
};

export { pipeProducer };

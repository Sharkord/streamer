import { randomUUID } from 'crypto';
import type { TStreamState, TStreamStatus } from '../../types';
import { buildAnswer } from '../sdp/build-answer';
import type { TOffer } from '../sdp/types';
import type {
  TContext,
  TPipe,
  TProducers,
  TPublication,
  TStreamSession
} from '../types';
import { HttpError } from '../utils/http';
import { getStreamTitle } from './get-stream-title';
import { pipeProducer } from './pipe-producer';
import { blockStreams } from './stream-blocks';
import { addStreamLogEntry, getStreamLog } from './stream-log';
import { watchBitrate } from './watch-bitrate';

// one stream per user, keyed by user id
const sessions = new Map<number, TStreamSession>();

const getStreamStatus = (userId: number): TStreamStatus => {
  const publication = sessions.get(userId)?.publication;

  if (!publication) return { state: 'idle' };

  return { state: 'live', channelId: publication.channelId };
};

const getStreamState = (userId: number): TStreamState => ({
  status: getStreamStatus(userId),
  log: getStreamLog(userId)
});

/** adds to the user's stream log and sends them their current state */
const reportStream = (
  ctx: TContext,
  userId: number,
  message: string,
  isError = false
) => {
  addStreamLogEntry(userId, message, isError);
  ctx.push.toUser(userId, getStreamState(userId));
};

const getStreamSession = (userId: number) => sessions.get(userId);

const getStreamSessions = () => [...sessions.values()];

const isCurrent = (session: TStreamSession) =>
  sessions.get(session.userId) === session;

const unpublish = (publication: TPublication | undefined) => {
  if (!publication) return;

  publication.handle.remove();
  publication.pipes.forEach((pipe) => pipe.close());
};

const closeSession = (session: TStreamSession) => {
  if (isCurrent(session)) sessions.delete(session.userId);

  clearTimeout(session.leaveTimer);
  clearInterval(session.bitrateTimer);
  unpublish(session.publication);
  session.publication = undefined;
  session.transport.close();
};

/**
 * Takes the user's stream down. With a `sessionId` it only stops that session,
 * since a reconnect may already have replaced the one a late close is about.
 * The log says why: `error` for a failure, `reason` for anything else.
 */
const stopStream = (
  ctx: TContext,
  userId: number,
  options: { sessionId?: string; error?: string; reason?: string } = {}
) => {
  const session = sessions.get(userId);

  if (!session) return;
  if (options.sessionId && session.id !== options.sessionId) return;

  closeSession(session);

  reportStream(
    ctx,
    userId,
    options.error ?? options.reason ?? 'Stream ended.',
    !!options.error
  );
  ctx.logger.log(`Stream of user ${userId} stopped`);
};

/** stops whatever plays in the channel or was ingested through it */
const stopChannelStreams = (ctx: TContext, channelId: number) => {
  for (const session of getStreamSessions()) {
    if (session.publication?.channelId === channelId) {
      stopStream(ctx, session.userId);
    }
  }
};

const closeAllStreams = () => {
  getStreamSessions().forEach(closeSession);
};

const watchTransport = (ctx: TContext, session: TStreamSession) => {
  const { transport, userId, id: sessionId } = session;
  const end = () => stopStream(ctx, userId, { sessionId });

  transport.on('dtlsstatechange', (state) => {
    if (state === 'failed' || state === 'closed') end();
  });

  // ice-lite reports disconnected once consent checks stop for about 30s
  transport.on('icestatechange', (state) => {
    if (state === 'disconnected') end();
  });

  // also covers the ingest channel being deleted, which closes its router
  transport.observer.on('close', end);
};

const produce = async (session: TStreamSession, offer: TOffer) => {
  const { transport } = session;

  await transport.connect({
    dtlsParameters: {
      role: offer.remoteDtlsRole,
      fingerprints: [offer.fingerprint]
    }
  });

  for (const media of offer.medias) {
    session.producers[media.kind] = await transport.produce({
      kind: media.kind,
      rtpParameters: media.rtpParameters
    });
  }
};

/** plays the session's media in a channel, through copies of its producers */
const createPublication = async (
  ctx: TContext,
  session: TStreamSession,
  channelId: number
): Promise<TPublication> => {
  const router = ctx.voice.getRouter(channelId);
  const pipes: TPipe[] = [];
  const producers: TProducers = {};

  try {
    for (const kind of ['audio', 'video'] as const) {
      const producer = session.producers[kind];

      if (!producer) continue;

      const pipe = await pipeProducer(session.router, router, producer);

      pipes.push(pipe);
      producers[kind] = pipe.producer;
    }

    const handle = ctx.voice.createStream({
      channelId,
      key: `stream-${session.userId}`,
      ownerUserId: session.userId,
      title: await getStreamTitle(ctx, session.userId),
      producers
    });

    return { channelId, handle, pipes };
  } catch (error) {
    pipes.forEach((pipe) => pipe.close());

    throw error;
  }
};

/**
 * Plays the session in `channelId` and takes it out of wherever it played
 * before. The new one is up before the old one goes, so viewers who follow the
 * streamer are not left without it.
 */
const publishStream = async (
  ctx: TContext,
  session: TStreamSession,
  channelId: number
) => {
  const publication = await createPublication(ctx, session, channelId);

  // the stream may have been stopped or replaced while the copies were made
  if (!isCurrent(session)) {
    unpublish(publication);

    return;
  }

  const previous = session.publication;

  session.publication = publication;
  unpublish(previous);

  reportStream(
    ctx,
    session.userId,
    previous ? 'Stream moved to your new voice channel.' : 'Stream started.'
  );
  ctx.logger.log(
    `User ${session.userId} is streaming into channel ${channelId}`
  );
};

/**
 * Puts the user's whip offer live in the channel and returns the sdp answer.
 * Replaces a stream the user already has, which is how a reconnect after a
 * dropped connection lands.
 */
const startStream = async (
  ctx: TContext,
  userId: number,
  channelId: number,
  offer: TOffer
) => {
  stopStream(ctx, userId);

  const router = ctx.voice.getRouter(channelId);
  const transport = await ctx.voice.createWebRtcTransport(channelId);
  const session: TStreamSession = {
    id: randomUUID(),
    userId,
    router,
    transport,
    producers: {}
  };

  sessions.set(userId, session);

  try {
    await produce(session, offer);
  } catch (error) {
    closeSession(session);

    const reason = error instanceof Error ? error.message : String(error);
    const profile = offer.medias.find((media) => media.kind === 'video')
      ?.rtpParameters.codecs[0]?.parameters?.['profile-level-id'];
    const details = profile ? `${reason}, profile-level-id ${profile}` : reason;

    throw new HttpError(
      400,
      `Your streaming app sent something Sharkord can't play (${details}). Send H.264 or AV1 video with Opus audio.`
    );
  }

  try {
    await publishStream(ctx, session, channelId);
  } catch (error) {
    closeSession(session);

    throw error;
  }

  watchTransport(ctx, session);
  watchBitrate(session, (kbps, maxKbps) => {
    const error = `Your stream was sending about ${kbps} kbps, but this server allows up to ${maxKbps} kbps. Lower the bitrate in your streaming app, then start again in a minute.`;

    blockStreams(userId, error);
    stopStream(ctx, userId, { sessionId: session.id, error });
  });

  return { sessionId: session.id, answer: buildAnswer(offer, transport) };
};

export {
  closeAllStreams,
  getStreamSession,
  getStreamState,
  publishStream,
  reportStream,
  startStream,
  stopChannelStreams,
  stopStream
};

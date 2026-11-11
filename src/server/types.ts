import type {
  PluginContext,
  TCreateStreamOptions,
  TExternalStreamHandle,
  TVoiceConsumerHandle
} from '@sharkord/plugin-sdk';
import type { TPlugin } from '../types';

type TContext = PluginContext<TPlugin>;

// mediasoup is not a dependency of the plugin, so its types come through the sdk
type TTransport = Awaited<
  ReturnType<TContext['voice']['createWebRtcTransport']>
>;

type TRouter = ReturnType<TContext['voice']['getRouter']>;

type TRtpCapabilities = TRouter['rtpCapabilities'];

type TRtpParameters = TVoiceConsumerHandle['rtpParameters'];

type TDtlsFingerprint = Parameters<
  TTransport['connect']
>[0]['dtlsParameters']['fingerprints'][number];

type TProducers = TCreateStreamOptions['producers'];

type TProducer = NonNullable<TProducers['video']>;

type TPipe = {
  producer: TProducer;
  close: () => void;
};

type TPublication = {
  channelId: number;
  handle: TExternalStreamHandle;
  pipes: TPipe[];
};

type TStreamSession = {
  id: string;
  userId: number;
  router: TRouter;
  transport: TTransport;
  producers: TProducers;
  publication?: TPublication;
  leaveTimer?: ReturnType<typeof setTimeout>;
  bitrateTimer?: ReturnType<typeof setInterval>;
};

export type {
  TContext,
  TDtlsFingerprint,
  TPipe,
  TProducer,
  TProducers,
  TPublication,
  TRouter,
  TRtpCapabilities,
  TRtpParameters,
  TStreamSession,
  TTransport
};

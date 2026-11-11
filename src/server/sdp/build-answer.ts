import sdpTransform, { type MediaDescription } from 'sdp-transform';
import type { TRtpParameters, TTransport } from '../types';
import type { TOffer } from './types';

type TCodec = TRtpParameters['codecs'][number];

const toRtp = (codec: TCodec) => {
  const [, name] = codec.mimeType.split('/');

  return {
    payload: codec.payloadType,
    codec: name!,
    rate: codec.clockRate,
    ...(codec.channels ? { encoding: codec.channels } : {})
  };
};

const toFmtp = (codec: TCodec) => ({
  payload: codec.payloadType,
  config: Object.entries(codec.parameters ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join(';')
});

const toRtcpFb = (codec: TCodec) =>
  (codec.rtcpFeedback ?? []).map((fb) => ({
    payload: codec.payloadType,
    type: fb.type,
    ...(fb.parameter ? { subtype: fb.parameter } : {})
  }));

const toCandidates = (transport: TTransport) =>
  transport.iceCandidates.map((candidate) => ({
    foundation: candidate.foundation,
    component: 1,
    transport: candidate.protocol,
    priority: candidate.priority,
    ip: candidate.address,
    port: candidate.port,
    type: candidate.type,
    ...(candidate.tcpType ? { tcptype: candidate.tcpType } : {})
  }));

const getFingerprint = (transport: TTransport) => {
  const { fingerprints } = transport.dtlsParameters;
  const fingerprint =
    fingerprints.find((fp) => fp.algorithm === 'sha-256') ?? fingerprints[0]!;

  return { type: fingerprint.algorithm, hash: fingerprint.value };
};

/**
 * The answer to a whip offer: one recvonly section per offered one, all on the
 * same ice-lite transport.
 */
const buildAnswer = (offer: TOffer, transport: TTransport): string => {
  const { usernameFragment, password } = transport.iceParameters;
  const fingerprint = getFingerprint(transport);
  const candidates = toCandidates(transport);
  const setup = offer.remoteDtlsRole === 'client' ? 'passive' : 'active';

  const media: MediaDescription[] = offer.medias.map(
    ({ section, rtpParameters }) => {
      const { codecs, headerExtensions, rtcp } = rtpParameters;
      const payloads = codecs.map((codec) => codec.payloadType).join(' ');

      return {
        type: section.type,
        port: 7,
        protocol: 'UDP/TLS/RTP/SAVPF',
        payloads,
        connection: { version: 4, ip: '127.0.0.1' },
        mid: section.mid,
        direction: 'recvonly',
        iceUfrag: usernameFragment,
        icePwd: password,
        fingerprint,
        setup,
        candidates,
        endOfCandidates: 'end-of-candidates',
        rtcpMux: 'rtcp-mux',
        ...(rtcp?.reducedSize ? { rtcpRsize: 'rtcp-rsize' } : {}),
        rtp: codecs.map(toRtp),
        fmtp: codecs
          .filter((codec) => Object.keys(codec.parameters ?? {}).length > 0)
          .map(toFmtp),
        rtcpFb: codecs.flatMap(toRtcpFb),
        ext: (headerExtensions ?? []).map((ext) => ({
          value: ext.id,
          uri: ext.uri
        }))
      };
    }
  );

  return sdpTransform.write({
    version: 0,
    origin: {
      username: '-',
      sessionId: Date.now(),
      sessionVersion: 1,
      netType: 'IN',
      ipVer: 4,
      address: '127.0.0.1'
    },
    name: '-',
    timing: { start: 0, stop: 0 },
    icelite: 'ice-lite',
    groups: [
      { type: 'BUNDLE', mids: media.map((section) => section.mid).join(' ') }
    ],
    media
  });
};

export { buildAnswer };

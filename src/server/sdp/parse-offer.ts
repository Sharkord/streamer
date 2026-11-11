import sdpTransform, { type MediaDescription } from 'sdp-transform';
import type {
  TDtlsFingerprint,
  TRtpCapabilities,
  TRtpParameters
} from '../types';
import type { TMediaKind, TOffer, TOfferMedia } from './types';

type TCodec = TRtpParameters['codecs'][number];
type TCapabilityCodec = NonNullable<TRtpCapabilities['codecs']>[number];

const isMediaKind = (type: string): type is TMediaKind =>
  type === 'audio' || type === 'video';

const isSameMimeType = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

// mediasoup only accepts the profiles the router lists. encoders labelling a
// stream plain baseline or constrained high (ffmpeg's whip does for baseline)
// send what browsers decode as constrained baseline and high, so only the
// label changes, never the video
const H264_PROFILE_ALIASES: Record<string, string> = {
  '4200': '42e0',
  '640c': '6400'
};

const normalizeH264Profile = (parameters: Record<string, unknown>) => {
  const profileLevelId = parameters['profile-level-id'];

  if (profileLevelId === undefined) return parameters;

  // sdp-transform reads an all digit id like 640033 as a number, and mediasoup
  // takes a profile-level-id that is not a string as missing
  const id = String(profileLevelId).toLowerCase();
  const alias = H264_PROFILE_ALIASES[id.slice(0, 4)];
  const normalized = alias ? `${alias}${id.slice(4)}` : id;

  return { ...parameters, 'profile-level-id': normalized };
};

const getFmtpParameters = (
  section: MediaDescription,
  payload: number,
  codec: string
) => {
  const fmtp = section.fmtp.find((entry) => entry.payload === payload);
  const parameters = sdpTransform.parseParams(fmtp?.config ?? '');

  if (codec.toLowerCase() !== 'h264') return parameters;

  return normalizeH264Profile(parameters);
};

const findCapabilityCodec = (
  caps: TRtpCapabilities,
  kind: TMediaKind,
  codec: string
): TCapabilityCodec | undefined =>
  caps.codecs?.find((cap) => isSameMimeType(cap.mimeType, `${kind}/${codec}`));

// only keep the feedback mediasoup understands, so both sides agree on it
const getRtcpFeedback = (
  section: MediaDescription,
  payload: number,
  capCodec: TCapabilityCodec
) =>
  (section.rtcpFb ?? [])
    .filter((fb) => String(fb.payload) === String(payload))
    .map((fb) => ({ type: fb.type, parameter: fb.subtype ?? '' }))
    .filter((fb) =>
      capCodec.rtcpFeedback?.some(
        (cap) => cap.type === fb.type && (cap.parameter ?? '') === fb.parameter
      )
    );

const getRtxCodec = (
  section: MediaDescription,
  kind: TMediaKind,
  payload: number
): TCodec | undefined => {
  const rtx = section.rtp.find((entry) => {
    if (!isSameMimeType(entry.codec, 'rtx')) return false;

    const { apt } = getFmtpParameters(section, entry.payload, entry.codec);

    return Number(apt) === payload;
  });

  if (!rtx) return undefined;

  return {
    mimeType: `${kind}/rtx`,
    payloadType: rtx.payload,
    clockRate: rtx.rate ?? 90000,
    parameters: { apt: payload },
    rtcpFeedback: []
  };
};

const getHeaderExtensions = (
  section: MediaDescription,
  kind: TMediaKind,
  caps: TRtpCapabilities
) =>
  (section.ext ?? [])
    .filter((ext) =>
      caps.headerExtensions?.some(
        (cap) => cap.kind === kind && cap.uri === ext.uri
      )
    )
    .map((ext) => ({
      uri: ext.uri,
      id: ext.value
    })) as TRtpParameters['headerExtensions'];

// without ssrcs in the offer mediasoup matches the packets by mid instead
const getEncodings = (section: MediaDescription, hasRtx: boolean) => {
  const fid = section.ssrcGroups?.find((group) => group.semantics === 'FID');
  let ssrc = section.ssrcs?.[0]?.id;
  let rtxSsrc: number | undefined;

  if (fid) {
    [ssrc, rtxSsrc] = fid.ssrcs.split(' ').map(Number);
  }

  return [
    {
      ...(ssrc ? { ssrc: Number(ssrc) } : {}),
      ...(hasRtx && rtxSsrc ? { rtx: { ssrc: rtxSsrc } } : {})
    }
  ];
};

const getCname = (section: MediaDescription) => {
  const cname = section.ssrcs?.find((entry) => entry.attribute === 'cname');

  return cname?.value ? String(cname.value) : undefined;
};

const parseMedia = (
  section: MediaDescription,
  kind: TMediaKind,
  caps: TRtpCapabilities
): TOfferMedia => {
  // a whip client offers what it is already encoding, so the first codec the
  // router knows is the one. mediasoup checks the profile itself in produce()
  const rtp = section.rtp.find((entry) =>
    findCapabilityCodec(caps, kind, entry.codec)
  );

  if (!rtp) {
    const offered = section.rtp.map((entry) => entry.codec).join(', ');

    throw new Error(
      `None of the offered ${kind} codecs (${offered}) is supported. Use H.264 or AV1 for video and Opus for audio.`
    );
  }

  const capCodec = findCapabilityCodec(caps, kind, rtp.codec)!;
  const codec: TCodec = {
    mimeType: `${kind}/${rtp.codec}`,
    payloadType: rtp.payload,
    clockRate: rtp.rate ?? 90000,
    parameters: getFmtpParameters(section, rtp.payload, rtp.codec),
    rtcpFeedback: getRtcpFeedback(section, rtp.payload, capCodec)
  };

  if (kind === 'audio') {
    codec.channels = rtp.encoding ?? 2;
  }

  const rtxCodec = getRtxCodec(section, kind, rtp.payload);
  const codecs = rtxCodec ? [codec, rtxCodec] : [codec];

  return {
    kind,
    section,
    rtpParameters: {
      // sdp-transform hands back a numeric mid as a number, mediasoup wants a string
      mid: section.mid === undefined ? undefined : String(section.mid),
      codecs,
      headerExtensions: getHeaderExtensions(section, kind, caps),
      encodings: getEncodings(section, Boolean(rtxCodec)),
      rtcp: {
        cname: getCname(section),
        reducedSize: Boolean(section.rtcpRsize)
      }
    }
  };
};

/**
 * Reads a whip offer into what mediasoup needs. Throws with a message meant
 * for the streamer when the offer cannot be used.
 */
const parseOffer = (sdp: string, caps: TRtpCapabilities): TOffer => {
  const session = sdpTransform.parse(sdp);
  const sections = session.media.filter((section) => isMediaKind(section.type));
  const [firstSection] = sections;

  if (!firstSection) {
    throw new Error('The offer has no audio or video.');
  }

  const fingerprint = firstSection.fingerprint ?? session.fingerprint;

  if (!fingerprint) {
    throw new Error('The offer has no DTLS fingerprint.');
  }

  const setup = firstSection.setup ?? session.setup ?? 'actpass';

  return {
    // actpass and active both leave us passive, so the client drives dtls
    remoteDtlsRole: setup === 'passive' ? 'server' : 'client',
    fingerprint: {
      algorithm: fingerprint.type as TDtlsFingerprint['algorithm'],
      value: fingerprint.hash
    },
    medias: sections.map((section) =>
      parseMedia(section, section.type as TMediaKind, caps)
    )
  };
};

export { parseOffer };

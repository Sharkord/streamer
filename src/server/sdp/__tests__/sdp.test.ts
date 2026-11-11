import { expect, test } from 'bun:test';
import type { TRtpCapabilities, TTransport } from '../../types';
import { buildAnswer } from '../build-answer';
import { parseOffer } from '../parse-offer';

// shaped like what a libdatachannel based streaming app posts
const offer = `v=0
o=rtc 123 0 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic:WMS *
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=mid:0
a=sendonly
a=ssrc:1111 cname:app
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;maxaveragebitrate=96000;stereo=1;sprop-stereo=1;useinbandfec=1
a=setup:actpass
a=ice-ufrag:abcd
a=ice-pwd:abcdefghijklmnopqrstuvwx
a=fingerprint:sha-256 AA:BB:CC
m=video 9 UDP/TLS/RTP/SAVPF 96 97
c=IN IP4 0.0.0.0
a=mid:1
a=sendonly
a=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:9 urn:example:unknown
a=ssrc-group:FID 2222 3333
a=ssrc:2222 cname:app
a=ssrc:3333 cname:app
a=rtcp-mux
a=rtpmap:96 H264/90000
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtcp-fb:96 goog-remb
a=fmtp:96 profile-level-id=640c1f;packetization-mode=1;level-asymmetry-allowed=1
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=setup:actpass
a=ice-ufrag:abcd
a=ice-pwd:abcdefghijklmnopqrstuvwx
a=fingerprint:sha-256 AA:BB:CC
`;

const caps = {
  codecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
      rtcpFeedback: [{ type: 'transport-cc' }]
    },
    {
      kind: 'video',
      mimeType: 'video/H264',
      clockRate: 90000,
      rtcpFeedback: [{ type: 'nack' }, { type: 'nack', parameter: 'pli' }]
    }
  ],
  headerExtensions: [
    {
      kind: 'video',
      uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
      preferredId: 4
    }
  ]
} as unknown as TRtpCapabilities;

const transport = {
  iceParameters: { usernameFragment: 'srv', password: 'srvpwd' },
  iceCandidates: [
    {
      foundation: 'udp',
      priority: 1,
      ip: '0.0.0.0',
      address: '203.0.113.5',
      protocol: 'udp',
      port: 40000,
      type: 'host'
    }
  ],
  dtlsParameters: { fingerprints: [{ algorithm: 'sha-256', value: 'DD:EE' }] }
} as unknown as TTransport;

test('maps a streaming app offer to producer parameters', () => {
  const parsed = parseOffer(offer, caps);
  const [audio, video] = parsed.medias;

  expect(parsed.remoteDtlsRole).toBe('client');
  expect(parsed.fingerprint).toEqual({
    algorithm: 'sha-256',
    value: 'AA:BB:CC'
  });
  expect(audio!.rtpParameters.encodings).toEqual([{ ssrc: 1111 }]);
  expect(audio!.rtpParameters.codecs[0]!.channels).toBe(2);
  expect(video!.rtpParameters.mid).toBe('1');
  expect(video!.rtpParameters.codecs.map((c) => c.mimeType)).toEqual([
    'video/H264',
    'video/rtx'
  ]);
  expect(video!.rtpParameters.codecs[0]!.rtcpFeedback).toHaveLength(2);
  expect(video!.rtpParameters.headerExtensions).toHaveLength(1);
  expect(video!.rtpParameters.encodings).toEqual([
    { ssrc: 2222, rtx: { ssrc: 3333 } }
  ]);
});

test('relabels h264 profiles mediasoup does not list', () => {
  const getProfile = (sdp: string) =>
    parseOffer(sdp, caps).medias[1]!.rtpParameters.codecs[0]!.parameters![
      'profile-level-id'
    ];

  expect(getProfile(offer)).toBe('64001f');
  expect(getProfile(offer.replace('640c1f', '42001f'))).toBe('42e01f');
  expect(getProfile(offer.replace('640c1f', '4d001f'))).toBe('4d001f');
  expect(getProfile(offer.replace('640c1f', '640033'))).toBe('640033');
});

test('answers with a recvonly ice-lite description', () => {
  const answer = buildAnswer(parseOffer(offer, caps), transport);

  expect(answer).toContain('a=ice-lite');
  expect(answer).toContain('a=group:BUNDLE 0 1');
  expect(answer).toContain('a=setup:passive');
  expect(answer).toContain('a=recvonly');
  expect(answer).toContain(
    'a=candidate:udp 1 udp 1 203.0.113.5 40000 typ host'
  );
  expect(answer).toContain('a=fmtp:97 apt=96');
  expect(answer).toContain('a=fingerprint:sha-256 DD:EE');
  expect(answer).not.toContain('goog-remb');
});

test('rejects codecs the router cannot take', () => {
  expect(() => parseOffer(offer.replaceAll('H264', 'HEVC'), caps)).toThrow(
    'None of the offered video codecs (HEVC, rtx) is supported'
  );
});

test('rejects an offer without media', () => {
  expect(() => parseOffer('v=0\r\ns=-\r\nt=0 0\r\n', caps)).toThrow(
    'The offer has no audio or video.'
  );
});

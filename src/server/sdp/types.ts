import type { MediaDescription } from 'sdp-transform';
import type { TDtlsFingerprint, TRtpParameters } from '../types';

type TMediaKind = 'audio' | 'video';

type TOfferMedia = {
  kind: TMediaKind;
  rtpParameters: TRtpParameters;
  section: MediaDescription;
};

type TOffer = {
  remoteDtlsRole: 'client' | 'server';
  fingerprint: TDtlsFingerprint;
  medias: TOfferMedia[];
};

export type { TMediaKind, TOffer, TOfferMedia };

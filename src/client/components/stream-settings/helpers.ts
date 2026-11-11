import manifest from '../../../../manifest.json';

export const getWhipUrl = () =>
  `${window.location.origin}/plugins/${manifest.id}/whip`;

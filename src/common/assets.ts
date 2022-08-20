import TrexAudio from 'src/assets/t-rex-roar.mp3';
import Sample12s from 'src/assets/sample-12s.mp3';
import ReactImage from 'src/assets/react.png';

export type ImageName = 'react.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const imageMap: { [imageName in ImageName]: any } = {
  'react.png': ReactImage,
};

export type AudioName = 't-rex-roar.mp3' | 'sample-12s.mp3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const audioMap: { [audioName in AudioName]: any } = {
  't-rex-roar.mp3': TrexAudio,
  'sample-12s.mp3': Sample12s,
};

export type FileName = AudioName | ImageName;

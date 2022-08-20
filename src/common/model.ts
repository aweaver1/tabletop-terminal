export type FolderName = 'files' | 'images' | 'audio';

export type FolderOrFileName = FolderName | FileName;

export type File = {
  name: FileName;
  src: string;
  type: FileType;
};

export type Folder = {
  [name in FolderOrFileName]?: Folder | File;
};

export type Image = File & {
  type: 'image';
};

export type FileType = 'image' | 'audio';

export type AudioName = 't-rex-roar.mp3' | 'sample-12s.mp3';

export type ImageName = 'react.png' | 'puppy.jpg';

export type FileName = AudioName | ImageName;

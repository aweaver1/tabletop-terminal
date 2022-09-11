import Constants from 'src/common/constants';
import term from 'src/terminal/term';
import { Folder, File, FolderName, FolderOrFileName } from 'src/common/model';
import BriefingAudio from 'src/assets/briefing.m4a';
import HouseImage from 'src/assets/house.png';

const directories: Folder = {
  // TODO: Uncomment me
  // operations: {
  //   iago: {
  //     'briefing.mp3': {
  //       name: 'briefing.mp3',
  //       src: BriefingAudio,
  //       type: 'audio',
  //     },
  //   },
  // },
  'briefing.mp3': {
    name: 'briefing.mp3',
    src: BriefingAudio,
    type: 'audio',
  },
  'house.png': {
    name: 'house.png',
    src: HouseImage,
    type: 'image',
  },
};

let currentPath: FolderName[] = [];

export const getCurrentPath = () => currentPath;

export const setCurrentPath = (pathString: string) => {
  const newPath = buildPath(pathString);
  const directory = getFolder(newPath);

  if (directory) {
    currentPath = newPath as FolderName[];
  } else {
    term.writeln(`Directory '/${newPath.join('/')}' not found.`);
  }
};

export const formatCurrentPath = () =>
  currentPath.length ? '/' + getCurrentPath().join('/') : '';

export const listDirectoryContents = (pathString?: string) => {
  const path = pathString ? buildPath(pathString) : currentPath;

  const directory = getFolder(path);

  if (directory) {
    [...Object.keys(directory)]
      .sort()
      .forEach((key) =>
        term.writeln(
          `${Constants.INDENT}${key}${isDirectory(directory[key]) ? '/' : ''}`
        )
      );
  } else {
    term.writeln(`Directory '/${path.join('/')}' not found.`);
  }
};

const buildPath = (pathString: string): FolderOrFileName[] => {
  const folders = pathString.split('/');

  if (!folders[0] || folders[0] === '~') {
    folders.shift();
  } else {
    folders.unshift(...getCurrentPath());
  }

  if (!folders[folders.length - 1]) {
    folders.pop();
  }

  while (folders.indexOf('..') > -1) {
    folders.splice(folders.indexOf('..') - 1, 2);
  }

  return folders as FolderOrFileName[];
};

const getFolderOrFile = (path: FolderOrFileName[]): Folder | File | null => {
  return (
    path.reduce((prev, curr) => {
      return prev ? prev[curr] : null;
    }, directories) || null
  );
};

const isDirectory = (folderOrFile: Folder | File | null): boolean =>
  !!folderOrFile && !Object.prototype.hasOwnProperty.call(folderOrFile, 'type');

const getFolder = (path: FolderOrFileName[]): Folder | null => {
  const folderOrFile = getFolderOrFile(path);
  return isDirectory(folderOrFile) ? (folderOrFile as Folder) : null;
};

export const getFile = (pathString: string): File | null => {
  const path = buildPath(pathString);
  const folderOrFile = getFolderOrFile(path);

  const file = !isDirectory(folderOrFile) ? (folderOrFile as File) : null;

  if (!file) {
    term.writeln(`File '/${path.join('/')}' not found.`);
  }

  return file;
};

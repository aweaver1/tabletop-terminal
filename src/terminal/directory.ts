import { FileName } from 'src/common/assets';
import Constants from 'src/common/constants';
import term from './term';

export type FolderName = 'files' | 'images' | 'audio';

export type Folder = {
  [name in FolderName | FileName]?: Folder | null;
};

const directories: Folder = {
  files: {
    images: {
      'react.png': null,
    },
    audio: {
      't-rex-roar.mp3': null,
      'sample-12s.mp3': null,
    },
  },
};

let currentPath: FolderName[] = [];

export const getCurrentPath = () => currentPath;

export const setCurrentPath = (path: string) => {
  const newPath = buildPath(path);

  if (getDirectory(newPath)) {
    currentPath = newPath;
  } else {
    term.writeln(`Directory ${path} not found.`);
  }
};

export const formatCurrentPath = () =>
  currentPath.length ? '/' + getCurrentPath().join('/') : '';

export const listDirectoryContents = (path?: string) => {
  const directory = getDirectory(path ? buildPath(path) : currentPath);

  if (!directory) {
    term.writeln(`Directory ${path} not found.`);
  } else {
    [...Object.keys(directory)]
      .sort()
      .forEach((key) =>
        term.writeln(`${Constants.INDENT}${key}${directory[key] ? '/' : ''}`)
      );
  }
};

const buildPath = (path: string): FolderName[] => {
  const folders = path.replace('~', '/').split('/');

  if (!folders[0]) {
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

  return folders as FolderName[];
};

const getDirectory = (path: FolderName[]) => {
  return path.reduce((prev, curr) => {
    return prev ? prev[curr] : null;
  }, directories);
};

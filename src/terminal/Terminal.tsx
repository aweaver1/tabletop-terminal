import * as React from 'react';
import 'xterm/css/xterm.css';
import Constants from 'src/common/constants';
import { secondsToTimestamp } from 'src/common/util';
import term, {
  writeLines,
  moveCursorTo,
  writeLoader,
  initializeTerminal,
} from 'src/terminal/term';
import { Image } from 'src/common/model';
import {
  disableKeystrokes,
  enableCommands,
  enableLogin,
  enablePassword,
} from 'src/terminal/sequences';
import { getFile, listDirectoryContents, setCurrentPath } from './directory';

export type Command = {
  func: (...args: string[]) => void;
  description?: string;
  examples?: string[];
  hidden?: boolean;
};

export type CommandMap = {
  [commandName: string]: Command;
};

let commandMap: CommandMap = {};

const buildCommandMap = (
  onOpenImage: (image: Image) => void,
  onEnableGlitch: (enabled: boolean) => void
) => {
  commandMap = {
    '': {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      func: () => {},
    },
    help: {
      description: 'Print all available commands with example usages.',
      func: () => {
        Object.entries(commandMap)
          .filter(([, command]) => !!command.description && !command.hidden)
          .forEach(([commandName, command]) => {
            term.writeln(
              `${Constants.INDENT}${commandName}: ${command.description}`
            );
            if (command.examples) {
              command.examples.forEach((example) =>
                term.writeln(`${Constants.INDENT}${Constants.INDENT}${example}`)
              );
            }
            writeLines(1);
          });
      },
    },
    ls: {
      description: 'List all contents of a directory at a given path.',
      examples: [
        "'ls' lists all entries in current directory.",
        // TODO: Uncomment me
        // "'ls files' lists all entries in a directory called 'files' within current directory.",
        // "'ls files/audio' lists all entries in a directory called 'audio' within 'files' within current directory.",
        // "'ls /files/audio' lists all entries in a directory called 'audio' within 'files' from root (denoted by leading '/').",
        // "'ls ..' lists all entries in previous directory.",
        // "'ls /' lists all entries in root directory.",
      ],
      func: (path?: string) => {
        listDirectoryContents(path);
      },
    },
    cd: {
      description: 'Change current working directory to given path.',
      examples: [
        "'cd operations' opens a directory called 'operations' in the current directory.",
        "'cd operations/iago' opens directory 'iago' within 'operations' from current directory",
        "'cd /operations/iago' opens directory 'iago' within 'operations' from root (denoted by leading '/')",
        "'cd ..' opens previous directory.",
        "'cd /' opens root directory.",
      ],
      func: (pathString?: string) => {
        if (!pathString) {
          term.writeln(
            "Expected argument $path. Try 'help' for more information."
          );
        } else {
          setCurrentPath(pathString);
        }
      },
      hidden: true,
    },
    play: {
      description: 'Play an audio file at a given path.',
      examples: [
        "'play briefing.mp3' plays an audio file called 'briefing.mp3' within current directory.",
        // TODO: Uncomment me
        // "'play files/briefing.mp3' plays an audio file called 'briefing.mp3' within a directory called 'files' within current directory.",
        // "'play /files/briefing.mp3' plays an audio file called 'briefing.mp3' within a directory called 'files' from root (denoted by leading '/').",
      ],
      func: async (pathString?: string) => {
        if (!pathString) {
          term.writeln(
            "Expected argument $path. Try 'help' for more information."
          );
        } else {
          const file = getFile(pathString);

          if (file) {
            if (file.type !== 'audio') {
              term.writeln('Cannot play audio, invalid file format.');
            } else {
              await new Promise<void>((resolve) => {
                if (file.name === 'briefing.mp3') {
                  setTimeout(() => onEnableGlitch(true), 30000);
                  setTimeout(() => onEnableGlitch(false), 40000);
                }

                const audio = new Audio(file.src);

                audio.addEventListener(
                  'timeupdate',
                  () => {
                    moveCursorTo(0);
                    writeLoader(
                      audio.currentTime / audio.duration,
                      `${secondsToTimestamp(
                        audio.currentTime
                      )}/${secondsToTimestamp(audio.duration)}`
                    );
                  },
                  false
                );

                audio.addEventListener(
                  'ended',
                  () => {
                    resolve();
                  },
                  false
                );

                audio.play();
              });

              writeLines(1);
            }
          }
        }
      },
    },
    view: {
      description: 'View an image file at a given path.',
      examples: [
        "'view house.png' opens an image called 'house.png' in current directory'",
        // TODO: Uncomment me
        // "'view files/image.png' opens an image called 'image.png' within a directory called 'files' within current directory.",
        // "'view /files/image.png' opens an image called 'image.png' within a directory called 'files' from root (denoted by leading '/').",
      ],
      func: (pathString?: string) => {
        if (!pathString) {
          term.writeln(
            "Expected argument $path. Try 'help' for more information."
          );
        } else {
          const file = getFile(pathString);

          if (file) {
            if (file.type !== 'image') {
              term.writeln('Cannot view image, invalid file format.');
            } else {
              onOpenImage({ ...file } as Image);
            }
          }
        }
      },
    },
    map: {
      description: 'Maps the provided address by generating a link.',
      examples: ['\'map "1600 Pennsylvania Ave NW"\''],
      func: (addressString?: string) => {
        if (!addressString) {
          term.writeln(
            "Expected argument $address. Try 'help' for more information."
          );
        } else {
          term.writeln(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              addressString
            )}`
          );
        }
      },
      hidden: true,
    },
    exit: {
      description: 'Exit the current session, logging you out.',
      func: () => window.location.reload(),
    },
    fallback: {
      func: () =>
        term.writeln("Unrecognized command. Try 'help' for more information."),
    },
  };

  return commandMap;
};

let initialized = false;

export type TerminalProps = {
  pauseKeystrokes: boolean;
  onEnableGlitch: (enabled: boolean) => void;
  onOpenImage: (image: Image) => void;
};

const Terminal: React.FunctionComponent<TerminalProps> = (props) => {
  const { pauseKeystrokes, onEnableGlitch, onOpenImage } = props;

  const termRef = React.useRef(null);

  React.useEffect(() => {
    if (!initialized && termRef.current) {
      initialized = true;

      buildCommandMap(onOpenImage, onEnableGlitch);

      initializeTerminal(termRef);

      (async () => {
        if ((await enableLogin()) !== 'bypass') {
          await enablePassword(onEnableGlitch);
        }

        enableCommands(buildCommandMap(onOpenImage, onEnableGlitch));
      })();
    }
  }, []);

  React.useEffect(() => {
    disableKeystrokes(!!pauseKeystrokes);
  }, [pauseKeystrokes]);

  return (
    <div
      id="term"
      ref={termRef}
      style={{ height: '100vh', minWidth: '600px' }}
    />
  );
};

export default Terminal;

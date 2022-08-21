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
};

export type CommandMap = {
  [commandName: string]: Command;
};

let commandMap: CommandMap = {};

const buildCommandMap = (onOpenImage: (image: Image) => void) => {
  commandMap = {
    '': {
      func: () => writeLines(1),
    },
    help: {
      func: () => {
        Object.entries(commandMap)
          .map(([commandName, command]) => [commandName, command.description])
          .filter(([, description]) => !!description)
          .forEach(([commandName, description]) => {
            term.writeln(`${Constants.INDENT}${commandName}: ${description}`);
          });
      },
    },
    list: {
      description:
        "List all contents of a directory at a given path (e.g., 'list', 'list files', 'list /files/audio', 'list ..').",
      func: (path?: string) => {
        listDirectoryContents(path);
      },
    },
    view: {
      description:
        "View an image file in a given directory (e.g., 'view myimage.png', 'view /files/images/myimage.png').",
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
    open: {
      description:
        "Open a directory at a given path (e.g., 'open files', 'open /files/images', 'open ..', 'open ~').",
      func: (pathString?: string) => {
        if (!pathString) {
          term.writeln(
            "Expected argument $path. Try 'help' for more information."
          );
        } else {
          setCurrentPath(pathString);
        }
      },
    },
    play: {
      description:
        "Play an audio file in a given directory (e.g., 'play myaudio.mp3', 'play /files/audio/myaudio.mp3').",
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
    map: {
      description:
        'Maps the provided address by generating a link (e.g., \'map "1600 Pennsylvania Ave NW"\').',
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
  onUnauthorizedAccess: () => void;
  onOpenImage: (image: Image) => void;
};

const Terminal: React.FunctionComponent<TerminalProps> = (props) => {
  const { pauseKeystrokes, onUnauthorizedAccess, onOpenImage } = props;

  const termRef = React.useRef(null);

  React.useEffect(() => {
    if (!initialized && termRef.current) {
      initialized = true;

      buildCommandMap(props.onOpenImage);

      initializeTerminal(termRef);

      (async () => {
        if ((await enableLogin()) !== 'bypass') {
          await enablePassword(onUnauthorizedAccess);
        }

        enableCommands(buildCommandMap(onOpenImage));
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

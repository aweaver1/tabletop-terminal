import * as React from 'react';
import 'xterm/css/xterm.css';
import Constants from 'src/common/constants';
import { secondsToTimestamp } from 'src/common/util';
import term, {
  writeLines,
  handleFileNotFound,
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
import { imageMap, audioMap } from 'src/common/assets';
import { listDirectoryContents, setCurrentPath } from './directory';

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
      description: 'List all contents of the current directory.',
      func: (path?: string) => {
        listDirectoryContents(path);
      },
    },
    view: {
      description:
        'View an image file in the current directory (e.g., view myimage.png).',
      func: (fileName: string) => {
        if (!imageMap[fileName]) {
          handleFileNotFound(fileName);
          return;
        }

        onOpenImage({ name: fileName, src: imageMap[fileName] });
      },
    },
    open: {
      description:
        'Open a directory (e.g., open files, open /files/images, open .., open ~).',
      func: (path?: string) => {
        if (!path) {
          term.writeln(
            "Expected argument $path. Try 'help' for more information."
          );
        } else {
          setCurrentPath(path);
        }
      },
    },
    play: {
      description:
        'Play an audio file in the current directory (e.g., play myaudio.mp3).',
      func: async (fileName: string) => {
        if (!audioMap[fileName]) {
          handleFileNotFound(fileName);
          return;
        }

        await new Promise<void>((resolve) => {
          const audio = new Audio(audioMap[fileName]);

          audio.addEventListener(
            'timeupdate',
            () => {
              moveCursorTo(0);
              writeLoader(
                audio.currentTime / audio.duration,
                `${secondsToTimestamp(audio.currentTime)}/${secondsToTimestamp(
                  audio.duration
                )}`
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
  onOpenImage: (image: Image) => void;
};

const Terminal: React.FunctionComponent<TerminalProps> = (props) => {
  const { pauseKeystrokes, onOpenImage } = props;

  const termRef = React.useRef(null);

  React.useEffect(() => {
    if (!initialized && termRef.current) {
      initialized = true;

      buildCommandMap(props.onOpenImage);

      initializeTerminal(termRef);

      (async () => {
        if ((await enableLogin()) !== 'bypass') {
          await enablePassword();
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

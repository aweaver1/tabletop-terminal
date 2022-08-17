import * as React from 'react';
import 'xterm/css/xterm.css';
import '98.css/dist/98.css';
import './App.css';
import { IDisposable, Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import KlaxonAudio from './assets/klaxon.mp3';
import TrexAudio from './assets/t-rex-roar.mp3';
import Sample12s from './assets/sample-12s.mp3';
import ReactImage from './assets/react.png';

const waitFor = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

const secondsToTimestamp = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor((totalSeconds % 3600) % 60);

  const hoursString = hours > 9 ? hours : `0${hours}`;
  const minutesString = minutes > 9 ? minutes : `0${minutes}`;
  const secondsString = seconds > 9 ? seconds : `0${seconds}`;

  const minutesSecondsString = `${minutesString}:${secondsString}`;

  return hours
    ? `${hoursString}:${minutesSecondsString}`
    : minutesSecondsString;
};

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=+!@#$%^&*();:,<.>/?';

const INDENT = '    ';

const term = new Terminal({
  cursorStyle: 'underline',
});

term.loadAddon(new WebLinksAddon());

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const writeLines = (num: number) =>
  Array(num)
    .fill(null)
    .forEach(() => term.writeln(''));

const lines = [''];
const getCurrentLine = () => lines[lines.length - 1];
const setCurrentLine = (str: string) => (lines[lines.length - 1] = str);
const appendToCurrentLine = (str: string) =>
  setCurrentLine(getCurrentLine() + str);

const moveCursorHome = () => term.write('\x1b[H');
const moveCursorTo = (col: number) => term.write(`\x1b[${col}G`);
const moveCursorBack = (cols: number) => term.write(`\x1b[${cols}D`);

const handleBackspace = (hidden?: boolean) => {
  if (!getCurrentLine()) return;

  setCurrentLine(getCurrentLine().slice(0, -1));

  if (!hidden) {
    moveCursorBack(1);
    term.write(' ');
    moveCursorBack(1);
  }
};

const handleFileNotFound = (fileName: string) => {
  if (!fileName) {
    term.writeln(
      "Expected argument $fileName. Try 'help' for more information."
    );
  } else {
    term.writeln(`File ${fileName} not found.`);
  }
};

const writeLoader = (ratio: number, offset = 0) => {
  const pips = 20;
  const progress = Math.ceil(ratio * pips);

  const loader = `${Array(progress).fill('=').join('')}${Array(pips - progress)
    .fill('-')
    .join('')} ${Math.ceil(ratio * 100)}%`;

  moveCursorTo(offset);

  term.write(loader);
};

const credentialMap = {
  dweaver: 'vinegar',
};

const imageMap = {
  'react.png': ReactImage,
};

const audioMap = {
  't-rex-roar.mp3': TrexAudio,
  'sample-12s.mp3': Sample12s,
};

const klaxon = new Audio(KlaxonAudio);
klaxon.addEventListener(
  'ended',
  () => {
    klaxon.currentTime = 0;
    klaxon.play();
  },
  false
);

type Command = {
  func: (...args: string[]) => void;
  description?: string;
};

type CommandMap = {
  [commandName: string]: Command;
};

let commandMap: CommandMap = {};

const buildCommandMap = (
  setImageName: React.Dispatch<React.SetStateAction<string | null>>
) => {
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
            term.writeln(`${INDENT}${commandName}: ${description}`);
          });
      },
    },
    list: {
      description: 'List all files in the current directory.',
      func: () => {
        [...Object.keys(imageMap), ...Object.keys(audioMap)].forEach((key) =>
          term.writeln(`${INDENT}${key}`)
        );
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

        disableKeyStrokes();
        setImageName(fileName);
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
              writeLoader(audio.currentTime / audio.duration);
              term.write(' ');
              term.write(
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
    fallback: {
      func: () =>
        term.writeln("Unrecognized command. Try 'help' for more information."),
    },
  };
};

let login = 'redacted';
let commandPrefix = 'redacted@redacted:~$ ';

const typewriteString = async (str: string, delay?: number) => {
  for (const char of str.split('')) {
    term.write(char);
    await waitFor(delay ? delay : 50);
  }
};

const handleCharacterKeystroke = (
  key: string,
  domEvent: KeyboardEvent,
  hidden?: boolean
) => {
  if (key.charCodeAt(0) !== 27 && !domEvent.ctrlKey && !domEvent.altKey) {
    // Arrows and modifiers
    appendToCurrentLine(key);
    if (!hidden) term.write(key);
  }
};

const enableLoginKeyStrokes = () => {
  term.write('login: ');

  const handler = term.onKey(({ key, domEvent }) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) {
      // Enter
      const command = getCurrentLine().trim();

      if (!command) return;

      handler.dispose();

      login = command;
      commandPrefix = `${command}@redacted:~$ `;

      writeLines(1);
      lines.push('');

      if (command === 'bypass') {
        enableKeyStrokes();
        return;
      }

      enablePasswordKeyStrokes();
    } else if (charCode === 127) {
      // Backspace
      handleBackspace();
    } else {
      handleCharacterKeystroke(key, domEvent);
    }
  });
};

const enablePasswordKeyStrokes = () => {
  let attempts = 2;
  term.write('password: ');

  const handler = term.onKey(async ({ key, domEvent }) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) {
      const command = getCurrentLine().trim();

      if (!command) return;

      if (command !== credentialMap[login]) {
        await waitFor(200);
        moveCursorTo(0);
        term.writeln(`Invalid credentials. ${attempts} attempts remaining.`);

        if (!attempts) {
          handler.dispose();
          await waitFor(1000);

          writeLines(1);
          await typewriteString('Unauthorized access detected.');
          writeLines(1);

          klaxon.play();

          await waitFor(200);
          writeLines(1);

          await typewriteString('Initiating drone strike in: ');

          for (let i = 10; i >= 0; i--) {
            moveCursorTo(0);
            term.write(`Initiating drone strike in: ${i} `);
            await waitFor(1000);
          }

          moveCursorHome();

          for (let i = 0; i < 5000; i++) {
            await waitFor(1);
            term.write(
              CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
            );
          }

          await waitFor(1000);

          writeLines(2);
          await typewriteString('Just kidding... ;)');

          await waitFor(3000);

          window.location.reload();
        } else {
          await waitFor(100);
          setCurrentLine('');
          term.write('password: ');
          attempts--;
        }

        return;
      }

      handler.dispose();
      term.blur();

      lines.push('');
      writeLines(2);

      for (let i = 0; i < 12; i++) {
        if (!i) {
          await typewriteString('Authenticating');
        } else {
          const dots = i % 4;

          moveCursorTo(0);
          term.write(
            'Authenticating' +
              Array(dots).fill('.').join('') +
              Array(3 - dots)
                .fill(' ')
                .join('')
          );
        }

        await waitFor(200);
      }

      writeLines(2);
      term.writeln('Authentication successful.');
      writeLines(1);

      await waitFor(500);

      runConnectionSequence();
    } else if (charCode === 127) {
      // Backspace
      handleBackspace(true);
    } else {
      handleCharacterKeystroke(key, domEvent, true);
    }
  });
};

let keystrokeHandler: IDisposable;

const disableKeyStrokes = () => {
  keystrokeHandler?.dispose();
};

const enableKeyStrokes = () => {
  term.focus();
  keystrokeHandler = term.onKey(async ({ key, domEvent }) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) {
      // Enter
      const line = getCurrentLine().trim();

      writeLines(1);

      if (line) {
        lines.push('');
      }

      const command = line.split(' ')[0];
      const args = line
        .split(' ')
        .slice(1)
        .filter((arg) => !!arg);

      if (commandMap[command]) {
        await commandMap[command].func(...args);
      } else {
        commandMap.fallback.func();
      }

      term.write(commandPrefix);
    } else if (charCode === 127) {
      // Backspace
      handleBackspace();
    } else {
      handleCharacterKeystroke(key, domEvent);
    }
  });
};

let opened = false;

const runStartup = () => {
  term.writeln('\x1B[32m');

  term.focus();

  enableLoginKeyStrokes();
};

const runConnectionSequence = async () => {
  const rows = 12;
  const baseLength = rows * 2 - 1;
  const indent = '                  ';

  const loaderPrefix = 'Establishing secure connection... ';

  await typewriteString(loaderPrefix);

  for (let i = 0; i <= 20; i++) {
    writeLoader(i / 20, loaderPrefix.length + 1);
    await waitFor(500);
  }

  writeLines(2);
  term.writeln('Connection secured.');
  writeLines(1);

  await waitFor(500);

  for (let row = 0; row < rows; row++) {
    const count = row * 2 + 1;
    const buffer = Array((baseLength - count) / 2)
      .fill(' ')
      .join('');
    term.writeln(indent + buffer + Array(count).fill('A').join('') + buffer);
    await waitFor(50);
  }

  await waitFor(500);

  writeLines(1);
  await typewriteString('Welcome Agent.');
  writeLines(1);

  await waitFor(500);

  writeLines(1);
  term.write(commandPrefix);

  term.focus();
  enableKeyStrokes();
};

const App: React.FunctionComponent = () => {
  const termRef = React.useRef(null);
  const [imageName, setImageName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (termRef.current && !opened) {
      buildCommandMap(setImageName);

      term.open(termRef.current);
      fitAddon.fit();

      runStartup();

      opened = true;
    }
  }, []);

  return (
    <>
      <div
        id="term"
        ref={termRef}
        style={{ height: '100vh', minWidth: '600px' }}
      />
      {imageName && (
        <div
          className="window"
          style={{
            position: 'fixed',
            margin: '10% 20%',
            top: 0,
            left: 0,
            zIndex: 100,
          }}
        >
          <div className="title-bar">
            <div className="title-bar-text">{imageName}</div>
            <div className="title-bar-controls">
              <button
                aria-label="Close"
                onClick={() => {
                  setImageName(null);
                  enableKeyStrokes();
                }}
              />
            </div>
          </div>
          <div className="window-body">
            <img src={imageMap[imageName]} />
          </div>
        </div>
      )}
    </>
  );
};

export default App;

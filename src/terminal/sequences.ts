import 'xterm/css/xterm.css';
import Constants from 'src/common/constants';
import { waitFor } from 'src/common/util';
import KlaxonAudio from 'src/assets/klaxon.mp3';
import term, {
  writeLines,
  moveCursorTo,
  writeLoader,
  getCurrentLine,
  lines,
  moveCursorHome,
  setCurrentLine,
  moveCursorBack,
  appendToCurrentLine,
  typewriteString,
} from './term';
import { IDisposable } from 'xterm';
import { formatCurrentPath } from './directory';
import { CommandMap } from './Terminal';

const credentialMap = {
  dweaver: 'vinegar',
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

let login = 'redacted';

const getCommandPrefix = () => `${login}@redacted:~${formatCurrentPath()}$ `;

let keystrokeHandler: IDisposable;

const disposeKeystrokeHandler = () => keystrokeHandler?.dispose();

const setKeystrokeHandler = (newKeystrokeHandler: IDisposable) => {
  disposeKeystrokeHandler();
  keystrokeHandler = newKeystrokeHandler;
};

export const enableLogin = () =>
  new Promise<string>((resolve) => {
    term.write(Constants.LOGIN_PREFIX);
    term.focus();

    setKeystrokeHandler(
      term.onKey(({ key, domEvent }) => {
        const charCode = key.charCodeAt(0);

        if (charCode === 13) {
          const command = getCurrentLine().trim();

          if (!command) return;

          disposeKeystrokeHandler();

          login = command;

          writeLines(1);
          lines.push('');

          resolve(command);
        } else if (charCode === 127) {
          handleBackspace();
        } else {
          handleCharacterKeystroke(key, domEvent);
        }
      })
    );
  });

export const enablePassword = async () =>
  new Promise<void>((resolve) => {
    term.write(Constants.PASSWORD_PREFIX);
    term.focus();

    let attempts = 2;

    setKeystrokeHandler(
      term.onKey(async ({ key, domEvent }) => {
        const charCode = key.charCodeAt(0);

        if (charCode === 13) {
          const command = getCurrentLine().trim();

          if (!command) return;

          if (command !== credentialMap[login]) {
            await waitFor(200);
            moveCursorTo(0);
            term.writeln(
              `Invalid credentials. ${attempts} attempts remaining.`
            );

            if (!attempts) {
              disposeKeystrokeHandler();

              await waitFor(1000);
              await runUnauthorizedAccessSequence();
            } else {
              await waitFor(100);
              setCurrentLine('');
              term.write(Constants.PASSWORD_PREFIX);
              attempts--;
            }

            return;
          }

          disposeKeystrokeHandler();

          await runAuthenticationSequence();

          await waitFor(500);

          await runConnectionSequence();

          resolve();
        } else if (charCode === 127) {
          handleBackspace(true);
        } else {
          handleCharacterKeystroke(key, domEvent, true);
        }
      })
    );
  });

const runUnauthorizedAccessSequence = async () => {
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
      Constants.CHARACTERS.charAt(
        Math.floor(Math.random() * Constants.CHARACTERS.length)
      )
    );
  }

  await waitFor(1000);

  writeLines(2);
  await typewriteString('Just kidding... ;)');

  await waitFor(3000);

  window.location.reload();
};

const runAuthenticationSequence = async () => {
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
};

const runConnectionSequence = async () => {
  const rows = 12;
  const baseLength = rows * 2 - 1;
  const indent = '                  ';

  const loaderPrefix = 'Establishing secure connection... ';

  await typewriteString(loaderPrefix);

  for (let i = 0; i <= 20; i++) {
    writeLoader(
      i / 20,
      `${Math.ceil((i / 20) * 100)}%`,
      loaderPrefix.length + 1
    );
    await waitFor(300);
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
  term.write(getCommandPrefix());
};

let keystrokesDisabled = false;

export const disableKeystrokes = (disable: boolean) => {
  keystrokesDisabled = disable;
};

export const enableCommands = (commandMap: CommandMap) => {
  term.focus();

  setKeystrokeHandler(
    term.onKey(async ({ key, domEvent }) => {
      if (keystrokesDisabled) return;

      const charCode = key.charCodeAt(0);

      if (charCode === 13) {
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

        term.write(getCommandPrefix());
      } else if (charCode === 127) {
        handleBackspace();
      } else {
        handleCharacterKeystroke(key, domEvent);
      }
    })
  );
};

const handleBackspace = (hidden?: boolean) => {
  if (!getCurrentLine()) return;

  setCurrentLine(getCurrentLine().slice(0, -1));

  if (!hidden) {
    moveCursorBack(1);
    term.write(' ');
    moveCursorBack(1);
  }
};

const handleCharacterKeystroke = (
  key: string,
  domEvent: KeyboardEvent,
  hidden?: boolean
) => {
  if (key.charCodeAt(0) !== 27 && !domEvent.ctrlKey && !domEvent.altKey) {
    appendToCurrentLine(key);
    if (!hidden) term.write(key);
  }
};

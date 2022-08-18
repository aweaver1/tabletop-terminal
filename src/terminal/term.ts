import { Terminal as XTerminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import { waitFor } from 'src/common/util';

export const term = new XTerminal({
  cursorStyle: 'underline',
});

export default term;

term.loadAddon(new WebLinksAddon());

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initializeTerminal = (termRef: any) => {
  term.open(termRef.current);
  fitAddon.fit();
  term.writeln('\x1B[32m');
  term.focus();
};

export const lines = [''];

export const getCurrentLine = () => lines[lines.length - 1];
export const setCurrentLine = (str: string) => (lines[lines.length - 1] = str);
export const appendToCurrentLine = (str: string) =>
  setCurrentLine(getCurrentLine() + str);

export const moveCursorHome = () => term.write('\x1b[H');
export const moveCursorTo = (col: number) => term.write(`\x1b[${col}G`);
export const moveCursorBack = (cols: number) => term.write(`\x1b[${cols}D`);

export const writeLines = (num: number) =>
  Array(num)
    .fill(null)
    .forEach(() => term.writeln(''));

export const handleFileNotFound = (fileName: string) => {
  if (!fileName) {
    term.writeln(
      "Expected argument $fileName. Try 'help' for more information."
    );
  } else {
    term.writeln(`File ${fileName} not found.`);
  }
};

export const writeLoader = (ratio: number, suffix = '', offset = 0) => {
  const pips = 20;
  const progress = Math.ceil(ratio * pips);

  const loader =
    Array(progress).fill('=').join('') +
    Array(pips - progress)
      .fill('-')
      .join('');

  moveCursorTo(offset);

  term.write(loader);

  if (suffix) {
    term.write(' ');
    term.write(suffix);
  }
};

export const typewriteString = async (str: string, delay?: number) => {
  for (const char of str.split('')) {
    term.write(char);
    await waitFor(delay ? delay : 50);
  }
};

import './App.css';
import 'xterm/css/xterm.css';
import * as React from 'react';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';

const mp3 = require('./assets/t-rex-roar.mp3');

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

const term = new Terminal();
term.loadAddon(new WebLinksAddon());
const fitAddon = new FitAddon()
term.loadAddon(fitAddon)

const commandMap = {
  '': () => term.writeln(''),
  help: () => term.writeln('Help is coming. ' + (window.location.origin + mp3)),
  fallback: () => term.writeln('Unrecognized command. Try \'help\' for more information.')
}

let commandPrefix = 'redacted@redacted:~$ ';
const lines = [''];

const typewriteString = async (str) => {
  for (let char of str.split('')) {
    term.write(char);
    await waitFor(50)
  }
}

const handleCharacterKeystroke = (key, domEvent, hidden) => {
  if (key.charCodeAt(0) !== 27 && !domEvent.ctrlKey && !domEvent.altKey) { // Arrows and modifiers
    lines[lines.length - 1] = lines[lines.length - 1] + key;
    if (!hidden) term.write(key);
  }
}

let keystrokeHandler;

const enableKeyStrokes = () => {
  keystrokeHandler = term.onKey(({key, domEvent}) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) { // Enter
      const command = lines[lines.length - 1].trim();

      term.writeln('');

      if (command) {
        lines.push('');
      }

      if (commandMap[command]) {
        commandMap[command]()
      } else {
        commandMap.fallback()
      }

      term.write(commandPrefix);
    } else if (charCode === 127) { // Backspace
      if (!lines[lines.length - 1]) return;

      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      term.write('\x1b[1D');
      term.write(' ');
      term.write('\x1b[1D');
    } else {
      handleCharacterKeystroke(key, domEvent);
    }
  });
}

const disableKeyStrokes = () => {
  keystrokeHandler?.dispose();
}

const enableLoginKeyStrokes = () => {
  const handler = term.onKey(({key, domEvent}) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) { // Enter
      const command = lines[lines.length - 1].trim();

      if (!command) return;

      handler.dispose();

      commandPrefix = `${command}@redacted:~$ `

      term.writeln('');
      lines.push('');

      if (command === 'bypass') {
        enableKeyStrokes();
        return;
      }

      term.write('password: ');
      enablePasswordKeyStrokes();
    } else if (charCode === 127) { // Backspace
      if (!lines[lines.length - 1]) return;

      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
      term.write('\x1b[1D');
      term.write(' ');
      term.write('\x1b[1D');
    } else {
      handleCharacterKeystroke(key, domEvent);
    }
  });
}

const enablePasswordKeyStrokes = () => {
  const handler = term.onKey(async ({key, domEvent}) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) {
       const command = lines[lines.length - 1].trim();

      if (!command) return;

      handler.dispose();
      term.blur();

      lines.push('')

      term.writeln('');
      term.writeln('');

      for (let i = 0; i < 12; i++) {
        if (!i) {
          await typewriteString('Authenticating');
        } else {
          const dots = i % 4;

          term.write(`\x1b[0G`);
          term.write('Authenticating' + Array(dots).fill('.').join('') + Array(3 - dots).fill(' ').join(''));
        }

        await waitFor(200);
      }

      term.writeln('');
      term.writeln('');

      term.writeln('Authentication successful.');
      term.writeln('');

      await waitFor(500);

      runConnectionSequence();
    } else if (charCode === 127) { // Backspace
      if (!lines[lines.length - 1]) return;
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
    } else {
      handleCharacterKeystroke(key, domEvent, true);
    }
  });
}

let opened = false;

const runStartup = () => {
  term.writeln('\x1B[32m');

  term.write('login: ');
  term.focus();

  enableLoginKeyStrokes();
}

const runConnectionSequence = async () => {
    const rows = 12;
    const baseLength = rows * 2 - 1;
    const indent = '                  ';

    for (let i = 0; i <= 20; i++) {
      term.write(`\x1b[0G`);
      const loaderPrefix = 'Establishing secure connection... '
      const loader = `${Array(i).fill('=').join('')}${Array(20 - i).fill('-').join('')} ${i * 5}%`

      if (!i) {
        await typewriteString(loaderPrefix)
        term.write(loader);
      } else {
        term.write(loaderPrefix + loader);
      }

      await waitFor(500)
    }

    term.writeln('')
    term.writeln('')
    term.writeln('Connection secured.')
    term.writeln('');

    await waitFor(500)

    for (let row = 0; row < rows; row++) {
      const count = row * 2 + 1;
      const buffer = Array((baseLength - (count)) / 2).fill(' ').join('');
      term.writeln(indent + buffer + Array(count).fill('A').join('') + buffer)
      await waitFor(50)
    }

    await waitFor(500)

    term.writeln('');
    await typewriteString('Welcome Agent.');
    term.writeln('');

    await waitFor(500)

    term.writeln('')
    term.write(commandPrefix)

    term.focus();
    enableKeyStrokes();
}

function App() {
  const termRef = React.useRef(null)

  React.useEffect(() => {
    if (termRef.current && !opened) {
      term.open(termRef.current)
      fitAddon.fit();

      runStartup();

      opened = true;
    }
  })

  return (
    <div id="term" ref={termRef} style={{ height: '100vh' }}/>
  )
}

export default App;

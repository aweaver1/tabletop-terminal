import './App.css';
import 'xterm/css/xterm.css';
import * as React from 'react';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

const term = new Terminal();
term.loadAddon(new WebLinksAddon());
const fitAddon = new FitAddon()
term.loadAddon(fitAddon)

const commandMap = {
  help: () => term.writeln('Help is coming.'),
  fallback: () => term.writeln('Unrecognized command. Try \'help\' for more information.')
}

let commandPrefix = 'unknown@unknown:~$ ';
const lines = [''];

let keystrokeHandler;

const enableKeyStrokes = () => {
  keystrokeHandler = term.onKey(({key, ev}) => {
      if (key.charCodeAt(0) === 13) {
        const command = lines[lines.length - 1];

        term.writeln('');
        lines.push('')

        if (commandMap[command]) {
          commandMap[command]()
        } else {
          commandMap.fallback()
        }

        term.write(commandPrefix);
      } else {
        lines[lines.length - 1] = lines[lines.length - 1] + key;
        term.write(key);
      }
  });
}

const disableKeyStrokes = () => {
  keystrokeHandler?.dispose();
}

const enableLoginKeyStrokes = () => {
  const handler = term.onKey(({key, ev}) => {
      if (key.charCodeAt(0) === 13) {
        handler.dispose();

        const command = lines[lines.length - 1];
        commandPrefix = `${command}@unknown:~$ `

        term.writeln('');
        lines.push('');

        term.write('password: ');
        enablePasswordKeyStrokes();
      } else {
        lines[lines.length - 1] = lines[lines.length - 1] + key;
        term.write(key);
      }
  });
}

const enablePasswordKeyStrokes = () => {
  const handler = term.onKey(async ({key, ev}) => {
      if (key.charCodeAt(0) === 13) {
        handler.dispose();

        const command = lines[lines.length - 1];
        lines.push('')

        term.writeln('');
        term.writeln('');

        for (let i = 0; i < 12; i++) {
          term.write('Authenticating' + Array(i % 4).fill('.').join('') + '    ');
          term.write(`\x1b[0G`);
          await waitFor(200);
        }

        term.writeln('');
        term.writeln('');

        term.writeln('Authentication successful.');
        term.writeln('');

        await waitFor(500);

        runConnectionSequence();
      } else {
        lines[lines.length - 1] = lines[lines.length - 1] + key;
      }
  });
}

let opened = false;

const runStartup = () => {
  term.writeln('\x1B[32m');

  term.write('login: ')

  enableLoginKeyStrokes();
}

const runConnectionSequence = async () => {
    const rows = 12;
    const baseLength = rows * 2 - 1;
    const indent = '                  ';

    for (let i = 0; i <= 20; i++) {
      const loaderPrefix = 'Establishing secure connection... '
      const loader = `${Array(i).fill('=').join('')}${Array(20 - i).fill('-').join('')} ${i * 5}%`
      const str = loaderPrefix + loader;

      if (!i) {
        for (let char of loaderPrefix.split('')) {
          term.write(char);
          await waitFor(50)
        }
        term.write(loader);
      } else {
        term.write(str);
      }

      term.write(`\x1b[0G`);
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

    term.writeln('')
    term.writeln('Welcome Agent.')

    await waitFor(500)

    term.writeln('')
    term.write(commandPrefix)

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

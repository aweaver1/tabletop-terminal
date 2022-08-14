import './App.css';
import 'xterm/css/xterm.css';
import '98.css/dist/98.css';
import * as React from 'react';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

const term = new Terminal();
term.setOption('cursorStyle', 'underline')

term.loadAddon(new WebLinksAddon());

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

const credentialMap = {
  dweaver: 'vinegar'
}

const imageMap = {
  'react.png': require('./assets/react.png')
}

const audioMap = {
  't-rex-roar.mp3': require('./assets/t-rex-roar.mp3')
}

let commandMap = {};

const buildCommandMap = (setImageName, setWindowOpen) => ({
  '': {
    func: () => term.writeln(''),
  },
  help: {
    func: () => {
      term.writeln('    list: List all files in the current directory.');
      term.writeln('    view: View an image file in the current directory (e.g., view myimage.png).');
      term.writeln('    play: Play an audio file in the current directory (e.g., play myaudio.mp3).');
    }
  },
  list: {
    func: () => {
      [...Object.keys(imageMap), ...Object.keys(audioMap)].forEach((key) => term.writeln('    ' + key));
    }
  },
  view: {
    func: (fileName) => {
      if (!imageMap[fileName]) {
        if (!fileName) {
          term.writeln('Expected argument $fileName. Try \'help\' for more information.');
        } else {
          term.writeln(`Image file ${fileName} not found.`)
        }
        return;
      }
      disableKeyStrokes();
      setImageName(fileName);
      setWindowOpen(true);
    }
  },
  play: {
    func: (fileName) => {
      if (!audioMap[fileName]) {
        if (!fileName) {
          term.writeln('Expected argument $fileName. Try \'help\' for more information.');
        } else {
          term.writeln(`Audio file ${fileName} not found.`)
        }
        return;
      }
      new Audio(audioMap[fileName]).play();
    }
  },
  fallback: {
    func: () => term.writeln('Unrecognized command. Try \'help\' for more information.')
  }
})

let login = 'redacted';
let commandPrefix = 'redacted@redacted:~$ ';
const lines = [''];

const typewriteString = async (str, delay) => {
  for (let char of str.split('')) {
    term.write(char);
    await waitFor(delay ? delay : 50)
  }
}

const handleCharacterKeystroke = (key, domEvent, hidden) => {
  if (key.charCodeAt(0) !== 27 && !domEvent.ctrlKey && !domEvent.altKey) { // Arrows and modifiers
    lines[lines.length - 1] = lines[lines.length - 1] + key;
    if (!hidden) term.write(key);
  }
}

const enableLoginKeyStrokes = () => {
  term.write('login: ');

  const handler = term.onKey(({key, domEvent}) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) { // Enter
      const command = lines[lines.length - 1].trim();

      if (!command) return;

      handler.dispose();

      login = command;
      commandPrefix = `${command}@redacted:~$ `

      term.writeln('');
      lines.push('');

      if (command === 'bypass') {
        enableKeyStrokes();
        return;
      }

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
  let attempts = 2;
  term.write('password: ')

  const handler = term.onKey(async ({key, domEvent}) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) {
       const command = lines[lines.length - 1].trim();

      if (!command) return;

      if (command !== credentialMap[login]) {
        await waitFor(200);
        term.write(`\x1b[0G`);
        term.writeln(`Invalid credentials. ${attempts} attempts remaining.`);

        if (!attempts) {
          handler.dispose();
          await waitFor(1000);

          term.writeln('');
          await typewriteString('Unauthorized access detected.');
          term.writeln('');

          await waitFor(200);
          term.writeln('');

          await typewriteString('Initiating drone strike in: ');

          for (let i = 10; i >= 0; i--) {
            term.write(`\x1b[0G`);
            term.write(`Initiating drone strike in: ${i} `);
            await waitFor(1000);
          }

          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=+!@#$%^&*();:,<.>/?';
          let result = '';
          for (let i = 0; i < 5000; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          term.write(`\x1b[H`);
          await typewriteString(result, 1);

          await waitFor(1000);
          term.writeln('');
          term.writeln('');
          await typewriteString('Just kidding... ;)');
          await waitFor(3000);

          window.location.reload();
        } else {
          await waitFor(100);
          term.write('password: ');
          attempts--;
        }
        return;
      }

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

const disableKeyStrokes = () => {
  keystrokeHandler?.dispose();
}

let keystrokeHandler;

const enableKeyStrokes = () => {
  term.focus();
  keystrokeHandler = term.onKey(({key, domEvent}) => {
    const charCode = key.charCodeAt(0);

    if (charCode === 13) { // Enter
      const line = lines[lines.length - 1].trim();

      term.writeln('');

      if (line) {
        lines.push('');
      }

      const command = line.split(' ')[0];
      const args = line.split(' ').slice(1).filter(arg => !!arg);

      if (commandMap[command]) {
        commandMap[command].func(...args)
      } else {
        commandMap.fallback.func()
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

let opened = false;

const runStartup = () => {
  term.writeln('\x1B[32m');

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
  const [imageName, setImageName] = React.useState();
  const [windowOpen, setWindowOpen] = React.useState(false);

  React.useEffect(() => {
    if (termRef.current && !opened) {
      commandMap = buildCommandMap(setImageName, setWindowOpen);

      term.open(termRef.current)
      fitAddon.fit();

      runStartup();

      opened = true;
    }
  });

  return (
    <>
      <div id="term" ref={termRef} style={{ height: '100vh', minWidth: '600px' }} />
      {windowOpen &&
        <div className="window" style={{position: 'fixed', margin: '10% 20%', top: 0, left: 0, zIndex: 100}}>
          <div className="title-bar">
            <div className="title-bar-text">{imageName}</div>
            <div className="title-bar-controls">
              <button aria-label="Close" onClick={() => { setWindowOpen(false); enableKeyStrokes(); }} />
            </div>
          </div>
          <div className="window-body">
            <img src={imageMap[imageName]} />
          </div>
        </div>
      }
    </>
  )
}

export default App;

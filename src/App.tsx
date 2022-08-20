import * as React from 'react';
import Glitch from 'src/glitch/Glitch';
import Terminal from 'src/terminal/Terminal';
import Window from 'src/window/Window';
import { Image } from 'src/common/model';

const App: React.FunctionComponent = () => {
  const [glitchEnabled, setGlitchEnabled] = React.useState<boolean>(false);
  const [pauseKeystrokes, setPauseKeystrokes] = React.useState<boolean>(false);
  const [image, setImage] = React.useState<Image | null>(null);

  return (
    <Glitch enabled={glitchEnabled}>
      <Terminal
        pauseKeystrokes={pauseKeystrokes}
        onUnauthorizedAccess={() => setGlitchEnabled(true)}
        onOpenImage={(image) => {
          setImage(image);
          setPauseKeystrokes(true);
        }}
      />
      {image && (
        <Window
          title={image.name}
          onClose={() => {
            setImage(null);
            setPauseKeystrokes(false);
          }}
        >
          <img src={image.src} />
        </Window>
      )}
    </Glitch>
  );
};

export default App;

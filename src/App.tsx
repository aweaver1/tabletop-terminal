import * as React from 'react';
import Terminal from 'src/terminal/Terminal';
import Window from 'src/window/Window';
import { Image } from 'src/common/model';

const App: React.FunctionComponent = () => {
  const [pauseKeystrokes, setPauseKeystrokes] = React.useState<boolean>(false);
  const [image, setImage] = React.useState<Image | null>(null);

  return (
    <>
      <Terminal
        pauseKeystrokes={pauseKeystrokes}
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
    </>
  );
};

export default App;

import * as React from 'react';
import Glitch from 'src/glitch/Glitch';
import Terminal from 'src/terminal/Terminal';
import Window from 'src/window/Window';
import { Image } from 'src/common/model';

const App: React.FunctionComponent = () => {
  const [glitchEnabled, setGlitchEnabled] = React.useState<boolean>(false);
  const [pauseKeystrokes, setPauseKeystrokes] = React.useState<boolean>(false);
  const [images, setImages] = React.useState<Image[]>([]);

  return (
    <Glitch enabled={glitchEnabled}>
      <Terminal
        pauseKeystrokes={pauseKeystrokes}
        onUnauthorizedAccess={() => setGlitchEnabled(true)}
        onOpenImage={(newImage) => {
          setImages((prev) =>
            prev.find((existingImage) => existingImage.name === newImage.name)
              ? [...prev]
              : [...prev, newImage]
          );
        }}
      />
      <>
        {images.map(
          (image, index): React.ReactElement => (
            <Window
              key={image.name}
              title={image.name}
              onClose={() => {
                setImages((prev) => prev.filter((item, i) => i !== index));
              }}
            >
              <img
                src={image.src}
                style={{ maxHeight: '300px', maxWidth: '300px' }}
              />
            </Window>
          )
        )}
      </>
    </Glitch>
  );
};

export default App;

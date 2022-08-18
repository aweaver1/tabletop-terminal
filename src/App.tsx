import * as React from 'react';
import Terminal from 'src/terminal/Terminal';
import Window from 'src/window/Window';

const App: React.FunctionComponent = () => {
  const [pauseKeystrokes, setPauseKeystrokes] = React.useState<boolean>(false);
  const [imageName, setImageName] = React.useState<string | null>(null);
  const [image, setImage] = React.useState<string | null>(null);

  return (
    <>
      <Terminal
        pauseKeystrokes={pauseKeystrokes}
        onOpenImage={(imageName, image) => {
          setImageName(imageName);
          setImage(image);
          setPauseKeystrokes(true);
        }}
      />
      {imageName && image && (
        <Window
          title={imageName}
          onClose={() => {
            setImageName(null);
            setPauseKeystrokes(false);
          }}
        >
          <img src={image} />
        </Window>
      )}
    </>
  );
};

export default App;

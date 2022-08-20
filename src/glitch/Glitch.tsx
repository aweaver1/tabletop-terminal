import * as React from 'react';
import 'src/glitch/Glitch.css';

export type GlitchProps = {
  enabled: boolean;
  children: (React.ReactElement | null)[];
};

const Glitch: React.FunctionComponent<GlitchProps> = (props) => {
  const { enabled, children } = props;

  return <div className={enabled ? 'glitch' : ''}>{children}</div>;
};

export default Glitch;

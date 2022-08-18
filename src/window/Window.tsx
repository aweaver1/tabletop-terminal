import * as React from 'react';
import '98.css/dist/98.css';

export type WindowProps = {
  title: string;
  onClose: () => void;
  children: React.ReactElement;
};

const Window: React.FunctionComponent<WindowProps> = (props) => {
  const { title, onClose, children } = props;

  return (
    <div
      className="window"
      style={{
        position: 'fixed',
        margin: '10% 20%',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
          <button aria-label="Close" onClick={onClose} />
        </div>
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
};

export default Window;

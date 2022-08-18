export type Image = {
  name: string;
  src: string;
};

export type Command = {
  func: (...args: string[]) => void;
  description?: string;
};

export type CommandMap = {
  [commandName: string]: Command;
};

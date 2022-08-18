export const waitFor = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export const secondsToTimestamp = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor((totalSeconds % 3600) % 60);

  const hoursString = hours > 9 ? hours : `0${hours}`;
  const minutesString = minutes > 9 ? minutes : `0${minutes}`;
  const secondsString = seconds > 9 ? seconds : `0${seconds}`;

  const minutesSecondsString = `${minutesString}:${secondsString}`;

  return hours
    ? `${hoursString}:${minutesSecondsString}`
    : minutesSecondsString;
};

export const formatKeys = (keys) => {
  if (!Array.isArray(keys)) return '';

  return keys
    .map((key) => {
      return key
        .replace('Key', '')
        .replace('Left', '')
        .replace('Right', '')
        .replace('Control', 'Ctrl')
        .replace('Meta', 'Cmd');
    })
    .join('+');
};

export const validateShortcutName = (name) => {
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return 'Name cannot be empty';
  }

  if (trimmedName.length > 50) {
    return 'Name must be 50 characters or less';
  }

  if (trimmedName.length < 2) {
    return 'Name must be at least 2 characters';
  }

  // Allow letters, numbers, spaces, hyphens, underscores, and common symbols
  if (!/^[a-zA-Z0-9\s\-_+()[\]{}.,;:!?'"]*$/.test(trimmedName)) {
    return 'Name contains invalid characters';
  }

  // Check for reserved names that might conflict with system shortcuts
  const reservedNames = [
    'undefined',
    'null',
    'true',
    'false',
    'system',
    'default',
    'admin',
    'root',
  ];

  if (reservedNames.includes(trimmedName.toLowerCase())) {
    return 'This name is reserved and cannot be used';
  }

  return null; // Valid
};

export const validateKeyCombo = (keys) => {
  if (!Array.isArray(keys)) {
    return 'Invalid key combination format';
  }

  if (keys.length === 0) {
    return 'At least one key is required';
  }

  if (keys.length > 5) {
    return 'Too many keys in combination (maximum 5)';
  }

  // Check for duplicate keys
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size !== keys.length) {
    return 'Duplicate keys in combination';
  }

  // Check for invalid single-key shortcuts (must have modifier)
  const modifierKeys = [
    'ControlLeft',
    'ControlRight',
    'ShiftLeft',
    'ShiftRight',
    'AltLeft',
    'AltRight',
    'MetaLeft',
    'MetaRight',
  ];
  const hasModifier = keys.some((key) => modifierKeys.includes(key));

  if (keys.length === 1 && !hasModifier) {
    const singleKey = keys[0];
    // Allow function keys and special keys without modifiers
    if (
      !singleKey.startsWith('F') &&
      !['Escape', 'Delete', 'Backspace', 'Tab', 'Enter', 'Space'].includes(singleKey) &&
      !singleKey.startsWith('Arrow') &&
      !singleKey.startsWith('Numpad')
    ) {
      return 'Single keys require a modifier (Ctrl, Shift, Alt, or Cmd)';
    }
  }

  // Check for problematic combinations
  const problematicCombos = [
    ['AltLeft', 'F4'], // System close
    ['ControlLeft', 'AltLeft', 'Delete'], // System task manager
    ['MetaLeft', 'KeyL'], // System lock (Windows/Mac)
  ];

  const currentCombo = [...keys].sort();
  for (const problemCombo of problematicCombos) {
    if (JSON.stringify(currentCombo) === JSON.stringify(problemCombo.sort())) {
      return 'This key combination is reserved by the system';
    }
  }

  return null; // Valid
};

export const validateUniqueShortcut = (name, keys, existingShortcuts) => {
  if (!existingShortcuts || !Array.isArray(existingShortcuts)) {
    return null;
  }

  // Check for duplicate name (case-insensitive)
  const nameExists = existingShortcuts.some(
    (s) => s.name && s.name.toLowerCase() === name.toLowerCase()
  );

  if (nameExists) {
    return `A shortcut named "${name}" already exists`;
  }

  // Check for duplicate key combination
  const keysString = JSON.stringify([...keys].sort());
  const keyComboExists = existingShortcuts.find(
    (s) => s.value && JSON.stringify([...s.value].sort()) === keysString
  );

  if (keyComboExists) {
    return `These keys are already assigned to "${keyComboExists.name}"`;
  }

  return null; // Valid
};

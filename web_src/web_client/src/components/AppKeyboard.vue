<template>
  <div class="keyboardContainer">
    <div ref="keyboardMainRef" class="simple-keyboard-main"></div>

    <div class="controlArrows">
      <div ref="keyboardControlRef" class="simple-keyboard-control"></div>
      <div ref="keyboardArrowsRef" class="simple-keyboard-arrows"></div>
    </div>

    <div class="numPad">
      <div ref="keyboardNumpadRef" class="simple-keyboard-numpad"></div>
      <div ref="keyboardNumpadEndRef" class="simple-keyboard-numpadEnd"></div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useDevice } from '@/composables/useDevice';
  import Keyboard from 'simple-keyboard';
  import 'simple-keyboard/build/css/index.css';

  const { device } = useDevice();

  const props = defineProps({
    input: String,
  });

  const emit = defineEmits(['onChange', 'onKeyPress', 'onKeyReleased']);

  // Template refs for keyboard containers
  const keyboardMainRef = ref(null);
  const keyboardControlRef = ref(null);
  const keyboardArrowsRef = ref(null);
  const keyboardNumpadRef = ref(null);
  const keyboardNumpadEndRef = ref(null);

  // Keyboard instances
  const keyboard = ref(null);
  const keyboardControlPad = ref(null);
  const keyboardArrows = ref(null);
  const keyboardNumPad = ref(null);
  const keyboardNumPadEnd = ref(null);

  const keyStates = reactive({
    '{shift}': false,
    '{shiftleft}': false,
    '{shiftright}': false,
    '{controlleft}': false,
    '{controlright}': false,
    '{altleft}': false,
    '{altright}': false,
    '{metaleft}': false,
    '{metaright}': false,
  });

  onMounted(() => {
    let commonKeyboardOptions = {
      onChange: (input) => onChange(input),
      onKeyPress: (button) => onKeyPress(button, event),
      onKeyReleased: (button) => onKeyReleased(button, event),
      theme: 'simple-keyboard hg-theme-default hg-layout-default myTheme1',
      physicalKeyboardHighlight: true,
      physicalKeyboardHighlightPress: true,
      syncInstanceInputs: true,
      mergeDisplay: true,
      //   debug: true,
    };

    const keyboard = new Keyboard('.simple-keyboard-main', {
      ...commonKeyboardOptions,
      /**
       * Layout by:
       * Sterling Butters (https://github.com/SterlingButters)
       */
      layout: {
        default: [
          '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
          '` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
          '{tab} q w e r t y u i o p [ ] \\',
          "{capslock} a s d f g h j k l ; ' {enter}",
          '{shiftleft} z x c v b n m , . / {shiftright}',
          '{controlleft} {altleft} {metaleft} {space} {metaright} {altright}',
        ],
        shift: [
          '{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}',
          '~ ! @ # $ % ^ & * ( ) _ + {backspace}',
          '{tab} Q W E R T Y U I O P { } |',
          '{capslock} A S D F G H J K L : " {enter}',
          '{shiftleft} Z X C V B N M < > ? {shiftright}',
          '{controlleft} {altleft} {metaleft} {space} {metaright} {altright}',
        ],
      },
      display: {
        '{escape}': 'Esc',
        '{tab}': 'Tab',
        '{backspace}': 'Backspace',
        '{enter}': 'Enter',
        '{capslock}': 'Caps lock',
        '{shiftleft}': 'Shift',
        '{shiftright}': 'Shift',
        '{controlleft}': 'Ctrl',
        '{controlright}': 'Ctrl',
        '{altleft}': 'Alt',
        '{altright}': 'Alt',
        '{metaleft}': 'Cmd',
        '{metaright}': 'Cmd',
        '{f1}': 'F1',
        '{f2}': 'F2',
        '{f3}': 'F3',
        '{f4}': 'F4',
        '{f5}': 'F5',
        '{f6}': 'F6',
        '{f7}': 'F7',
        '{f8}': 'F8',
        '{f9}': 'F9',
        '{f10}': 'F10',
        '{f11}': 'F11',
        '{f12}': 'F12',
      },
    });

    const keyboardControlPad = new Keyboard('.simple-keyboard-control', {
      ...commonKeyboardOptions,
      layout: {
        default: [
          '{prtscr} {scrolllock} {pause}',
          '{insert} {home} {pageup}',
          '{delete} {end} {pagedown}',
        ],
      },
    });

    const keyboardArrows = new Keyboard('.simple-keyboard-arrows', {
      ...commonKeyboardOptions,
      layout: {
        default: ['{arrowup}', '{arrowleft} {arrowdown} {arrowright}'],
      },
    });

    const keyboardNumPad = new Keyboard('.simple-keyboard-numpad', {
      ...commonKeyboardOptions,
      layout: {
        default: [
          '{numlock} {numpaddivide} {numpadmultiply}',
          '{numpad7} {numpad8} {numpad9}',
          '{numpad4} {numpad5} {numpad6}',
          '{numpad1} {numpad2} {numpad3}',
          '{numpad0} {numpaddecimal}',
        ],
      },
    });

    const keyboardNumPadEnd = new Keyboard('.simple-keyboard-numpadEnd', {
      ...commonKeyboardOptions,
      layout: {
        default: ['{numpadsubtract}', '{numpadadd}', '{numpadenter}'],
      },
    });

    const onChange = (input) => {
      // console.log("onchage:",input);
      // emit("onChange", input);
    };

    const onKeyPress = (button, event) => {
      let isModifier = ['{shift}', '{shiftleft}', '{shiftright}'].includes(button);
      let isCapsLock = button === '{capslock}';
      let isSpecialKey = [
        '{controlleft}',
        '{controlright}',
        '{altleft}',
        '{altright}',
        '{metaleft}',
        '{metaright}',
      ].includes(button);

      if (isModifier) {
        handleShift();
        toggleKeyState(button, event);
      } else if (isCapsLock) {
        handleShift();
        emit('onKeyPress', button);
      } else if (isSpecialKey) {
        if (!keyStates[button]) {
          emit('onKeyPress', button);
        }
        toggleKeyState(button, event);
      } else {
        emit('onKeyPress', button);
        resetKeyStyles();
      }

      updateKeyStyle(event.target, keyStates[button]);
    };

    const toggleKeyState = (button, event) => {
      keyStates[button] = !keyStates[button];
      device.value.hid.keyboard.pressedKeys[button] = event;
      emit('onKeyPress', button);
    };

    const resetKeyStyles = () => {
      for (let key in keyStates) {
        if (keyStates[key]) {
          const keyElement = keyboardMainRef.value?.querySelector(`[data-key="${key}"]`);
          if (keyElement) {
            keyElement.style.backgroundColor = '';
          }
        }
      }
    };

    const updateKeyStyle = (target, isActive) => {
      if (target) {
        target.style.backgroundColor = isActive ? '#b0b0b0' : '';
      }
    };

    /*
  const onKeyReleased = (button) => {
    //  console.log(button);
    emit("onKeyReleased", button);

    if (
      button === "{shift}" ||
      button === "{shiftleft}" ||
      button === "{shiftright}"
    )
      handleShift();
  };
*/

    const onKeyReleased = (button, event) => {
      const modifierKeys = [
        '{shift}',
        '{shiftleft}',
        '{shiftright}',
        '{controlleft}',
        '{controlright}',
        '{altleft}',
        '{altright}',
        '{metaleft}',
        '{metaright}',
      ];

      if (modifierKeys.includes(button)) {
        if (!keyStates[button]) {
          emit('onKeyReleased', button);
        }
      } else {
        emit('onKeyReleased', button);
        releaseActiveKeys();
      }
    };

    const releaseActiveKeys = () => {
      for (let key in keyStates) {
        if (keyStates[key]) {
          emit('onKeyReleased', key);
          keyStates[key] = false;

          if (['{shift}', '{shiftleft}', '{shiftright}'].includes(key)) {
            handleShift();
          }

          if (pressedKeys[key]) {
            pressedKeys[key].target.style.backgroundColor = '';
            delete pressedKeys[key];
          }
        }
      }
    };

    const handleShift = () => {
      let currentLayout = keyboard.options.layoutName;
      let shiftToggle = currentLayout === 'default' ? 'shift' : 'default';
      keyboard.setOptions({
        layoutName: shiftToggle,
      });
    };

    watch(
      () => props.input,
      (newInput) => {
        if (keyboard.value) {
          keyboard.value.setInput(newInput);
        }
      }
    );
  });
</script>

<style>
  /*
    Theme: myTheme1
  */
  .simple-keyboard.myTheme1 {
    background-color: transparent;
    border-radius: 0;
    border-bottom-right-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .simple-keyboard.myTheme1 .hg-button {
    /*   height: 50px; */
    height: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #473737;
    /*  color: white; */
    color: rgb(231, 124, 124);
  }

  .hg-theme-default .hg-button {
    /* key color */
    /* nothing = white */
    border-top: 1px solid rgb(241, 60, 60);
    border-bottom: 1px solid rgb(241, 60, 60);
    border-left: 1px solid rgb(241, 60, 60);
    border-right: 1px solid rgb(241, 60, 60);
  }

  .simple-keyboard.myTheme1 .hg-button:active {
    /* active keypress */
    background-color: #473737;
    color: rgb(255, 255, 255);
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    border-left: 1px solid black;
    border-right: 1px solid black;
  }

  #root .simple-keyboard.myTheme1 + .simple-keyboard-preview {
    background: #1c4995;
  }

  /* .simple-keyboard-arrows */
  .simple-keyboard-arrows.simple-keyboard {
    background-color: transparent;
  }

  .simple-keyboard-arrows .hg-row {
    justify-content: center;
  }

  .simple-keyboard-arrows .hg-button {
    width: 50px;
    flex-grow: 0;
    justify-content: center;
    display: flex;
    align-items: center;
  }

  .controlArrows {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-flow: column;
  }

  /* arrows end */
  .simple-keyboard-control.simple-keyboard {
    background-color: transparent;
  }

  .simple-keyboard-control.simple-keyboard .hg-row:first-child {
    margin-bottom: 5px;
  }

  .simple-keyboard-control .hg-button {
    width: 50px;
    flex-grow: 0;
    justify-content: center;
    display: flex;
    align-items: center;
  }

  .numPad {
    display: flex;
    align-items: flex-end;
  }

  .simple-keyboard-numpad.simple-keyboard {
    background-color: transparent;
  }

  .simple-keyboard-numpad.simple-keyboard {
    width: 160px;
  }

  .simple-keyboard-numpad.simple-keyboard .hg-button {
    width: 50px;
    justify-content: center;
    display: flex;
    align-items: center;
  }

  .simple-keyboard-numpadEnd.simple-keyboard {
    width: 50px;
    background: transparent;
    margin: 0;
    padding: 5px 5px 5px 0;
  }

  .simple-keyboard-numpadEnd.simple-keyboard .hg-button {
    align-items: center;
    justify-content: center;
    display: flex;
  }

  .simple-keyboard-numpadEnd .hg-button.hg-standardBtn.hg-button-plus {
    height: 85px;
  }

  .simple-keyboard-numpadEnd.simple-keyboard .hg-button.hg-button-enter {
    height: 85px;
  }

  .simple-keyboard.hg-theme-default .hg-button.hg-selectedButton {
    background: rgba(5, 25, 70, 0.53);
    color: rgb(0, 255, 149);
  }

  .hg-button.hg-functionBtn.hg-button-space {
    width: 350px;
  }
</style>

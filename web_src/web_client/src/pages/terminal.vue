<!--
****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
****************************************************************************
-->

<template>
    <ToolBar />
    <div>
        <div class="ssh-container" ref="terminal"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { debounce } from 'lodash';
import Config from '@/config.js';

const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';

const packStdin = data => JSON.stringify({ Op: 'stdin', Data: data });
const packResize = (cols, rows) => JSON.stringify({ Op: 'resize', Cols: cols, Rows: rows });

const initText = ref('connecting...\r\n');
const first = ref(true);
const term = ref(null);
const fitAddon = ref(null);
const ws = ref(null);
const terminal = ref(null);
const token = localStorage.getItem('token');

const socketUrl = `${wsProtocol}://${Config.host_ip}:${Config.host_port}/ssh?token=${token}`;
const option = {
    lineHeight: 1.0,
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 18,
    fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
    theme: {
        background: '#181d28'
    },
    cols: 30
}

const isWsOpen = () => ws.value && ws.value.readyState === 1;

const initTerm = () => {
    term.value = new Terminal(option);
    fitAddon.value = new FitAddon();
    term.value.loadAddon(fitAddon.value);
    term.value.open(terminal.value);

    setTimeout(() => {
        fitAddon.value.fit();
    }, 500);
}

const onTerminalKeyPress = () => {
    term.value.onData(data => {
        isWsOpen() && ws.value.send(packStdin(data));
    });
}

const resizeRemoteTerminal = () => {
    const { cols, rows } = term.value;
    isWsOpen() && ws.value.send(packResize(cols, rows));
}

const onResize = debounce(() => {
    fitAddon.value.fit();
}, 500);

const onTerminalResize = () => {
    window.addEventListener('resize', onResize);
    term.value.onResize(resizeRemoteTerminal);
}

const removeResizeListener = () => {
    window.removeEventListener('resize', onResize);
}

const initSocket = () => {
    term.value.write(initText.value)
    ws.value = new WebSocket(socketUrl, ['OK'])
    onOpenSocket();
    onCloseSocket();
    onErrorSocket();
    onMessageSocket();
}

const onOpenSocket = () => {
    ws.value.onopen = () => {
        term.value.reset();
        setTimeout(() => {
            resizeRemoteTerminal()
        }, 500);
    }
}

const onCloseSocket = () => {
    ws.value.onclose = () => {
        term.value.write("Connection failed, Please check your account and password information, then you can refresh and try again.\r\n");
        // setTimeout(() => {
        //     initSocket();
        // }, 3000);
    }
}

const onErrorSocket = () => {
    ws.value.onerror = () => {
        alert('websocket connection failed, please refresh.');
    }
}

const onMessageSocket = () => {
    ws.value.onmessage = res => {
        const data = res.data;
        if (first.value) {
            first.value = false;
            term.value.reset();
            term.value.element && term.value.focus();
            resizeRemoteTerminal();
        }
        term.value.write(data);
    }
}

onMounted(() => {
    initTerm();
    initSocket();
    onTerminalResize();
    onTerminalKeyPress();
})

onBeforeUnmount(() => {
    removeResizeListener();
    if (ws.value) {
      ws.value.close();
    }
})
</script>

<style lang="scss">
body {
    margin: 0;
    padding: 0;
}

.ssh-container {
    overflow: hidden;
    height: 100vh;
    border-radius: 4px;
    background: rgb(24, 29, 40);
    padding: 0px;
    color: rgb(255, 255, 255);

    .xterm-scroll-area::-webkit-scrollbar-thumb {
        background-color: #b7c4d1;
    }
}
</style>
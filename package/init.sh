#!/bin/bash
set -euo pipefail

# defaults
HTTPPORT=${HTTPPORT:-8080}
HTTPSPORT=${HTTPSPORT:-4430}
NOSSL=${NOSSL:-}

[[ -d /dev/shm/blikvm ]] || mkdir -p /dev/shm/blikvm
[[ -f /dev/shm/blikvm/atx ]] || touch /dev/shm/blikvm/atx

if [[ ! -d /sys/class/udc ]] || [[ -z "$(ls -A /sys/class/udc 2>/dev/null || true)" ]]; then
  echo "[init] Error: /sys/class/udc not present or empty." >&2
  exit 1
fi

cd /mnt/exec/release

CONFIG_DIR="/mnt/exec/release/config"
CONFIG_FILE="$CONFIG_DIR/app.json"

# minimal app.json on first boot; server will auto-complete missing fields
if [[ ! -f "$CONFIG_FILE" ]]; then
  mkdir -p "$CONFIG_DIR"
  if [[ "${NOSSL}" == "1" ]]; then PROTOCOL="http"; else PROTOCOL="https"; fi
  cat > "$CONFIG_FILE" <<EOF
{
  "log": {
    "console": { "enabled": true, "level": "info" },
    "file": { "enabled": true, "level": "trace", "fileName": "/mnt/tmp/logs/app.log", "flags": "a", "maxLogSize": 30, "backups": 3 }
  },
  "server": {
    "protocol": "${PROTOCOL}",
    "https_port": ${HTTPSPORT},
    "http_port": ${HTTPPORT},
    "ssl": { "key": "./lib/https/key.pem", "cert": "./lib/https/cert.pem" },
    "rootPath": "/mnt/blikvm/web_src/web_server",
    "configPath": "/usr/bin/blikvm/package.json",
    "sshUser": "root",
    "sshPassword": "1234",
    "auth": true,
    "authExpiration": 12,
    "mdnsEnabled": true
  }
}
EOF
  echo "[init] Wrote minimal config: protocol=${PROTOCOL} https=${HTTPSPORT} http=${HTTPPORT}"
fi
if command -v jq >/dev/null 2>&1; then
  TMP_JSON=$(mktemp)
  if [[ "${NOSSL}" == "1" ]]; then
    jq --argjson http_port "$HTTPPORT" \
       '.server.protocol="http" | .server.http_port=$http_port' \
       "$CONFIG_FILE" > "$TMP_JSON"
  else
    jq --argjson https_port "$HTTPSPORT" --argjson http_port "$HTTPPORT" \
       '.server.protocol="https" | .server.https_port=$https_port | .server.http_port=$http_port' \
       "$CONFIG_FILE" > "$TMP_JSON"
  fi
  mv "$TMP_JSON" "$CONFIG_FILE"
else
  echo "[init] Warning: jq not found; skip env overrides." >&2
fi

while ./server_app; [[ $? -eq 0 ]]; do
  echo "[init] server_app exited 0; restarting in 1s..."
  sleep 1
done

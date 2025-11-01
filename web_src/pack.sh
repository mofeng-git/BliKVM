#!/usr/bin/env bash
set -Eeuo pipefail
set -x

usage() {
  echo "Usage: web_src/pack.sh [pi|allwinner]" >&2
}

HW_ARG="${1:-}"   # optional: pi / allwinner

case "$HW_ARG" in
  pi|allwinner)
    echo "Using hardware type group: $HW_ARG"
    # Only set HARDWARE_TYPE if not provided by environment
    if [[ -z "${HARDWARE_TYPE:-}" ]]; then
      export HARDWARE_TYPE="$HW_ARG"
    else
      echo "HARDWARE_TYPE already set to: $HARDWARE_TYPE"
    fi
    ;;
  "" )
    echo "Hardware type not specified; using defaults"
    ;;
  -h|--help)
    usage; exit 0 ;;
  * )
    echo "Unknown hardware type: $HW_ARG (only: pi | allwinner)"; exit 1
    ;;
esac

# build client
echo "build client"
cd web_client
npm install
npm run build
cp -r dist ../web_server
cd ..

# build server
echo "build server"
cd web_server
npm install
# If HARDWARE_TYPE exported, cross-env in npm script will receive it
npm run build

#!/usr/bin/env bash

# Strict mode + safe IFS
set -Eeuo pipefail
IFS=$'\n\t'

#
# BliKVM deb packer
# - Standardized script style
# - Auto-detect architecture (amd64/arm64/armhf)
# - Support hardware types (pi / allwinner)
# - No writes to system paths; build root tree in staging dir
#

usage() {
  cat >&2 <<'USAGE'
Usage: script/packdeb.sh <hardware_type>

Args:
  hardware_type   pi | allwinner

Optional env vars:
  DEB_ARCH       Target arch (amd64|arm64|armhf); auto-detected by default
  OUT_DIR        Output directory; defaults to repo root

Examples:
  script/packdeb.sh pi
  DEB_ARCH=armhf script/packdeb.sh allwinner
USAGE
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" || -z ${1:-} ]]; then
  usage
  [[ -z ${1:-} ]] && exit 1 || exit 0
fi

HARDWARE_TYPE="$1"

case "$HARDWARE_TYPE" in
  pi)        PKG_PREFIX="v1-v2-v3" ;;
  allwinner) PKG_PREFIX="v4" ;;
  *) echo "ERROR: Unsupported hardware type: $HARDWARE_TYPE (only: pi | allwinner)" >&2; exit 2 ;;
esac

# Detect repo root from this script's location
REPO_ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
WEB_SRC_DIR="$REPO_ROOT/web_src"
SERVICE_FILE="$REPO_ROOT/package/kvmd-web/kvmd-web.service"
START_SH="$REPO_ROOT/package/kvmd-web/start.sh"
INIT_SH="$REPO_ROOT/package/init.sh"
PKG_JSON_SRC="$REPO_ROOT/script/package.json"

[[ -f "$PKG_JSON_SRC" ]] || { echo "ERROR: Version file not found: $PKG_JSON_SRC" >&2; exit 3; }
[[ -f "$SERVICE_FILE" ]] || { echo "ERROR: systemd service not found: $SERVICE_FILE" >&2; exit 3; }
[[ -f "$START_SH" ]] || { echo "ERROR: start script not found: $START_SH" >&2; exit 3; }

# Build web artifacts
(
  cd "$WEB_SRC_DIR"
  bash pack.sh "$HARDWARE_TYPE"
)

# Read version from script/package.json
if command -v jq >/dev/null 2>&1; then
  VERSION=$(jq -r '.version' "$PKG_JSON_SRC")
else
  VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' "$PKG_JSON_SRC" | head -n1)
fi

if [[ -z "${VERSION:-}" || "$VERSION" == "null" ]]; then
  echo "ERROR: Failed to parse version from: $PKG_JSON_SRC" >&2
  exit 4
fi
echo "Using version(raw): $VERSION"

# Debian: version must start with a digit (strip leading 'v')
VERSION_DEB=$(printf '%s' "$VERSION" | sed -E 's/^[^0-9]*([0-9].*)$/\1/')
if ! [[ "$VERSION_DEB" =~ ^[0-9] ]]; then
  echo "ERROR: Invalid deb version: $VERSION_DEB" >&2
  exit 5
fi
echo "Using version(deb): $VERSION_DEB"

# Determine architecture (allow override via DEB_ARCH)
detect_arch() {
  if [[ -n "${DEB_ARCH:-}" ]]; then
    echo "$DEB_ARCH"
    return
  fi
  if command -v dpkg >/dev/null 2>&1; then
    dpkg --print-architecture
    return
  fi
  # Fallback to uname mapping
  local um; um=$(uname -m)
  case "$um" in
    x86_64) echo amd64 ;;
    aarch64) echo arm64 ;;
    armv7l|armv6l) echo armhf ;;
    *) echo "$um" ;;
  esac
}

DEB_ARCH=$(detect_arch)
case "$DEB_ARCH" in
  amd64|arm64|armhf) : ;;
  *) echo "WARNING: Unknown arch '$DEB_ARCH'; writing control anyway." >&2 ;;
esac
echo "Packaging for arch: $DEB_ARCH"

# Prepare staging directory
STAGE_DIR="blikvm-$PKG_PREFIX"
OUT_DIR="${OUT_DIR:-$REPO_ROOT}"

rm -rf "$STAGE_DIR" "$OUT_DIR/"blikvm-"$PKG_PREFIX"*.deb 2>/dev/null || true
mkdir -p "$STAGE_DIR/DEBIAN" \
         "$STAGE_DIR/usr/bin/blikvm" \
         "$STAGE_DIR/lib/systemd/system" \
         "$STAGE_DIR/mnt/exec"

# Copy payload into staging tree (no writes to system paths)
install -m 0644 "$PKG_JSON_SRC" "$STAGE_DIR/usr/bin/blikvm/package.json"
install -m 0755 "$START_SH" "$STAGE_DIR/usr/bin/blikvm/start.sh"
install -m 0755 "$INIT_SH" "$STAGE_DIR/usr/bin/blikvm/init.sh"

# Web server release -> /mnt/exec/release
if [[ -d "$REPO_ROOT/web_src/web_server/release" ]]; then
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude 'config/*' "$REPO_ROOT/web_src/web_server/release" "$STAGE_DIR/mnt/exec/"
  else
    # rsync not available; fallback to cp (does not exclude config)
    cp -a "$REPO_ROOT/web_src/web_server/release" "$STAGE_DIR/mnt/exec/"
  fi
else
  echo "WARNING: web_server/release not found; package content may be incomplete" >&2
fi

# systemd unit
install -m 0644 "$SERVICE_FILE" "$STAGE_DIR/lib/systemd/system/kvmd-web.service"

# Create control file
cat > "$STAGE_DIR/DEBIAN/control" <<EOF
Package: blikvm
Version: $VERSION_DEB
Architecture: $DEB_ARCH
Maintainer: info@blicube.com
Depends: libconfig-dev, jq, libxkbcommon0, libgpiod-dev
Description: Installs blikvm-$VERSION_DEB-alpha on the BliKVM
EOF

# preinst: stop service and ensure libxkbcommon.so symlink on target (arch-aware)
cat > "$STAGE_DIR/DEBIAN/preinst" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

systemctl stop kvmd-web || true

triplet_by_arch() {
  local a
  if command -v dpkg >/dev/null 2>&1; then a=$(dpkg --print-architecture); else a=""; fi
  case "${a:-$(uname -m)}" in
    amd64|x86_64) echo x86_64-linux-gnu ;;
    arm64|aarch64) echo aarch64-linux-gnu ;;
    armhf|armv7l|armv6l) echo arm-linux-gnueabihf ;;
    *) echo "" ;;
  esac
}

TRIPLET=$(triplet_by_arch)
if [[ -n "$TRIPLET" ]]; then
  LIBDIR="/lib/$TRIPLET"
  if [[ -d "$LIBDIR" ]]; then
    if [[ ! -f "$LIBDIR/libxkbcommon.so" && -f "$LIBDIR/libxkbcommon.so.0" ]]; then
      ln -sfn "$LIBDIR/libxkbcommon.so.0" "$LIBDIR/libxkbcommon.so" || true
    fi
  fi
fi
EOF

# postinst: enable service and board-specific tweak
cat > "$STAGE_DIR/DEBIAN/postinst" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Define board type names
pi4b_board="Raspberry Pi 4 Model B"
cm4b_board="Raspberry Pi Compute Module 4"
h313_board="MangoPi Mcore"

get_board_type() {
  local model
  if [[ -r /proc/device-tree/model ]]; then
    model=$(tr -d '\0' < /proc/device-tree/model)
  else
    model=""
  fi
  case "$model" in
    *"$pi4b_board"*) echo "$pi4b_board" ;;
    *"$cm4b_board"*) echo "$cm4b_board" ;;
    *"$h313_board"*) echo "$h313_board" ;;
    *) echo "" ;;
  esac
}

board_type=$(get_board_type)
echo "Board type: $board_type"
if [[ "$board_type" == "$cm4b_board" ]]; then
  CONFIG_FILE="/mnt/exec/release/lib/pi/janus_configs/janus.plugin.ustreamer.jcfg"
  if [[ -f "$CONFIG_FILE" ]]; then
    sed -i 's/device = "hw:1,0"/device = "hw:0,0"/g' "$CONFIG_FILE" || true
  fi
fi

chmod 0777 -R /mnt/exec/release || true
systemctl daemon-reload || true
systemctl enable kvmd-web || true
systemctl restart kvmd-web || systemctl start kvmd-web || true

echo "If KVM behaves abnormally after upgrade, please reboot the device and test again."
EOF

chmod 0755 "$STAGE_DIR/DEBIAN/preinst" "$STAGE_DIR/DEBIAN/postinst"

# Build .deb and show contents
OUT_DEB="$OUT_DIR/blikvm-${PKG_PREFIX}_${VERSION_DEB}_${DEB_ARCH}.deb"
dpkg-deb -b "$STAGE_DIR" "$OUT_DEB"
dpkg -c "$OUT_DEB"

echo "\nPackage built: $OUT_DEB"

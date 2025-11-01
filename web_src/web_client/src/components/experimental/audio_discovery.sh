#!/bin/bash
# BliKVM Allwinner V4 Audio Device Discovery Script

echo "=== BliKVM Audio Device Discovery ==="
echo

echo "1. Available ALSA Cards:"
echo "------------------------"
cat /proc/asound/cards
echo

echo "2. ALSA PCM Devices:"
echo "-------------------"
aplay -l
echo

echo "3. ALSA Capture Devices:"
echo "------------------------"
arecord -l
echo

echo "4. Available Audio Devices (detailed):"
echo "--------------------------------------"
ls -la /dev/snd/
echo

echo "5. ALSA Configuration:"
echo "---------------------"
cat /proc/asound/pcm
echo

echo "6. USB Audio Devices:"
echo "--------------------"
lsusb | grep -i audio
echo

echo "7. Kernel Audio Modules:"
echo "------------------------"
lsmod | grep -E "(snd|audio)"
echo

echo "8. HDMI Audio Status:"
echo "--------------------"
# Check if HDMI audio is available
find /sys -name "*hdmi*" -type d 2>/dev/null | grep -i audio
echo

echo "9. Test Available Capture Devices:"
echo "----------------------------------"
echo "Testing common capture device patterns..."

# Test patterns for Allwinner/ARM devices
test_devices=(
    "hw:0,0"
    "hw:1,0" 
    "hw:2,0"
    "plughw:0,0"
    "plughw:1,0"
    "default"
)

for device in "${test_devices[@]}"; do
    echo -n "Testing capture device $device: "
    timeout 2s arecord -f S16_LE -c 1 -r 22050 -D "$device" /dev/null 2>/dev/null
    if [ $? -eq 0 ] || [ $? -eq 124 ]; then
        echo "✓ WORKING"
    else
        echo "✗ FAILED"
    fi
done
echo

echo "10. Suggested Audio Pipeline Commands:"
echo "-------------------------------------"

# Get the first working capture device
working_capture=""
for device in "hw:0,0" "hw:1,0" "plughw:0,0" "default"; do
    timeout 1s arecord -f S16_LE -c 1 -r 22050 -D "$device" /dev/null 2>/dev/null
    if [ $? -eq 0 ] || [ $? -eq 124 ]; then
        working_capture="$device"
        break
    fi
done

# Get the first working playback device  
working_playback=""
for device in "hw:0,0" "hw:1,0" "plughw:0,0" "default"; do
    timeout 1s aplay -D "$device" /dev/null 2>/dev/null
    if [ $? -eq 0 ] || [ $? -eq 124 ]; then
        working_playback="$device"
        break
    fi
done

if [ -n "$working_capture" ]; then
    echo "✓ Working capture device: $working_capture"
    echo "  Capture command:"
    echo "  arecord -f S16_LE -c 2 -r 48000 -D $working_capture"
    echo
    echo "  Full Opus pipeline:"
    echo "  arecord -f S16_LE -c 2 -r 48000 -D $working_capture | opusenc --raw --raw-rate 48000 --raw-chan 2 --bitrate 64 - audio.opus"
else
    echo "✗ No working capture device found"
fi

if [ -n "$working_playback" ]; then
    echo "✓ Working playback device: $working_playback"  
    echo "  Playback command:"
    echo "  aplay -f S16_LE -c 2 -r 48000 -D $working_playback"
    echo
    echo "  Full Opus pipeline:"
    echo "  opusdec --raw --rate 48000 audio.opus - | aplay -f S16_LE -c 2 -r 48000 -D $working_playback"
else
    echo "✗ No working playback device found"
fi

echo
echo "11. Alternative Configuration Suggestions:"
echo "-----------------------------------------"
echo "If no devices work, try:"
echo "• Install ALSA utilities: opkg install alsa-utils"
echo "• Load audio kernel modules: modprobe snd-usb-audio"
echo "• Check USB audio device: connect USB audio adapter"
echo "• Enable HDMI audio in device tree/kernel config"
echo "• Use PulseAudio: opkg install pulseaudio"
echo
echo "For Allwinner V4 specific audio:"
echo "• Check /boot/armbianEnv.txt for audio overlays"
echo "• Enable I2S/audio codec in device tree"
echo "• Verify sunxi-codec module is loaded"

echo
echo "=== Discovery Complete ==="
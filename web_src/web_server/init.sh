#!/bin/bash
[[ -d /dev/shm/blikvm ]] || mkdir -p /dev/shm/blikvm
[[ -f /dev/shm/blikvm/atx ]] || touch /dev/shm/blikvm/atx

cd /mnt/exec/release && ./server_app
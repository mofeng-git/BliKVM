FROM node:18.5.0 AS builder

RUN apt-get update \ 
        && apt-get install -y --no-install-recommends \
                make cmake git rsync ca-certificates \
                libuv1-dev libffi-dev \ 
        && apt clean \
        && rm -rf /var/lib/apt/lists/*


WORKDIR /mnt/blikvm

COPY . /mnt/blikvm

RUN npm config set registry https://registry.npmmirror.com && npm install -g cross-env

ENV HARDWARE_TYPE=h616 npm_config_nodedir=/usr/local

RUN bash script/packdeb.sh allwinner

FROM debian:bookworm

COPY --from=builder  /mnt/blikvm/blikvm-v4*deb /tmp/

RUN apt update \
        && apt install v4l-utils libnice10 libjansson4 libsrtp2-1 libopus0 libmicrohttpd12 net-tools libogg0 libasound2 \
                libevent-2.1-7 libevent-pthreads-2.1-7 libbsd0 libspeexdsp1 wget curl nano xz-utils kmod fdisk dosfstools util-linux -y \
        && apt install /tmp/blikvm-v4*.deb -y \
        && apt clean \
        && rm -rf /var/lib/apt/lists/*

COPY web_src/web_server/init.sh /mnt/exec/release/

RUN wget -O /usr/lib/libx264.so.163 https://files.mofeng.run/blikvm/251023/libx264.so.163 \
    && wget -O /usr/lib/libwebsockets.so.19 https://files.mofeng.run/blikvm/251023/libwebsockets.so.19 \
    && ln -s /mnt/exec/release/lib/h616 /mnt/exec/release/lib/none \
    && chmod +x /mnt/exec/release/init.sh

ENTRYPOINT ["/mnt/exec/release/init.sh"]
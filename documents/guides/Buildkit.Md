# Buildkit setup

## enable binfmt misc
apk add qemu qemu-aarch64 qemu-system-aarch64
vi /ete/modules and add binfmt_misc
rc-update add binfmt boot
    wget https://raw.githubusercontent.com/qemu/qemu/master/scripts/qemu-binfmt-conf.sh
chmod +x qemu-binfmt-conf.sh
./qemu-binfmt-conf.sh
reboot

## Install containerd
git clone https://github.com/containerd/containerd.git
cd containerd
'''
FROM golang:1.10.3-alpine3.8

RUN apk update && \
    apk add build-base git btrfs-progs-dev btrfs-progs libseccomp-dev
'''
docker build -t containerd/build .


docker run -it     -v ${PWD}:/go/src/github.com/containerd/containerd     -e GOPATH=/go     -w /go/src/github.com/containerd/containerd containerd/build make && make install

chmod +x ./bin/*
./bin/containerd


## Install buildkit
it clone https://github.com/moby/buildkit.git
cd buildkit
make && make install
buildkitd --debug --root /var/lib/buildkit
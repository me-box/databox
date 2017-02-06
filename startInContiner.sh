#!/bin/bash

docker kill databox-cm
docker kill  databox-resolver
docker rm databox-cm
docker rm databox-resolver


docker run -d --name databox-resolver \
	 --hostname resolvable  \
	 -v /var/run/docker.sock:/tmp/docker.sock \
	 -v /etc/resolv.conf:/tmp/resolv.conf \
	 mgood/resolvable

docker create \
	-v /var/run/docker.sock:/var/run/docker.sock \
        -v `pwd`:/cm \
        --name databox-cm \
        -e "DATABOX_DEV=1" \
	-p 8989:8989 \
        -t mhart/alpine-node npm --prefix /cm start

docker network connect databox-cloud-net databox-cm
docker network connect databox-app-net databox-cm
docker network connect databox-driver-net databox-cm

docker start -i databox-cm

#!/bin/bash

docker kill databox-cm
docker rm databox-cm

docker create \
	-v /var/run/docker.sock:/var/run/docker.sock \
        -v /home/tosh/databox/databox-container-manager:/cm \
        --name databox-cm \
        -e "DATABOX_DEV=1" \
	-p 8989:8989 \
        -t mhart/alpine-node npm --prefix /cm start

docker network connect databox-cloud-net databox-cm
docker network connect databox-app-net databox-cm
docker network connect databox-driver-net databox-cm

docker start -i databox-cm

#!/bin/bash

if [ "$(docker ps -aq -f name=databox-cm)" ]; then
    docker stop databox-cm
    docker rm databox-cm
fi

docker create \
	-v /var/run/docker.sock:/var/run/docker.sock \
	-v `pwd`:/cm \
	--name databox-cm \
	-e "DATABOX_DEV=1" \
	--label databox.type=container-manager \
	-p 8989:8989 \
	-t node:alpine npm --prefix /cm start


docker start -i databox-cm

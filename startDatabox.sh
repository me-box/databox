#!/bin/bash

if [ "$(docker ps -aq -f name=databox-cm)" ]; then
    docker stop databox-cm
    docker rm databox-cm
fi

arch=$(uname -m)

if [ "$arch" == 'armv7l' ]
then
    baseimg="databoxsystems/databox-cm-arm"
else
    baseimg="databoxsystems/databox-cm"
fi

docker pull $baseimg

docker run \
	-v /var/run/docker.sock:/var/run/docker.sock \
	--name databox-cm \
	--label databox.type=container-manager \
	-p 8989:8989 \
  -it $baseimg




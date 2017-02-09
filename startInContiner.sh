#!/bin/bash

docker kill databox-cm
docker rm databox-cm

docker run \
	-v /var/run/docker.sock:/var/run/docker.sock \
	--name databox-cm \
	--label databox.type=container-manager \
	-p 8989:8989 \
        -it toshdatabox/databox-cm





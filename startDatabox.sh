#!/bin/bash

ARCH=$(uname -m)

if [ "$ARCH" == 'armv7l' ]
then
     NODE_IMAGE="hypriot/rpi-node:slim"
elif [ "$ARCH" == 'aarch64' ]
then
     NODE_IMAGE="forumi0721alpineaarch64/alpine-aarch64-nodejs"
else
     ARCH=""
     NODE_IMAGE="node:alpine"
fi

export DATABOX_ARCH="-"${ARCH}

function dr () ( docker run --net=host -ti --rm -v "$(pwd -P)":/cwd -w /cwd $DARGS "$@" ;)
function contNode { dr ${NODE_IMAGE}  "$@" ;}
function contNPM { dr ${NODE_IMAGE} npm "$@" ;}

if [ ! -d "node_modules" ]; then
    contNPM install
fi

./getCompnentSrc.sh

docker swarm init

echo "Creating certs"
contNode node ./src/createCerts.js

docker-compose build
docker-compose -f ./docker-compose-dev-local-images.yaml build

docker stack deploy -c docker-compose.yaml databox
contNode node ./src/seedManifests.js

echo "databox started goto http://127.0.0.1:8989"
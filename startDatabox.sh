#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker compose is not installed (try pip install docker-compose).' >&2
  exit 1
fi

ARCH=$(uname -m)

if [ "$ARCH" == 'armv7l' ]
then
     NODE_IMAGE="hypriot/rpi-node:slim"
     export DATABOX_ARCH="-"${ARCH}
elif [ "$ARCH" == 'aarch64' ]
then
     NODE_IMAGE="forumi0721alpineaarch64/alpine-aarch64-nodejs"
     export DATABOX_ARCH="-"${ARCH}
else
     ARCH=""
     NODE_IMAGE="node:alpine"
     export DATABOX_ARCH=""
fi


function dr () ( docker run --net=host -ti --rm -v "$(pwd -P)":/cwd -w /cwd $DARGS "$@" ;)
function contNode { dr ${NODE_IMAGE}  "$@" ;}
function contNPM { dr ${NODE_IMAGE} npm "$@" ;}

if [ ! -d "node_modules" ]; then
    contNPM install
fi

./getCompnentSrc.sh

docker swarm init

if [ ! -d "certs" ]; then
  echo "Creating certs"
  mkdir ./certs
  contNode node ./src/createCerts.js
fi

docker-compose build
docker-compose -f ./docker-compose-dev-local-images.yaml build

docker stack deploy -c docker-compose.yaml databox
contNode node ./src/seedManifests.js

echo "databox started goto http://127.0.0.1:8989"

docker service logs databox_container-manager -f

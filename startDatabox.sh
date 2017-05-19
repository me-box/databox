#!/bin/bash

function dr () ( docker run -ti --rm -v "$(pwd -P)":/cwd -w /cwd $DARGS "$@" ;)
function contNode { dr node:alpine  "$@" ;}
function contNPM { dr node:alpine npm "$@" ;}

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
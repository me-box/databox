#!/bin/bash

docker swarm init

node ./src/createCerts.js

docker-compose build
docker-compose -f ./docker-compose-dev-local-images.yaml build

docker stack deploy -c docker-compose.yaml databox
node ./src/seedManifests.js

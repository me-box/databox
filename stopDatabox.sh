#!/bin/bash

if [ "$1" == "sdk" ]
then
    export HOSTMOUNT=$(pwd -P)
    docker stack rm databox sdk
    echo "waiting ....."
    sleep 10 #give docker some time to remove the networks etc
    exit 0
fi

docker stack rm databox

echo "waiting ....."
sleep 10 #give docker some time to remove the networks etc
docker swarm leave --force
echo "done."

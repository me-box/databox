#!/bin/bash
docker stack rm databox

docker service rm $(docker service ls -q)

docker secret rm $(docker secret ls -q)

echo "waiting ....."
sleep 10 #give docker some time to remove the networks etc
docker swarm leave --force
echo "done."

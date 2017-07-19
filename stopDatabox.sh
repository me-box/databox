#!/bin/bash
docker stack rm databox

echo "waiting ....."
sleep 10 #give docker some time to remove the networks etc
docker swarm leave --force
echo "done."

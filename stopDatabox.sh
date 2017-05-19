#!/bin/bash
docker stack rm databox

docker service rm $(docker service ls -q)

docker secret rm $(docker secret ls -q)

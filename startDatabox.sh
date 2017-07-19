#!/bin/bash

docker node ls > /dev/null
if [ $? -eq 0 ]
then
   echo databox is already running
   exit 0
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker compose is not installed (try pip install docker-compose).' >&2
  exit 1
fi

ips=($(ifconfig | sed -En 's/127.0.0.1//;s/169.//;s/.inet (addr:)?(([0-9]+.){3}[0-9]+).*/\2/p'))
EXT_IP=$ips
if [ "${#ips[@]}" -gt "1" ]
then
   echo More than one IP found please select from the list.
   select ip in ${ips[*]}; do
      case $ip in
         exit) echo "exiting"
               break ;;
            *) EXT_IP=$ip
            break ;;
      esac
   done
fi

DEV=""
if [ "$1" == "dev" ]
then
    DEV=1
    export DATABOX_DEV="1"
else
  DEV=0 
  export DATABOX_DEV="0"
fi

if [ "$1" == "sdk" ]
then
    #enable SDK mode
    export DATABOX_SDK="1"
else 
    export DATABOX_SDK="0"
fi

ARCH=$(uname -m)

if [ "$ARCH" == 'armv7l' ]
then
     NODE_IMAGE="hypriot/rpi-node:slim"
     export DATABOX_ARCH="-"${ARCH}
     DEV=1 #ARM is only supported in dev mode with localy built images (for now)
     export DATABOX_DEV="1"
elif [ "$ARCH" == 'aarch64' ]
then
     NODE_IMAGE="forumi0721alpineaarch64/alpine-aarch64-nodejs"
     export DATABOX_ARCH="-"${ARCH}
     DEV=1 #ARM is only supported in dev mode with localy built images (for now)
     export DATABOX_DEV="1"
else
     ARCH=""
     NODE_IMAGE="node:alpine"
     export DATABOX_ARCH=""
fi

if [ "$DEV" != "1" ]
then
    #use images from https://hub.docker.com/r/databoxsystems/ 
    export DOCKER_REPO="databoxsystems/"
else
    #use local images
    export DOCKER_REPO=""   
fi

function dr () ( docker run --net=host -ti --rm -v "$(pwd -P)":/cwd -w /cwd $DARGS "$@" ;)
function contNode { dr ${NODE_IMAGE}  "$@" ;}
function contNPM { dr ${NODE_IMAGE} npm "$@" ;}

if [ ! -d "node_modules" ]; then
    contNPM install
fi



docker swarm init --advertise-addr ${EXT_IP}

if [ ! -d "certs" ]; then
  echo "Creating certs"
  mkdir ./certs
  contNode node ./src/createCerts.js
fi


if [ "$DEV" == "1" ]
then
  #only build local images in dev mode 
  ./getCompnentSrc.sh
  docker-compose build
  docker-compose -f ./docker-compose-dev-local-images.yaml build
fi

docker stack deploy -c docker-compose.yaml databox

DARGS="-e DATABOX_DEV=${DEV}"
contNode node ./src/seedManifests.js


echo "databox started goto http://127.0.0.1:8989"

docker service logs databox_container-manager -f

#!/usr/bin/env bash

#set this to ssh if you want to clone ocer ssh rather then https
UPDATE_TYPE="ssh"

update_repo()
{

    if [ "$UPDATE_TYPE" = "ssh" ]
    then
        update_repo_ssh $1
    else    
        update_repo_https $1
    fi
}

update_repo_https()
{
	NAME=$1
	REPO="https://github.com/me-box/${NAME}.git"

	if [ ! -d ${NAME} ]; then
        git clone ${REPO} ${NAME}
    else
        cd ${NAME}
        git pull
        cd ..
	fi
}

update_repo_ssh()
{
	NAME=$1
	REPO="git@github.com:me-box/${NAME}.git"

	if [ ! -d ${NAME} ]; then
        git clone ${REPO} ${NAME}
    else
        cd ${NAME}
        git pull
        cd ..
	fi
}

update_repo "core-container-manager" 
update_repo "core-arbiter" 
update_repo "core-syslog" 
update_repo "core-export-service" 
update_repo "platform-app-server" 
update_repo "store-json" 
update_repo "driver-os-monitor" 
update_repo "driver-twitter" 
update_repo "app-twitter-sentiment" 

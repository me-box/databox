#!/usr/bin/env bash

update_repo()
{
	NAME=$1
	REPO=$2

	if [ ! -d ${NAME} ]; then
        git clone ${REPO} ${NAME}
    else
        cd ${NAME}
        git pull
        cd ..
	fi
}

update_repo "databox-cm" "https://github.com/me-box/databox-cm.git"
update_repo "databox-arbiter" "https://github.com/me-box/databox-arbiter.git"
update_repo "databox-logstore" "https://github.com/me-box/databox-logstore.git"
update_repo "databox-export-service" "https://github.com/me-box/databox-export-service.git"
update_repo "databox-app-server" "https://github.com/me-box/databox-app-server.git"
update_repo "databox-store-blob-mongo" "https://github.com/me-box/databox-store-blob-mongo.git"
update_repo "databox-store-blob" "https://github.com/me-box/databox-store-blob.git"
update_repo "databox-os-monitor-driver" "https://github.com/me-box/databox-os-monitor-driver.git"
update_repo "databox-driver-twitter-stream" "https://github.com/me-box/databox-driver-twitter-stream.git"
update_repo "databox-app-twitter-sentiment" "https://github.com/me-box/databox-app-twitter-sentiment.git"

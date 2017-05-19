

if [ ! -d "databox-cm" ]; then
    git clone -b fet/swarm git@github.com:me-box/databox-cm.git databox-cm
fi 

if [ ! -d "databox-arbiter" ]; then
    git clone -b fet/swarm git@github.com:me-box/databox-arbiter.git
fi

if [ ! -d "databox-logstore" ]; then
    git clone -b fet/swarm git@github.com:me-box/databox-logstore.git
fi

if [ ! -d "databox-export-service" ]; then
    git clone git@github.com:me-box/databox-export-service.git
fi

if [ ! -d "databox-app-server" ]; then
    git clone git@github.com:me-box/databox-app-server.git
fi

if [ ! -d "databox-store-blob-mongo" ]; then
    git clone -b fet/swarm git@github.com:me-box/databox-store-blob-mongo.git
fi

if [ ! -d "databox-store-blob" ]; then
    git clone -b fet/swarm git@github.com:me-box/databox-store-blob.git
fi

if [ ! -d "databox-os-monitor-driver" ]; then
    git clone -b fet/swarm git@github.com:me-box/databox-os-monitor-driver.git
fi


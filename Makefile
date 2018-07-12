.PHONY: all
all: build build-linux-amd64 build-linux-arm64

defaultDevDataboxOptions=--release latest -v -app-server dev/app-server \
											-arbiter dev/core-arbiter \
											-cm dev/container-manager \
											-store dev/core-store \
											-export-service dev/core-store \
											-core-network dev/core-network \
											-core-network-relay dev/core-network-relay

defaultDataboxOptions=--release latest -v -app-server toshdatabox/app-server \
											-arbiter toshdatabox/core-arbiter \
											-cm toshdatabox/container-manager \
											-store toshdatabox/core-store \
											-export-service toshdatabox/core-store \
											-core-network toshdatabox/core-network \
											-core-network-relay toshdatabox/core-network-relay \
											-registry toshdatabox
.PHONY: deps
deps:
	go get -u github.com/pebbe/zmq4
	go get -u github.com/me-box/goZestClient
	go get -u golang.org/x/net/proxy
	go get -u github.com/docker/go-connections/nat
	go get -u github.com/pkg/errors
	go get -u github.com/docker/docker/api/types
	go get -u github.com/docker/docker/client
	go get -u github.com/toshbrown/lib-go-databox

.PHONY: build
build:
	rm -rf ${GOPATH}/src/github.com/docker/docker/vendor/github.com/docker/go-connections > /dev/null
	go build -o bin/databox *.go

.PHONY: build-linux-amd64
build-linux-amd64:
	docker build -t local/databox-amd64 -f ./Dockerfile-amd64 .
	docker create --name databox-amd64 -it local/databox-amd64
	docker cp databox-amd64:/bin/databox ./bin/databox.amd64
	docker rm databox-amd64

PHONY: build-linux-arm64
build-linux-arm64:
	docker build -t local/databox-arm64 -f ./Dockerfile-arm64 .
	docker create --name databox-arm64 -it local/databox-arm64
	docker cp databox-arm64:/bin/databox ./bin/databox.arm64
	docker rm databox-arm64

.PHONY: start
start:
	#TODO runing latest for now so that we can use core-store with zest 0.0.7
	bin/databox start --release latest -v $(defaultDataboxOptions) --flushSLAs true

.PHONY: startdev
startdev:
	#runing latest for local dev
	bin/databox start $(defaultDevDataboxOptions) --flushSLAs true

.PHONY: startlatest
startlatest:
	bin/databox start $(defaultDataboxOptions)

.PHONY: startflushslas
startflushslas:
	bin/databox start $(defaultDataboxOptions) --flushSLAs true

.PHONY: stop
stop:
	bin/databox stop

#$1==version $2==Architecture(blank for x86)
define build-core
	mkdir -p build
	#get the code
	#TODO fix repo paths once PR are merged (toshbrown --> me-box)
	$(call gitPullorClone, https://github.com/toshbrown/core-container-manager.git,core-container-manager)
	$(call gitPullorClone, https://github.com/me-box/core-network.git,core-network)
	$(call gitPullorClone, https://github.com/me-box/core-store.git,core-store)
	$(call gitPullorClone, https://github.com/toshbrown/core-arbiter.git,core-arbiter)
	$(call gitPullorClone, https://github.com/toshbrown/app-os-monitor.git,app-os-monitor)
	$(call gitPullorClone, https://github.com/toshbrown/driver-os-monitor.git,driver-os-monitor)
	$(call gitPullorClone, https://github.com/me-box/platform-app-server.git,platform-app-server)
	$(call gitPullorClone, https://github.com/toshbrown/driver-sensingkit.git,driver-sensingkit)
	#$(call gitPullorClone, https://github.com/me-box/zestdb.git,zestdb)

	#Build and tag the images
	#cd ./build/zestdb && docker build -t databoxsystems/zestdb$(2):v0.0.8 -f Dockerfile$(2) .
	cd ./build/core-container-manager && docker build -t dev/container-manager$(2):$(1) -f Dockerfile$(2) .
	cd ./build/core-network && docker build -t dev/core-network$(2):$(1) -f Dockerfile$(2) .
	cd ./build/core-network && docker build -t dev/core-network-relay$(2):$(1) -f Dockerfile-relay$(2) .
	cd ./build/core-store && docker build -t dev/core-store$(2):$(1) -f Dockerfile$(2) .
	cd ./build/core-arbiter && docker build -t dev/core-arbiter$(2):$(1) -f Dockerfile$(2) .
	cd ./build/platform-app-server && docker build -t dev/app-server$(2):latest -f Dockerfile$(2) .

	cd ./build/app-os-monitor && docker build -t local/app-os-monitor$(2):$(1) -f Dockerfile$(2) .
	cd ./build/driver-os-monitor && docker build -t local/driver-os-monitor$(2):$(1) -f Dockerfile$(2) .
	cd ./build/driver-sensingkit && docker build -t local/driver-sensingkit$(2):$(1) -f Dockerfile$(2) .
endef

#$1==giturl $2==name
define gitPullorClone
	git -C ./build/$(2) pull || git clone $(1) ./build/$(2)
endef

.PHONY: build-core-containers
build-core-containers:
	$(call build-core,latest)

.PHONY: build-core-containers-arm64v8
build-core-containers-arm64v8:
	$(call build-core,latest,-arm64)

define publish-core
	docker tag dev/container-manager$(2):$(1) $(3)/container-manager$(2):$(1)
	docker push $(3)/container-manager$(2):$(1)
	docker tag dev/core-network$(2):$(1) $(3)/core-network$(2):$(1)
	docker push $(3)/core-network$(2):$(1)
	docker tag dev/core-network-relay$(2):$(1) $(3)/core-network-relay$(2):$(1)
	docker push $(3)/core-network-relay$(2):$(1)
	docker tag dev/core-store$(2):$(1) $(3)/core-store$(2):$(1)
	docker push $(3)/core-store$(2):$(1)
	docker tag dev/core-arbiter$(2):$(1) $(3)/core-arbiter$(2):$(1)
	docker push $(3)/core-arbiter$(2):$(1)
	docker tag dev/app-server$(2):$(1) $(3)/app-server$(2):$(1)
	docker push $(3)/app-server$(2):$(1)

	docker tag local/app-os-monitor$(2):$(1) $(3)/app-os-monitor$(2):$(1)
	docker push $(3)/app-os-monitor$(2):$(1)
	docker tag local/driver-os-monitor$(2):$(1) $(3)/driver-os-monitor$(2):$(1)
	docker push $(3)/driver-os-monitor$(2):$(1)
	docker tag local/driver-sensingkit$(2):$(1) $(3)/driver-sensingkit$(2):$(1)
	docker push $(3)/driver-sensingkit$(2):$(1)

endef

.PHONY: publish-core-containers
publish-core-containers:
	$(call publish-core,latest,,toshdatabox)

.PHONY: publish-core-containers-arm64v8
publish-core-containers-arm64v8:
	$(call publish-core,latest,-arm64,toshdatabox)

.PHONY: logs
logs:
	bin/databox logs

.PHONY: test
test:
	./databox-test "$(defaultDataboxOptions)"

.PHONY: test-dev
test-dev:
	./databox-test "$(defaultDevDataboxOptions)"

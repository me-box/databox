#The version of databox used in publish-core-containers-version
DATABOX_VERSION=latest

#Change where images a pulled from and pushed to when using this script.
#TODO fix DEFAULT_REG once PR are merged (toshbrown --> databoxsystems)
DEFAULT_REG=toshbrown

# Pass options to the build comands overide OPTS=--no-cache or --flushslas to build without caching or flush the SLA on cmgr startup
#OPTS=

ifeq ($(shell uname -m),x86_64)
	HOST_ARCH = amd64
endif
ifeq ($(shell uname -m),aarch64)
	HOST_ARCH = arm64v8
endif

ifeq ($(shell uname -s),Linux)
	HOST_PATFORM = Linux
endif
ifeq ($(shell uname -s),Darwin)
	HOST_PATFORM = Darwin
endif

ifndef HOST_ARCH
	$(error Host architecture not suported)
endif

ifndef HOST_PATFORM
	$(error Host platform not supported)
endif

databoxCMD=docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(shell pwd)/certs:/certs -v $(shell pwd)/sdk:/sdk -v -t $(DEFAULT_REG)/databox:$(DATABOX_VERSION) /databox
#databoxCMD=./bin/databox



defaultDataboxOptions= -v -app-server $(DEFAULT_REG)/app-server \
											-arbiter $(DEFAULT_REG)/core-arbiter \
											-cm $(DEFAULT_REG)/container-manager \
											-store $(DEFAULT_REG)/core-store \
											-export-service $(DEFAULT_REG)/export-service \
											-core-network $(DEFAULT_REG)/core-network \
											-core-network-relay $(DEFAULT_REG)/core-network-relay \
											-registry $(DEFAULT_REG) \
											-release $(DATABOX_VERSION)

defaultDataboxOptionsAmd64= -v -app-server $(DEFAULT_REG)/app-server-amd64 \
											-arbiter $(DEFAULT_REG)/core-arbiter-amd64 \
											-cm $(DEFAULT_REG)/container-manager-amd64 \
											-store $(DEFAULT_REG)/core-store-amd64 \
											-export-service $(DEFAULT_REG)/export-service-amd64 \
											-core-network $(DEFAULT_REG)/core-network-amd64 \
											-core-network-relay $(DEFAULT_REG)/core-network-relay-amd64 \
											-registry $(DEFAULT_REG) \
											-release $(DATABOX_VERSION)

defaultDataboxOptionsArm64v8= -v -app-server $(DEFAULT_REG)/app-server-arm64v8 \
											-arbiter $(DEFAULT_REG)/core-arbiter-arm64v8 \
											-cm $(DEFAULT_REG)/container-manager-arm64v8 \
											-store $(DEFAULT_REG)/core-store-arm64v8 \
											-export-service $(DEFAULT_REG)/export-service-arm64v8 \
											-core-network $(DEFAULT_REG)/core-network-arm64v8 \
											-core-network-relay $(DEFAULT_REG)/core-network-relay-arm64v8 \
											-registry $(DEFAULT_REG) \
											-release $(DATABOX_VERSION)

.PHONY: all
all: build build-linux-amd64 build-linux-arm64 get-core-containers-src build-core-containers publish-core-multiarch

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
	go build -ldflags="-s -w" -o bin/databox *.go

.PHONY: build-linux-amd64
build-linux-amd64:
	docker build -t $(DEFAULT_REG)/databox-amd64:$(DATABOX_VERSION) -f ./Dockerfile-amd64 . $(OPTS)


.PHONY: build-linux-arm64
build-linux-arm64:
	docker build -t $(DEFAULT_REG)/databox-arm64v8:$(DATABOX_VERSION) -f ./Dockerfile-arm64v8 . $(OPTS)

.PHONY: start
start:
ifndef ARCH
	$(databoxCMD) start --host-path $(shell pwd) $(defaultDataboxOptions) -v $(OPTS)
endif
ifeq ($(ARCH),amd64)
	$(databoxCMD) start --host-path $(shell pwd) $(defaultDataboxOptionsAmd64) -v $(OPTS)
endif
ifeq ($(ARCH),arm64v8)
	$(databoxCMD) start --host-path $(shell pwd) $(defaultDataboxOptionsArm64v8) -v $(OPTS)
endif

.PHONY: stop
stop:
	$(databoxCMD) stop $(OPTS)

#$1==version $2==Architecture
define build-core
	#Build and tag the images
	#cd ./build/zestdb && docker build -t databoxsystems/zestdb$(2):v0.0.8 -f Dockerfile$(2) .
	cd ./build/core-container-manager && docker build -t $(DEFAULT_REG)/container-manager-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/core-network && docker build -t $(DEFAULT_REG)/core-network-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/core-network && docker build -t $(DEFAULT_REG)/core-network-relay-$(2):$(1) -f Dockerfile-relay$(3) .
	cd ./build/core-store && docker build -t $(DEFAULT_REG)/core-store-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/core-arbiter && docker build -t $(DEFAULT_REG)/core-arbiter-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/core-export-service && docker build -t $(DEFAULT_REG)/export-service-$(2):$(1) -f Dockerfile$(3) .

	cd ./build/platform-app-server && docker build -t $(DEFAULT_REG)/app-server-$(2):latest -f Dockerfile$(3) .

	cd ./build/app-os-monitor && docker build -t $(DEFAULT_REG)/app-os-monitor-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/driver-os-monitor && docker build -t $(DEFAULT_REG)/driver-os-monitor-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/driver-phillips-hue && docker build -t $(DEFAULT_REG)/driver-phillips-hue-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/driver-tplink-smart-plug && docker build -t $(DEFAULT_REG)/driver-tplink-smart-plug-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/driver-sensingkit && docker build -t $(DEFAULT_REG)/driver-sensingkit-$(2):$(1) -f Dockerfile$(3) .

	cd ./build/app-twitter-sentiment && docker build -t $(DEFAULT_REG)/app-twitter-sentiment-$(2):$(1) -f Dockerfile$(3) .
	cd ./build/app-light-graph && docker build -t $(DEFAULT_REG)/app-light-graph-$(2):$(1) -f Dockerfile$(3) .
endef

#$1==giturl $2==name $3=branch
define gitPullorClone
	git -C ./build/$(2) pull || git clone -b $(3) $(1) ./build/$(2)
endef

.PHONY: get-core-containers-src
get-core-containers-src:
	mkdir -p build
	#get the code
	#TODO fix repo paths once PR are merged (toshbrown --> me-box)
	$(call gitPullorClone, https://github.com/toshbrown/core-container-manager.git,core-container-manager,master)
	$(call gitPullorClone, https://github.com/toshbrown/core-network.git,core-network,master)
	$(call gitPullorClone, https://github.com/me-box/core-store.git,core-store,master)
	$(call gitPullorClone, https://github.com/toshbrown/core-arbiter.git,core-arbiter,master)
	$(call gitPullorClone, https://github.com/me-box/core-export-service.git,core-export-service,speak-zest)

	$(call gitPullorClone, https://github.com/toshbrown/app-os-monitor.git,app-os-monitor,master)
	$(call gitPullorClone, https://github.com/toshbrown/driver-os-monitor.git,driver-os-monitor,master)
	$(call gitPullorClone, https://github.com/me-box/driver-phillips-hue.git,driver-phillips-hue,update-to-new-arbiter)
	$(call gitPullorClone, https://github.com/me-box/driver-tplink-smart-plug.git,driver-tplink-smart-plug,updat-to-new-arbiter)
	$(call gitPullorClone, https://github.com/me-box/platform-app-server.git,platform-app-server,master)
	$(call gitPullorClone, https://github.com/toshbrown/driver-sensingkit.git,driver-sensingkit,master)

	$(call gitPullorClone, https://github.com/toshbrown/app-light-graph.git,app-light-graph,master)
	$(call gitPullorClone, https://github.com/toshbrown/app-twitter-sentiment.git,app-twitter-sentiment,master)


.PHONY: build-core-containers
build-core-containers:
ifndef ARCH
	$(call build-core,latest,amd64,)
	$(call build-core,latest,arm64v8,-arm64v8)
endif
ifeq ($(ARCH),amd64)
	$(call build-core,latest,amd64,)
endif
ifeq ($(ARCH),arm64v8)
	$(call build-core,latest,arm64v8,-arm64v8)
endif

define publish-core
	docker push $(3)/databox-$(2):$(1)
	docker push $(3)/container-manager-$(2):$(1)
	docker push $(3)/core-network-$(2):$(1)
	docker push $(3)/core-network-relay-$(2):$(1)
	docker push $(3)/core-store-$(2):$(1)
	docker push $(3)/core-arbiter-$(2):$(1)
	docker push $(3)/app-server-$(2):$(1)
	docker push $(3)/export-service-$(2):$(1)
	docker push $(3)/app-os-monitor-$(2):$(1)
	docker push $(3)/driver-os-monitor-$(2):$(1)
	docker push $(3)/driver-phillips-hue-$(2):$(1)
	docker push $(3)/driver-tplink-smart-plug-$(2):$(1)
	docker push $(3)/driver-sensingkit-$(2):$(1)
	docker push $(3)/app-twitter-sentiment-$(2):$(1)
	docker push $(3)/app-light-graph-$(2):$(1)
endef


#$1=manifestName
define build-and-publish-manifest
	docker manifest create --amend $(1):$(DATABOX_VERSION) $(1)-amd64:$(DATABOX_VERSION)
	docker manifest annotate $(1):$(DATABOX_VERSION) $(1)-amd64:$(DATABOX_VERSION) --os linux --arch amd64
	#TODO re-enable this when core-store, export-servive and core network build for arm64v8
	#docker manifest annotate $(1) $(3) --os linux --arch arm64 --variant v8
	docker manifest push -p $(1)
endef

.PHONY: publish-core-multiarch
publish-core-multiarch:
	$(call publish-core,$(DATABOX_VERSION),amd64,$(DEFAULT_REG))
	$(call build-and-publish-manifest, $(DEFAULT_REG)/databox)
	#TODO re-enable this when core-store, export-servive and core network build for arm64v8
	#(call publish-core,latest,arm64v8,$(DEFAULT_REG))
	$(call build-and-publish-manifest, $(DEFAULT_REG)/container-manager)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/core-network)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/core-network-relay)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/core-store)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/core-arbiter)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/app-server)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/export-service)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/app-os-monitor)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/driver-os-monitor)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/driver-phillips-hue)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/driver-tplink-smart-plug)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/driver-sensingkit)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/app-twitter-sentiment)
	$(call build-and-publish-manifest, $(DEFAULT_REG)/app-light-graph)

.PHONY: build-and-publish-manifest
build-and-publish-manifest:
	$(call build-and-publish-manifest, $(DEFAULT_REG)/$(NAME))

.PHONY: logs
logs:
	bin/databox logs

.PHONY: test
test:
ifndef ARCH
	./databox-test "$(databoxCMD)" "$(defaultDataboxOptions)" $(HOST_ARCH)
endif
ifeq ($(ARCH),amd64)
	./databox-test "$(databoxCMD)" "$(defaultDataboxOptionsAmd64)" $(HOST_ARCH)
endif
ifeq ($(ARCH),arm64v8)
	./databox-test "$(databoxCMD)" "$(defaultDataboxOptionsArm64v8)" $(HOST_ARCH)
endif

.PHONY: clean-docker
clean-docker:
	docker rm  $$(docker ps -a -q)
	docker rmi $$(docker images -q) -f

.PHONY: help
help:
	$(info )
	$(info This make scrpt is used to build databox and all its core component for x86 and arm64v8.)
	$(info It will build and publish mutiplatform docker images to docker hub in the the DEFAULT_REG.)
	$(info It requires docker with mutifomat suport and a the experimental options to be enabled in for the docker cli. )
	$(info )
	$(info Usage:)
	$(info )
	$(info      all                       - Builds a local databox binary and an amd64 and arm6v8 docker image)
	$(info |                            Options can be passed to the build command using OPTS=--no-cache)
	$(info )
	$(info      get-core-containers-src   - Clones or updates the lates datbox source code to the ./build directory)
	$(info )
	$(info      build-core-containers     - Builds local x86 and arm64v8 containers for all the core-components)
	$(info |                            This command also create the multiarch Docker mainfests)
	$(info )
	$(info      publish-core              - Publish databox to dockerhub. The location can be overridden using DEFAULT_REG=[yourRegisteryName])
	$(info )
	$(info )
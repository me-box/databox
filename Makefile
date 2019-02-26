#The version of databox used in publish-core-containers-version
DATABOX_VERSION=0.5.2

#Change where images a pulled from and pushed to when using this script.
DEFAULT_REG=databoxsystems

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

ifdef ARCH
ARCH_TMP=-$(ARCH)
endif
databoxCMD=docker run --rm -v /var/run/docker.sock:/var/run/docker.sock --network host -t $(DEFAULT_REG)/databox$(ARCH_TMP):$(DATABOX_VERSION) /databox
#databoxCMD=./bin/databox



defaultDataboxOptions=  -app-server $(DEFAULT_REG)/driver-app-store \
									-arbiter $(DEFAULT_REG)/arbiter \
									-cm $(DEFAULT_REG)/container-manager \
									-store $(DEFAULT_REG)/core-store \
									-export-service $(DEFAULT_REG)/export-service \
									-core-network $(DEFAULT_REG)/core-network \
									-core-ui $(DEFAULT_REG)/core-ui \
									-core-network-relay $(DEFAULT_REG)/core-network-relay \
									-registry $(DEFAULT_REG) \
									-release $(DATABOX_VERSION) \
									-sslHostName $(shell hostname)

.PHONY: all
all: build-linux-amd64 build-linux-arm64 get-containers-src build-core-containers build-app-drivers

.PHONY: publish
publish: publish-core publish-core-multiarch

.PHONY: all-local
all-local: build-linux-amd64 build-linux-arm64 get-containers-src build-app-drivers build-core-containers

.PHONY: all-local-core-only
all-local-core-only: build-linux-amd64 build-linux-arm64 get-containers-src build-core-containers

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
	$(databoxCMD) start $(defaultDataboxOptions) $(OPTS)


.PHONY: stop
stop:
	$(databoxCMD) stop $(OPTS)

#$1==version $2==Architecture
define build-core
	#Build and tag the images
	make -C ./build/core-container-manager build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/core-network build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/core-store build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/core-arbiter build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/core-export-service build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/core-ui build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/app-os-monitor build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-os-monitor build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-app-store build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
endef

#$1==version $2==Architecture
define build-app-drivers
	make -C ./build/driver-sensingkit build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-phillips-hue build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-tplink-smart-plug build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/app-twitter-sentiment build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/app-light-graph build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-twitter build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-spotify build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-bbc-iplayer build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)
	$(ifeq($(2),arm64v8), sleep 2)
	make -C ./build/driver-instagram build-$(2) VERSION=$(1) DEFAULT_REG=$(DEFAULT_REG)

endef

#$1==giturl $2==name $3=branch
define gitPullorClone
	git -C ./build/$(2) pull || git clone -b $(3) $(1) ./build/$(2)
endef

.PHONY: get-containers-src
get-containers-src:
	mkdir -p build
	#get the code
	$(call gitPullorClone, https://github.com/me-box/core-container-manager.git,core-container-manager,master)
	$(call gitPullorClone, https://github.com/me-box/core-network.git,core-network,master)
	$(call gitPullorClone, https://github.com/me-box/core-store.git,core-store,master)
	$(call gitPullorClone, https://github.com/me-box/core-arbiter.git,core-arbiter,master)
	$(call gitPullorClone, https://github.com/me-box/core-export-service.git,core-export-service,master)

	$(call gitPullorClone, https://github.com/me-box/app-os-monitor.git,app-os-monitor,master)
	$(call gitPullorClone, https://github.com/me-box/driver-os-monitor.git,driver-os-monitor,master)
	$(call gitPullorClone, https://github.com/me-box/driver-phillips-hue.git,driver-phillips-hue,master)
	$(call gitPullorClone, https://github.com/me-box/driver-tplink-smart-plug.git,driver-tplink-smart-plug,master)
	$(call gitPullorClone, https://github.com/me-box/driver-app-store.git,driver-app-store,master)
	$(call gitPullorClone, https://github.com/me-box/core-ui.git,core-ui,master)
	$(call gitPullorClone, https://github.com/me-box/driver-bbc-iplayer.git,driver-bbc-iplayer,master)
	$(call gitPullorClone, https://github.com/me-box/driver-spotify.git,driver-spotify,master)
	$(call gitPullorClone, https://github.com/me-box/driver-instagram.git,driver-instagram,master)
	$(call gitPullorClone, https://github.com/me-box/driver-sensingkit.git,driver-sensingkit,master)

	$(call gitPullorClone, https://github.com/me-box/app-light-graph.git,app-light-graph,master)
	$(call gitPullorClone, https://github.com/me-box/app-twitter-sentiment.git,app-twitter-sentiment,master)
	$(call gitPullorClone, https://github.com/me-box/driver-twitter.git,driver-twitter,master)


.PHONY: build-core-containers
build-core-containers:
ifndef ARCH
	$(call build-core,$(DATABOX_VERSION),amd64,)
	$(call build-core,$(DATABOX_VERSION),arm64v8,-arm64v8)
endif
ifeq ($(ARCH),amd64)
	$(call build-core,$(DATABOX_VERSION),amd64,)
endif
ifeq ($(ARCH),arm64v8)
	$(call build-core,$(DATABOX_VERSION),arm64v8,-arm64v8)
endif

.PHONY: build-app-drivers
build-app-drivers:
ifndef ARCH
	$(call build-app-drivers,$(DATABOX_VERSION),amd64,)
	$(call build-app-drivers,$(DATABOX_VERSION),arm64v8,-arm64v8)
endif
ifeq ($(ARCH),amd64)
	$(call build-app-drivers,$(DATABOX_VERSION),amd64,)
endif
ifeq ($(ARCH),arm64v8)
	$(call build-app-drivers,$(DATABOX_VERSION),arm64v8,-arm64v8)
endif

#$1=manifestName
define build-and-publish-manifest
	docker push $(1)-amd64:$(DATABOX_VERSION)
	docker push $(1)-arm64v8:$(DATABOX_VERSION)
	docker manifest create --amend $(1):$(DATABOX_VERSION) $(1)-amd64:$(DATABOX_VERSION) $(1)-arm64v8:$(DATABOX_VERSION)
	docker manifest annotate $(1):$(DATABOX_VERSION) $(1)-amd64:$(DATABOX_VERSION) --os linux --arch amd64
	docker manifest annotate $(1):$(DATABOX_VERSION) $(1)-arm64v8:$(DATABOX_VERSION) --os linux --arch arm64
	docker manifest push --purge $(1):$(DATABOX_VERSION)
endef

define publish-core
	$(ifeq($(2),amd64), docker push $(DEFAULT_REG)/zestdb-$(2):$(1))


	docker push $(DEFAULT_REG)/container-manager-$(2):$(1)
	docker push $(DEFAULT_REG)/core-network-$(2):$(1)
	docker push $(DEFAULT_REG)/core-network-relay-$(2):$(1)
	docker push $(DEFAULT_REG)/core-store-$(2):$(1)
	docker push $(DEFAULT_REG)/arbiter-$(2):$(1)
	docker push $(DEFAULT_REG)/export-service-$(2):$(1)

	docker push $(DEFAULT_REG)/driver-app-store-$(2):$(1)
	docker push $(DEFAULT_REG)/core-ui-$(2):$(1)
	docker push $(DEFAULT_REG)/app-os-monitor-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-os-monitor-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-phillips-hue-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-tplink-smart-plug-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-spotify-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-bbc-iplayer-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-instagram-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-sensingkit-$(2):$(1)

	docker push $(DEFAULT_REG)/app-twitter-sentiment-$(2):$(1)
	docker push $(DEFAULT_REG)/app-light-graph-$(2):$(1)
	docker push $(DEFAULT_REG)/driver-twitter-$(2):$(1)


endef
.PHONY: publish-core
publish-core:
ifndef ARCH
	@$(call publish-core,$(DATABOX_VERSION),amd64)
	@$(call publish-core,$(DATABOX_VERSION),arm64v8)
endif
ifeq ($(ARCH),amd64)
	@$(call publish-core,$(DATABOX_VERSION),amd64)
endif
ifeq ($(ARCH),arm64v8)
	@$(call publish-core,$(DATABOX_VERSION),arm64v8)
endif

.PHONY: publish-core-multiarch
publish-core-multiarch:
ifndef IMG
	$(call build-and-publish-manifest, $(DEFAULT_REG)/databox)
endif
ifdef IMG
	$(call build-and-publish-manifest, $(DEFAULT_REG)/$(IMG))
endif

.PHONY: build-and-publish-manifest
build-and-publish-manifest:
	$(call build-and-publish-manifest, $(DEFAULT_REG)/$(NAME))

.PHONY: update-manifest-store
update-manifest-store:
	$(call gitPullorClone, https://github.com/me-box/databox-manifest-store.git,databox-manifest-store,master)
	cp ./build/app-os-monitor/databox-manifest.json ./build/databox-manifest-store/app-os-monitor-manifest.json
	cp ./build/driver-os-monitor/databox-manifest.json ./build/databox-manifest-store/driver-os-monitor-manifest.json
	cp ./build/driver-phillips-hue/databox-manifest.json ./build/databox-manifest-store/driver-phillips-hue-manifest.json
	cp ./build/driver-tplink-smart-plug/databox-manifest.json ./build/databox-manifest-store/driver-tplink-smart-plug-manifest.json
	cp ./build/driver-sensingkit/databox-manifest.json ./build/databox-manifest-store/driver-sensingkit-manifest.json
	cp ./build/app-twitter-sentiment/databox-manifest.json ./build/databox-manifest-store/app-twitter-sentiment-manifest.json
	cp ./build/app-light-graph/databox-manifest.json ./build/databox-manifest-store/app-light-graph-manifest.json
	cp ./build/driver-twitter/databox-manifest.json ./build/databox-manifest-store/driver-twitter-manifest.json
	cp ./build/driver-bbc-iplayer/databox-manifest.json ./build/databox-manifest-store/driver-bbc-iplayer-manifest.json
	cp ./build/driver-spotify/databox-manifest.json ./build/databox-manifest-store/driver-driver-spotify-manifest.json
	cp ./build/driver-instagram/databox-manifest.json ./build/databox-manifest-store/driver-driver-instagram-manifest.json
	git -C ./build/databox-manifest-store add -A  && git -C ./build/databox-manifest-store commit -m "Manifests updated $(shell data)"
	git -C ./build/databox-manifest-store push origin master


.PHONY: src-status
src-status:
	#brew install coreutils
	#npm i git-summary -g
	git-summary ./
	git-summary ./build

.PHONY: logs
logs:
	bin/databox logs

.PHONY: test
test:
	./databox-test "$(databoxCMD)" "$(defaultDataboxOptions)" $(HOST_ARCH)  $(DEFAULT_REG) $(DATABOX_VERSION)



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
	$(info      get-containers-src   - Clones or updates the lates datbox source code to the ./build directory)
	$(info )
	$(info      build-core-containers     - Builds local x86 and arm64v8 containers for all the core-components)
	$(info |                            This command also create the multiarch Docker mainfests)
	$(info )
	$(info      publish-core              - Publish databox to dockerhub. The location can be overridden using DEFAULT_REG=[yourRegisteryName])
	$(info )
	$(info )
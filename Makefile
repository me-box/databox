.PHONY: help
help: # list targets
	@egrep "^\S+:" Makefile \
	  | grep -v '^\(.PHONY\|%\)' \
	  | sort \
	  | gawk -F"[:space:]*#[:space:]*" \
	      '{ if (length($2) != 0) printf("-- %s\n  %s\n", $$1, $$2) }'

DOCKER_CLI_EXPERIMENTAL=enabled
export DOCKER_CLI_EXPERIMENTAL

uname_M := $(shell sh -c 'uname -m 2>/dev/null || echo unset')
uname_S := $(shell sh -c 'uname -s 2>/dev/null || echo unset')

ifeq ($(uname_M),x86_64)
	HOST_ARCH = amd64
endif
ifeq ($(uname_M),aarch64)
	HOST_ARCH = arm64v8
endif
ifndef HOST_ARCH
	$(error Host architecture not suported)
endif

ifeq ($(uname_S),Linux)
	HOST_PLATFORM = Linux
endif
ifeq ($(uname_S),Darwin)
	HOST_PLATFORM = Darwin
endif
ifndef HOST_PLATFORM
	$(error Host platform not supported)
endif

ifdef ARCH
	TARGET_ARCH = -$(ARCH)
else
	TARGET_ARCH = -$(HOST_ARCH)
endif

## Docker Store account for images
DATABOX_REG ?= databoxsystems
## version used to publish
DATABOX_VERSION ?= $(shell cat Version)
DATABOX = docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock --network host \
  -t $(DATABOX_REG)/databox$(TARGET_ARCH):$(DATABOX_VERSION) /databox
DEFAULT_OPTS= \
  -app-server $(DATABOX_REG)/driver-app-store \
  -arbiter $(DATABOX_REG)/arbiter \
  -cm $(DATABOX_REG)/container-manager \
  -core-network $(DATABOX_REG)/core-network \
  -core-network-relay $(DATABOX_REG)/core-network-relay \
  -core-ui $(DATABOX_REG)/core-ui \
  -export-service $(DATABOX_REG)/export-service \
  -registry $(DATABOX_REG) \
  -release $(DATABOX_VERSION) \
  -sslHostName $(shell hostname) \
  -store $(DATABOX_REG)/core-store

##
## run targets
##
.PHONY: all
all: fetch-all build-all cli # fetch all source and build Databox

.PHONY: start
start: # start Databox
	$(DATABOX) start $(DEFAULT_OPTS) $(OPTS)

.PHONY: stop
stop: # stop Databox
	$(DATABOX) stop $(OPTS)

.PHONY: logs
logs: # view Databox logs
	bin/databox logs

.PHONY: test
test: # run Databox tests
	./databox-test "$(DATABOX)" "$(DEFAULT_OPTS)" $(HOST_ARCH) $(DATABOX_REG) $(DATABOX_VERSION)

.PHONY: clean
clean: stop # stop and remove Databox containers and images
	go clean -x
	$(RM) bin/databox

.PHONY: distclean
distclean: clean
	docker ps -a | grep $(DATABOX_REG) | cut -f 1 -d" " | xargs docker rm
	docker images -q --filter=reference='$(DATABOX_REG)/*' | xargs docker rmi -f

##
## components
##
DATABOX_CORE = \
  core-arbiter \
  core-container-manager \
  core-export-service \
  core-network \
  core-store \
  core-ui
DATABOX_APPS = \
  app-light-graph \
  app-os-monitor \
  app-twitter-sentiment
DATABOX_DRIVERS = \
  driver-app-store \
  driver-bbc-iplayer \
  driver-instagram \
  driver-os-monitor \
  driver-phillips-hue \
  driver-sensingkit \
  driver-spotify \
  driver-tplink-smart-plug \
  driver-twitter

##
## fetch source targets
##
.PHONY: fetch-all
fetch-all: fetch-core fetch-apps fetch-drivers
.PHONY: fetch-core
fetch-core: $(patsubst %,%.fetch,$(DATABOX_CORE))
.PHONY: fetch-apps
fetch-apps: $(patsubst %,%.fetch,$(DATABOX_APPS))
.PHONY: fetch-drivers
fetch-drivers: $(patsubst %,%.fetch,$(DATABOX_DRIVERS))
.PHONY: %.fetch
%.fetch:
	@echo "=== $*"
	mkdir -p build
	git -C ./build/$* pull \
	  || git clone https://github.com/me-box/$*.git ./build/$*

##
## build targets
##
.PHONY: build-all
build-all: build-core build-apps build-drivers
.PHONY: build-core
build-core: $(patsubst %,%.build,$(DATABOX_CORE))
.PHONY: build-apps
build-apps: $(patsubst %,%.build,$(DATABOX_APPS))
.PHONY: build-drivers
build-drivers: $(patsubst %,%.build,$(DATABOX_DRIVERS))
.PHONY: %.build
%.build:
	make -C ./build/$* build$(TARGET_ARCH) \
	  VERSION=$(DATABOX_VERSION) DATABOX_REG=$(DATABOX_REG)

##
## cli
##
cli: bin/databox # cli-linux-amd64 cli-linux-arm64v8
bin/databox: $(wildcard *.go)
ifeq ($(HOST_PLATFORM),Darwin)
	brew install zmq
endif
	mkdir -p ${GOPATH}/src/github.com/docker
	git -C ${GOPATH}/src/github.com/docker clone --depth 1 https://github.com/docker/docker
	go get -d -v github.com/pkg/errors
	go get -d -v golang.org/x/net/proxy
	go get -d -v ./...
	$(RM) -r ${GOPATH}/src/github.com/docker/docker/vendor/github.com/docker/go-connections > /dev/null
	go build -ldflags="-s -w" -o bin/databox *.go

.PHONY: cli-linux-%
cli-linux-%:
	docker build -t $(DATABOX_REG)/databox-$*:$(DATABOX_VERSION) \
	  -f ./Dockerfile-$* . $(OPTS)

##
## publish targets
##
.PHONY: publish-all
publish-all: publish-core publish-apps publish-drivers
.PHONY: publish-core
publish-core: $(patsubst %,%.publish,$(DATABOX_CORE))
.PHONY: publish-apps
publish-apps: $(patsubst %,%.publish,$(DATABOX_APPS))
.PHONY: publish-drivers
publish-drivers: $(patsubst %,%.publish,$(DATABOX_DRIVERS))
.PHONY: %.push
%.push:
	make -C ./build/$* publish-images
%.manifest:
	[ -d ./build/databox-manifest-store ] || make databox-manifest-store.fetch
	docker manifest create --amend $(DATABOX_REG)/$*:$(DATABOX_VERSION) \
	  $*-amd64:$(DATABOX_VERSION) $*-arm64v8:$(DATABOX_VERSION)
	docker manifest annotate $(DATABOX_REG)/$*:$(DATABOX_VERSION) \
	  $*-amd64:$(DATABOX_VERSION) --os linux --arch amd64 || true
	docker manifest annotate $(DATABOX_REG)/$*:$(DATABOX_VERSION) \
	  $*-arm64v8:$(DATABOX_VERSION) --os linux --arch arm64 || true
	docker manifest push --purge $(DATABOX_REG)/$*:$(DATABOX_VERSION)
%.publish: %.push %.manifest
	cp ./build/$*/databox-manifest.json ./build/databox-manifest-store/$*-manifest.json

.PHONY: update-store
update-store: publish-all
	:
#	git -C ./build/databox-manifest-store add -A  && git -C ./build/databox-manifest-store commit -m "Manifests updated $(shell data)"
#	git -C ./build/databox-manifest-store push origin master

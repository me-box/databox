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

.PHONY: logs
logs:
	bin/databox logs

.PHONY: test
test:
	./databox-test "$(defaultDataboxOptions)"

.PHONY: test-dev
test-dev:
	./databox-test "$(defaultDevDataboxOptions)"

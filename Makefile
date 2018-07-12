.PHONY: all
all: build build-linux-amd64 build-linux-arm64

defaultDataboxOptions=--release latest -v -arbiter toshdatabox/core-arbiter -cm toshdatabox/core-container-manager -store toshdatabox/core-store

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
	#TODO using toshdatabox/core-container-manager until the old CM is retired
	bin/databox start --release latest -v -cm toshdatabox/core-container-manager

.PHONY: startdev
startdev:
	#runing latest for local dev
	bin/databox start $(defaultDataboxOptions)

.PHONY: startlatest
startlatest:
	bin/databox start $(defaultDataboxOptions) --release latest

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
	./databox-test

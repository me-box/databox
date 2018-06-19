.PHONY: all
all: build

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

.PHONY: start
start:
	#TODO runing latest for now so that we can use core-store with zest 0.0.7
	#TODO using toshdatabox/core-container-manager until the old CM is retired
	bin/databox start --release latest -v -cm toshdatabox/core-container-manager

.PHONY: startlatest
startlatest:
	bin/databox start --release latest

.PHONY: startflushslas
startflushslas:
	bin/databox start --flushSLAs true

.PHONY: stop
stop:
	bin/databox stop

.PHONY: logs
logs:
	bin/databox logs

.PHONY: test
test:
	./databox-test

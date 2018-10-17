FROM amd64/alpine:3.8 as build
RUN apk update && apk add build-base go git libzmq zeromq-dev alpine-sdk libsodium-dev

ENV GOPATH /

RUN mkdir -p /src/github.com/docker && git -C /src/github.com/docker clone --depth 1 https://github.com/docker/docker
COPY *.go /

RUN go get -d -v ./...
RUN rm -r /src/github.com/docker/docker/vendor/github.com/docker/go-connections
RUN go get -d github.com/pkg/errors
RUN go get -d golang.org/x/net/proxy

COPY Makefile Makefile
RUN make build

FROM amd64/alpine:3.8
RUN apk update && apk add libzmq
COPY --from=build /bin/databox /databox
RUN mkdir -p /certs && mkdir -p /sdk
CMD ["/databox"]
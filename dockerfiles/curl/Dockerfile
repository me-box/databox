# A wrapper for curl used to test network connectivity and get the external IP of the databox
# in the databox-start script
FROM alpine:3.7
RUN apk add --no-cache curl
ENTRYPOINT ["/usr/bin/curl"]
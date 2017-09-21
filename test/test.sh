#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m' 
NC='\033[0m'

function fail {
    echo -e "[${RED}FAILED${NC}] ${1} \nERROR: ${2}"
    #output debug information
    docker version
    docker ps
    docker image ls 
    docker service logs databox_container-manager
    exit 1
}

function success {
    echo -e "[${GREEN}OK${NC}] $1"
}

function assert {
  if [ "$1" != "$2" ]
  then
    fail "$3" "$1"
  else
    success "$3"
  fi
}

#Start databox
export DATABOX_TESTING=1 
source ./databox-start dev

echo "Sleeping...."
sleep 30
docker ps

#can we see the CM UI
STATUS=$(curl -sL -w "%{http_code}\\n" "http://127.0.0.1:8989/" -o /dev/null)
assert $STATUS 200 "Is the Container Manager avalable?"

#is the arbitor up 
RES=$(curl -sL  "http://127.0.0.1:8989/arbiter/status")
assert "$RES" "active" "Is the Arbitor avalable?"

#is the arbitor /cat endpoint ok 
EXPECTED='{"catalogue-metadata":[{"rel":"urn:X-hypercat:rels:isContentType","val":"application/vnd.hypercat.catalogue+json"},{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox Root Catalogue"},{"rel":"urn:X-hypercat:rels:hasHomepage","val":"http://www.databoxproject.uk/"},{"rel":"urn:X-hypercat:rels:containsContentType","val":"application/vnd.hypercat.catalogue+json"},{"rel":"urn:Xhypercat:rels:supportsSearch","val":"urn:X-hypercat:search:simple"}],"items":[]}'
RES=$(curl -sL  "http://127.0.0.1:8989/arbiter/cat")
assert "$RES" "$EXPECTED" "Is the Arbitor cat endpoint is ok?"

#can we install the OS monitor driver 
PAYLOAD='{"manifest-version":1,"name":"driver-os-monitor","version":"0.1.0","description":"A Databox driver to monitor the local os","author":"Anthony Brown <Anthony.Brown@nottingham.ac.uk> ()","license":"MIT","databox-type":"driver","tags":["monitor","os"],"homepage":"https://github.com/me-box/driver-os-monitor","repository":{"type":"git","url":"git+https://github.com/me-box/driver-os-monitor.git"},"resource-requirements":{"store":"store-json"}}'
RES=$(curl -s -H 'Content-Type: application/json' -X POST -d "${PAYLOAD}" -L 'http://127.0.0.1:8989/api/install')
EXPECTED='{"status":200,"msg":"Success"}'
assert "$RES" "$EXPECTED" "Can we install the driver-os-monitor?"

#can we install the OS monitor app 
PAYLOAD='{"manifest-version":1,"name":"app-os-monitor","databox-type":"app","version":"0.1.0","description":"An app in golang to plot the output of the os monitor driver.","author":"Tosh Brown <Anthony.Brown@nottingham.ac.uk>","license":"MIT","tags":["template","app","nodejs"],"homepage":"https://github.com/me-box/app-os-monitor","repository":{"type":"git","url":"git+https://github.com/me-box/app-os-monitor"},"packages":[{"name":"OS monitor Plotter","purpose":"To visualize your databox load and free memory","install":"required","risks":"None.","benefits":"You can see the data!","datastores":["loadavg1","loadavg5","loadavg15","freemem"],"enabled":true}],"allowed-combinations":[],"datasources":[{"type":"loadavg1","required":true,"name":"loadavg1","clientid":"loadavg1","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minuet"},{"rel":"urn:X-hypercat:rels:isContentType","val":"text/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasStoreType","val":"store-json"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"https://driver-os-monitor-store-json:8080/loadavg1"}},{"type":"loadavg5","required":true,"name":"loadavg5","clientid":"loadavg5","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 5 minuets"},{"rel":"urn:X-hypercat:rels:isContentType","val":"text/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasStoreType","val":"store-json"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"https://driver-os-monitor-store-json:8080/loadavg5"}},{"type":"loadavg15","required":true,"name":"loadavg15","clientid":"loadavg15","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 15 minuets"},{"rel":"urn:X-hypercat:rels:isContentType","val":"text/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasStoreType","val":"store-json"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"https://driver-os-monitor-store-json:8080/loadavg15"}},{"type":"freemem","required":true,"name":"freemem","clientid":"freemem","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Free memory in bytes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"text/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freemem"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freemem"},{"rel":"urn:X-databox:rels:hasStoreType","val":"store-json"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"https://driver-os-monitor-store-json:8080/freemem"}}],"export-whitelist":[{"url":"https://export.amar.io/","description":"Exports the calculated sentiment to amar.io"}],"resource-requirements":{}}'
RES=$(curl -s -H 'Content-Type: application/json' -X POST -d "${PAYLOAD}" -L 'http://127.0.0.1:8989/api/install')
EXPECTED='{"status":200,"msg":"Success"}'
assert "$RES" "$EXPECTED" "Can we install the app-os-monitor?"

#is the OS monitor app up 
sleep 30
STATUS=$(curl -sL  -w "%{http_code}\\n" "http://127.0.0.1:8989/app-os-monitor/ui" -o /dev/null)
assert "$STATUS" 200 "Is the app-os-monitor/ui avalable?"

exit 0

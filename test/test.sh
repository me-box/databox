#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m' 
NC='\033[0m'

function fail {
    echo -e "[${RED}FAILED${NC}] ${1}"
    #exit 1
}

function sucsess {
    echo -e "[${GREEN}OK${NC}] $1"
}

function assert {
  if [ "$1" != "$2" ]
  then
    fail "$3"
  else
    sucsess "$3"
  fi
}

#Start databox
export DATABOX_TESTING=1 
#source ./databox-start dev 

sleep 5

#can we see the CM UI
STATUS=$(curl -sL -w "%{http_code}\\n" "http://127.0.0.1:8989/" -o /dev/null)
assert $STATUS 200 "Is the Container Manager is avalable?"

#is the arbitor up 
RES=$(curl -sL  "http://127.0.0.1:8989/arbiter/status")
assert "$RES" "active" "Is the Arbitor is avalable?"

#is the arbitor /cat endpoint ok 
EXPECTED='{"catalogue-metadata":[{"rel":"urn:X-hypercat:rels:isContentType","val":"application/vnd.hypercat.catalogue+json"},{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox Root Catalogue"},{"rel":"urn:X-hypercat:rels:hasHomepage","val":"http://www.databoxproject.uk/"},{"rel":"urn:X-hypercat:rels:containsContentType","val":"application/vnd.hypercat.catalogue+json"},{"rel":"urn:Xhypercat:rels:supportsSearch","val":"urn:X-hypercat:search:simple"}],"items":[]}'
RES=$(curl -sL  "http://127.0.0.1:8989/arbiter/cat")
assert "$RES" "$EXPECTED" "Is the Arbitor cat endpoint is ok."

exit 0

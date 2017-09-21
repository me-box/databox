#!/bin/bash

export DATABOX_TESTING=1 
source ./databox-start dev 

sleep 10

STATUS=$(curl -sL -w "%{http_code}\\n" "http://127.0.0.1:8989/" -o /dev/null)

if [ $STATUS == 200 ]
then 
    exit 0
else
    exit 1
fi

# Installing databox on Alpine linux 3.8
1) boot
2) install using setup-alpine
3) enable community repo in /etc/apk/repositories
4) update
```apk upgrade --update-cache --available```
5) install dependences
```
apk add git docker make zmq curl ca-certificates bash
rc-update add docker update
rc-service docker start
```
6) download the needed files
```
mkdir bin
curl https://raw.githubusercontent.com/Toshbrown/databox/master/bin/databox.amd64 -o ./bin/databox
curl https://raw.githubusercontent.com/Toshbrown/databox/master/Makefile -o ./Makfile
curl https://raw.githubusercontent.com/Toshbrown/databox/master/databox-test -o ./databox-test
chmod +x ./bin/databox
chmod +x ./databox-test
make startlatest
```

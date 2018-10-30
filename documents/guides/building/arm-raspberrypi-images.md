#Building container images for arm

##Building on arm
If the repo has a Dockerfile-arm file and you are building it on an arm cpu then its simple:

 1. docker build -t local/databox-arbiter-arm -f Dockerfile-arm .
 2. docker tag local/databox-arbiter-arm [your-repo-url]/databox-arbiter-arm && docker push [your-repo-url]/databox-arbiter-arm

The "-arm" on the end of the tagName is essential for the container manager to find the arm version of the contain

##Building on x86

This has not been tested but should be possable using QEMU [see](https://resin.io/blog/building-arm-containers-on-any-x86-machine-even-dockerhub/)

#Converting docker files to build arm images

Start from "FROM resin/rpi-raspbian:jessie" This will allow you to install most packages using apt-get install.

If you are downloading a specific version of some software make sure you download the arm7 binaries.

Thats it!

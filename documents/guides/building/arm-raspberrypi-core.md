# Building databox for arm/raspberry Pi

These instruction have been tested on a raspberry Pi 2 and 3.

## Setup the SD-card

 1. Download and install the latest RASPBIAN JESSIE LITE image from [here](https://www.raspberrypi.org/downloads/raspbian/)
 2. Flash to an SD-card as per the instructions for you OS [here](https://www.raspberrypi.org/documentation/installation/installing-images/README.md)
 3. Boot the pi and change the default password!


## Installing required software

 1. sudo apt-get update && sudo apt-get install git curl
 2. curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
 3. sudo apt-get install -y nodejs
 4. curl -sSL https://get.docker.com | sudo sh


## Getting the container manager

  1. git clone git@github.com:me-box/databox.git
  2. cd databox
  3. npm install --production


# Starting the container manager

   1. make sure you are in the databox directory
   2. ./startDatabox.sh

This will pull the databox-arbiter and databox_directory image and launch them on your PI

Visit http://[YOUR-PI-IP]:8080 to access the interface and install app and drivers.

## Trouble shooting

### Missing docker images

When running on an arm platform the container manager will append "-arm" to the supplied image name. Check the required arm is is available in your registry. If the Image is not available yo can find instruction on how to build then [here](./arm-raspberrypi-images.md)

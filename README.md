# Databox Container Manager
Databox OS container manager and dashboard server.

## Installation

###Linux

Install docker https://docs.docker.com/engine/installation/linux/
Install nodejs https://nodejs.org/en/download/

###OSX

Install docker https://docs.docker.com/docker-for-mac/
Install nodejs https://nodejs.org/en/download/

###Windows

Install docker https://docs.docker.com/docker-for-windows/ (The old Docker Toolbox is not supported)
Install nodejs https://nodejs.org/en/download/

###All

			git clone https://github.com/me-box/databox-container-manager.git
			cd databox-container-manager
			npm install --production

To update your hosts file with arbiter and registry IP, run the following with root permissions:

			npm run sethosts

## Usage

In production mode (remote docker registery and remote app store)

	npm start

In development (local docker registery and local App store)

    DATABOX_DEV=1 npm start
	Note: in dev mode some extra configuration is required. Follow the on screen instructions.  

Default port is 8989, but can be overridden using the PORT environment variable, i.e.:

	PORT=8081 npm start

Then browse to http://localhost:8989/.

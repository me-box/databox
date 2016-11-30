# Databox Container Manager
Databox OS container manager and dashboard server.

## Installation

###Linux
    Install docker https://docs.docker.com/engine/installation/linux/
		Install nodejs https://nodejs.org/en/download/

		For now the arbier IP must be in you hosts file

	  echo "172.17.0.2     databox-arbiter" | sudo tee -a /etc/hosts

###OSX
    Install docker https://docs.docker.com/docker-for-mac/
		Install nodejs https://nodejs.org/en/download/

		For now the arbier IP must be in you hosts file

    edit /private/etc/hosts and add 172.17.0.2 databox-arbiter

###Windows
		Install docker https://docs.docker.com/docker-for-windows/ (The old Docker Toolbox is not supported)
		Install nodejs https://nodejs.org/en/download/

		For now the arbier IP must be in you hosts file

	  edit :\Windows\System32\Drivers\etc\hosts and add 172.17.0.2 databox-arbiter

###All

     git clone https://github.com/me-box/databox-container-manager.git
	   cd databox-container-manager
	   npm install --production


## Usage
	npm start

Default port is 8080, but can be overridden using the PORT environment variable, i.e.:

	PORT=8081 npm start

Then browse to http://localhost:8080/.

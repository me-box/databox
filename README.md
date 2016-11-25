# Databox Container Manager
Databox OS container manager and dashboard server.

## Installation
	git clone https://github.com/me-box/databox-container-manager.git
	cd databox-container-manager
	npm install --production

	For now the arbier IP must be in you /etc/hosts file

	echo "172.17.0.2     databox-arbiter" | sudo tee -a /etc/hosts

## Usage
	npm start

Default port is 8080, but can be overridden using the PORT environment variable, i.e.:

	PORT=8081 npm start

Then browse to http://localhost:8080/.

# Databox Container Manager
Databox OS container manager and dashboard server.

## Installation
	git clone https://github.com/me-box/databox-container-manager.git
	cd databox-container-manager
	npm install --production

## Usage
	npm start

Default port is 8080, but can be overridden using the PORT environment variable, i.e.:

	PORT=8081 npm start

Then browse to http://localhost:8080/.

### Evaluations

To make things easier, install LiveScript globally.

	npm install -g livescript

If you don't want to do that, replace `lsc` with `./node_modules/livescript/bin/lsc`.

To run an experiment:

	lsc src/[experiment].ls

where [experiment] is (test1|triplets|stores|arbiter|apps).

Thorough documentation and unit tests coming soon.

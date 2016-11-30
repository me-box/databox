/*jshint esversion: 6 */

var conman = require('./container-manager.js');
var Config = require('./config.json');
var server = require('./server.js');

var httpsHelper = require('./include/containter-manger-https-helper');

httpsHelper.init()
	.then(cert => {
		conman.setHttpsHelper(httpsHelper);
		return conman.connect();
	})
	.then(data => {
		return conman.killAll(data);
	})

	.then(() => {
		return conman.initNetworks();
	})

	.then(() => {
		console.log('[databox-arbiter] Launching');
		return conman.launchArbiter(httpsHelper);
	})
	
	/*.then(info => {
		server.proxies[info.name] = 'localhost:' + info.port;

		console.log('[databox-notification] Launching');
		return conman.launchNotifications(httpsHelper);
	})*/
	.then(info => {
		server.proxies[info.name] = 'localhost:' + info.port;

		console.log("Starting UI Server!!");
		return server.launch(Config.serverPort, conman);
	})
	.then(() => {
		console.log("--------- Launching saved containers ----------");
		return conman.getActiveSLAs();
	})
	.then(slas => {
		return conman.restoreContainers(slas, httpsHelper);
	})
	.then(infos => {
		for (var containers of infos) {
			for (var container of containers) {
				server.proxies[container.name] = 'localhost:' + container.port;
			}
		}

		console.log("--------- Done launching saved containers ----------");
		console.log("Databox UI can be assessed at http://127.0.0.1:"+Config.serverPort);
	})
	.catch(err => {
		console.log('ERROR ENDS UP HERE');
		console.log(err);
		var stack = new Error().stack;
		console.log(stack);
	});

var app = server.app;
module.exports = app;

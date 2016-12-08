/*jshint esversion: 6 */

var conman = require('./container-manager.js');
var Config = require('./config.json');
var server = require('./server.js');
var fs = require('fs');
var httpsHelper = require('./include/containter-manger-https-helper');

var DATABOX_DEV = process.env.DATABOX_DEV

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
		if(DATABOX_DEV) {
			const devSeedScript = './updateLocalRegistey.sh';
			console.log('['+Config.localRegistryName+'] updating ' + devSeedScript);
			var script = "";
			for(img of Config.localRegistrySeedImages) {
				script += "docker pull toshdatabox/"+img+" && docker tag toshdatabox/"+img+" databox.registry:5000/"+img+" && docker push databox.registry:5000/"+img+"\n";
			}
			fs.writeFileSync(devSeedScript, script);

			console.log('['+Config.localRegistryName+'] Launching');
			
			//launch in-order to preserve IPs
			conman.launchLocalRegistry()
			.then(() => {
				console.log('['+Config.localAppStoreName+'] Launching');
				return conman.launchLocalAppStore();
			});			
		}
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
		return server.launch(Config.serverPort, conman, httpsHelper);
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
		console.log("Databox UI can be accessed at http://127.0.0.1:"+Config.serverPort);
	})
	.catch(err => {
		console.log(err);
		var stack = new Error().stack;
		console.log(stack);
	});

var app = server.app;
module.exports = app;

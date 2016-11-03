var conman = require('./container-manager.js');
var Config = require('./config.json');
var server = require('./server.js');


conman.connect()
	.then(data => {
		return conman.killAll(data)
	})

	.then(() => {
		return conman.initNetworks()
	})

	.then(() => {
		console.log('[databox-arbiter] Launching');
		return conman.launchArbiter();
	})

	.then(info => {
		server.proxies[info.name] = 'localhost:' + info.port;

		console.log('[databox-directory] Launching');
		return conman.launchDirectory();
	})
	
	.then(info => {
		server.proxies[info.name] = 'localhost:' + info.port;

		console.log('[databox-notification] Launching');
		return conman.launchNotifications();
	})
	.then(info => {
		server.proxies[info.name] = 'localhost:' + info.port;

		console.log("Starting Server!!");
		return server.launch(Config.serverPort, conman);
	})
	.then(() => {
		console.log("--------- Launching saved containers ----------");
		return conman.getActiveSLAs();
	})
	.then(slas => {
		return conman.restoreContainers(slas);
	})
	.then(infos => {
		for (var containers of infos) {
			for (var container of containers) {
				server.proxies[container.name] = 'localhost:' + container.port;
			}
		}

		console.log("--------- Done launching saved containers ----------")
	})
	.catch(err => {
		console.log('ERROR ENDS UP HERE');
		console.log(err);
		var stack = new Error().stack;
		console.log(stack);
	});
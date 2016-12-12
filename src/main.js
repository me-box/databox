/*jshint esversion: 6 */

var conman = require('./container-manager.js');
var Config = require('./config.json');
var fs = require('fs');
var httpsHelper = require('./include/containter-manger-https-helper');
var DATABOX_DEV = process.env.DATABOX_DEV
var request = require('request');

var containerMangerUIServer = null;

httpsHelper.init()
	.then(cert => {
		
		//Put the CA pubic key into this processes env var so lib that work in containers also work in the CM
		process.env['CM_HTTPS_CA_ROOT_CERT'] = httpsHelper.getRootCert();

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
			const devSeedScript = './updateLocalRegistry.sh';
			console.log('['+Config.localRegistryName+'] updating ' + devSeedScript);
			var script = "";
			for(img of Config.localRegistrySeedImages) {
				script += "docker pull toshdatabox/"+img+" && docker tag toshdatabox/"+img+" databox.registry:5000/"+img+" && docker push databox.registry:5000/"+img+"\n";
			}
			fs.writeFileSync(devSeedScript, script);

			console.log('['+Config.localRegistryName+'] Launching');
			
			//launch in-order to preserve IPs
			return conman.launchLocalRegistry();
						
		}
	})

	.then(() => {
		console.log('[databox-arbiter] Launching');
		return conman.launchArbiter(httpsHelper);
	})
	
	.then(info => {

		//set env vars in this process so lib that work in containers also work in the CM 
		process.env['DATABOX_ARBITER_ENDPOINT'] = 'https://' + info.name + ':' + info.port;
		process.env['ARBITER_TOKEN'] = info.CM_KEY;
		process.env['CM_KEY'] = info.CM_KEY;

		//require here so env vars are set!
		containerMangerUIServer = require('./server.js');

		//set up the arbitor proxy
		containerMangerUIServer.proxies[info.name] = info.name + ':' + info.port;
		
	})
	
	.then(() => {
		if(DATABOX_DEV) {
			//launch in-order to preserve IPs
			console.log('['+Config.localAppStoreName+'] Launching');
			return conman.launchLocalAppStore();
		}
	})

	.then(()=>{
		if(DATABOX_DEV) {
			proms = Config.localAppStoreSeedManifests.map((url)=>{
				return new Promise(function(resolve, reject) {
					request.get(url,(error,response,body)=>{
						if(error) {
							console.log("[seeding manifest] Failed to get manifest from" + url, error);
						}
						request.post({
							uri: Config.storeUrl_dev + "/app/post",
							method: "POST",
							form: {"manifest": body}
						}, (error,response,body) => {
							if(error) {
								console.log("[seeding manifest] Failed to POST manifest " + url, error);
							} else {
								console.log("[seeding manifest]" + url + " SUCCESS ");
								resolve();
							}
						});
					});
				});
			});
			return Promise.all(proms);
		}
	})

	.then(()=>{
		//start the CM UI
		console.log("Starting UI Server!!");
		return containerMangerUIServer.launch(Config.serverPort, conman, httpsHelper);
	})
	/*.then(info => {
		containerMangerUIServer.proxies[info.name] = container.name+':' + info.port;

		console.log('[databox-notification] Launching');
		return conman.launchNotifications(httpsHelper);
	})*/
	.then(() => {
		console.log("--------- Launching saved containers ----------");
		return conman.getActiveSLAs();
	})
	.then(slas => {
		return conman.restoreContainers(slas, httpsHelper);
	})
	.then(infos => {
		console.log(infos);
		for (var containers of infos) {
			for (var container of containers) {
				containerMangerUIServer.proxies[container.name] = container.name+':' + container.port;
			}
		}

		console.log("--------- Done launching saved containers ----------");
		console.log("Databox UI can be accessed at http://127.0.0.1:"+Config.serverPort);
	})
	.then(()=>{

		var app = containerMangerUIServer.app;
		module.exports = app;

	})
	.catch(err => {
		console.log(err);
		var stack = new Error().stack;
		console.log(stack);
	});


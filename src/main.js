/*jshint esversion: 6 */

process.setMaxListeners(200);

const conman = require('./container-manager.js');
const Config = require('./config.json');
const httpsHelper = require('./include/container-manger-https-helper');
const DATABOX_DEV = process.env.DATABOX_DEV
const request = require('request');

var containerMangerUIServer = null;

httpsHelper.init()
	.then(() => {
		
		//Put the CA pubic key into this processes env var so libs that work in containers also work in the CM
		process.env['CM_HTTPS_CA_ROOT_CERT'] = httpsHelper.getRootCert();

		conman.setHttpsHelper(httpsHelper);
		return conman.connect();
	})
	
	.then(() => {
		return conman.killAll();
	})

	.then(() => {
		return conman.initNetworks();
	})

	// Connect self to CM-Arbiter network
	.then(() => {
		return conman.getOwnContainer();
	})
	.then((containerManagerContainer) => {
		containerManagerContainer.name="databox-cm";
		return conman.connectToCMArbiterNetwork(containerManagerContainer);
	})
	.then(() => {
		if(DATABOX_DEV) {
			console.log('['+Config.localRegistryName+'] Launching');
			return conman.launchLocalRegistry();		
		}
	})
	.then(() => {
		if(DATABOX_DEV) {

			proms = Config.localRegistrySeedImages.map((img)=>{
				return conman.updateSeedImage('databoxsystems',img,Config.registryUrl);
			});

			return Promise.all(proms);
		}

	})
	.then(() => {
		console.log('[databox-arbiter] Launching');
		return conman.launchArbiter(httpsHelper);
	})
	
	.then(info => {

		//set env vars in this process so libs that work in containers also work in the CM 
		process.env['DATABOX_ARBITER_ENDPOINT'] = 'https://' + info.name + ':' + info.port;
		process.env['ARBITER_TOKEN'] = info.CM_KEY;
		process.env['CM_KEY'] = info.CM_KEY;

		//require here so env vars are set!
		containerMangerUIServer = require('./server.js');

		//set up the arbiter proxy
		containerMangerUIServer.proxies[info.name] = info.name + ':' + info.port;

		//register the CM for token minting
		console.log('[databox-container-manager] Passing token to Arbiter');
		const update = {name: 'databox-container-manager', key: info.CM_KEY, type: 'CM'};
		return conman.updateArbiter(update);
		
	})
	
	.then(()=>{
		//launch databox components 
		let proms = [conman.launchLogStore(),conman.launchExportService()];
		if(DATABOX_DEV) {
			console.log('['+Config.localAppStoreName+'] Launching');
			proms.push(conman.launchLocalAppStore());
		}
		return Promise.all(proms);
	})
	
	.then(()=>{
		if(DATABOX_DEV) {
			const req = request.defaults({jar: true});
			req.get("http://" + Config.localAppStoreName + ":8181/",(error,response,body)=>{
				if(error) {
					console.log("[seeding manifest] get app store root to log in", error);
					return Promise.reject();
				}
				proms = Config.localAppStoreSeedManifests.map((url)=>{
					return new Promise(function(resolve, reject) {
						req.get(url,(error,response,body)=>{
							if(error) {
								console.log("[seeding manifest] Failed to get manifest from" + url, error);
							}
							req.post({
									uri: "http://" + Config.localAppStoreName + ":8181/app/post",
									method: "POST",
									form: {"manifest": body}
									}, (error,response,body) => {
										if(error) {
											console.log("[seeding manifest] Failed to POST manifest " + url, error);
										} 
										resolve();
									});
						});
					});
				});
				return Promise.all(proms);
			});
		}
	})

	.then(()=>{
		//start the CM UI
		console.log("Starting UI Server!!");
		return containerMangerUIServer.launch(Config.serverPort, conman, httpsHelper);
	})
	
	.then(() => {
		console.log("--------- Launching saved containers ----------");
		return conman.getActiveSLAs();
	})

	.then(slas => {
		return conman.restoreContainers(slas, httpsHelper);
	})

	.then(infos => {
		for (const containers of infos) {
			for (const container of containers) {
				containerMangerUIServer.proxies[container.name] = container.name+':' + container.port;
			}
		}

		console.log("--------- Done launching saved containers ----------");
		console.log("Databox UI can be accessed at http://127.0.0.1:"+Config.serverPort);
	})

	.then(()=>{
		const app = containerMangerUIServer.app;
		module.exports = app;
	})

	.catch(err => {
		console.log(err);
		const stack = new Error().stack;
		console.log(stack);
	});


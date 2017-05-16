/*jshint esversion: 6 */

const conman = require('./container-manager.js');
const Config = require('./config.json');
const httpsHelper = require('./include/container-manger-https-helper');

var containerMangerUIServer = null;

httpsHelper.init()
	.then(() => {
		
		conman.setHttpsHelper(httpsHelper);
		return conman.connect();
	})
	
	.then(() => {

		//require here so env vars are set!
		containerMangerUIServer = require('./server.js');
		//set up the arbiter proxy
		containerMangerUIServer.proxies['databox-arbiter'] = 'databox-arbiter:8080';

		console.log("Starting UI Server!!");
		return containerMangerUIServer.launch(Config.serverPort, conman, httpsHelper);
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


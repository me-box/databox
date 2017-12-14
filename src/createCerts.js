process.setMaxListeners(200);

const conman = require('./container-manager.js');
const Config = require('./config.json');
const httpsHelper = require('./https-helper');

httpsHelper.init()
	.then(() => {
		let proms = Config.requiredArbiterSecrets.map((name) => {
			return conman.generateArbiterToken(name);
		});

		proms = proms.concat(Config.requiredHTTPSecrets.map((name) => {
			return httpsHelper.createClientCert(name);
		}));

		const ips = process.argv.slice(2);
		if (ips.indexOf('127.0.0.1') === -1) {
			ips.push('127.0.0.1');
		}
		proms.push(httpsHelper.createClientCert('container-manager', ips));
		proms.push(httpsHelper.createClientCert('app-server', ips));

		return Promise.all(proms);
	})
	.then(() => {
		console.log("Done!");
	})
	.catch(err => {
		console.log(err);
		const stack = new Error().stack;
		console.log(stack);
	});

process.setMaxListeners(200);

const conman = require('./container-manager.js');
const Config = require('./config.json');
const QRCode = require('qrcode');
const httpsHelper = require('./https-helper');
const crypto = require('crypto');
const fs = require('fs');


httpsHelper.init()
	.then(() => {
		let proms = Config.requiredArbiterSecrets.map((name) => {
			return conman.generateArbiterToken(name);
		});

		proms = proms.concat(Config.requiredHTTPSecrets.map((name) => {
			return httpsHelper.createClientCert(name);
		}));

		const ips = process.argv.slice(3);
		if (ips.indexOf('127.0.0.1') === -1) {
			ips.push('127.0.0.1');
		}
		proms.push(httpsHelper.createClientCert('container-manager', ips));
		proms.push(httpsHelper.createClientCert('app-server', ips));

		let createToken = true;
		try {
			const content = fs.readFileSync('certs/container-mananager-auth.json');
			const authToken = JSON.parse(content);
			if (authToken.ip === process.argv[2]) {
				createToken = false;
			}
		} catch(e) {
			createToken = true;
		}
		if (createToken) {
			const token = crypto.randomBytes(24).toString('base64');
			const auth = {
				ip: process.argv[2],
				token: token
			};
			const auth_str = JSON.stringify(auth);

			proms.push(QRCode.toFile('certs/qrcode.png', auth_str, {}));

			proms.push(new Promise((resolve, reject) => {
				fs.writeFile('certs/container-mananager-auth.json', auth_str, function (err) {
					if (err) reject(err);
					else resolve();
				});
			}));
		}

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

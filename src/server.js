/*jshint esversion: 6 */

const Config = require('./config.json');
//setup dev env 
const DATABOX_DEV = process.env.DATABOX_DEV === '1';
if (DATABOX_DEV) {
	Config.registryUrl = Config.registryUrl_dev;
	Config.storeUrl = Config.storeUrl_dev;
}

const DATABOX_SDK = process.env.DATABOX_SDK === '1';
if (DATABOX_SDK) {
	Config.registryUrl = Config.registryUrl_sdk;
	Config.storeUrl = Config.storeUrl_sdk;
}

const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const databoxRequestPromise = require('./lib/databox-request-promise.js');
const databoxAgent = require('./lib/databox-https-agent.js');
let io = require('socket.io');
const url = require('url');

const app = express();

module.exports = {
	proxies: {},
	app: app,
	launch: function (port, conman, httpsHelper) {

		const server = http.createServer(app);
		const installingApps = {};
		io = io(server, {});

		if (DATABOX_DEV) {
			this.proxies.store = "http://" + Config.localAppStoreName + ":8181";
		} else {
			this.proxies.store = Config.storeUrl;
		}

		app.enable('trust proxy');
		app.set('views', 'src/www');
		app.set('view engine', 'pug');
		app.use(express.static('src/www'));

		app.use((req, res, next) => {
			const firstPart = req.path.split('/')[1];
			if (firstPart in this.proxies) {
				const replacement = this.proxies[firstPart];
				let proxyURL;
				if (replacement.indexOf('://') !== -1) {
					const parts = url.parse(replacement);
					parts.pathname = req.baseUrl + req.path.substring(firstPart.length + 1);
					parts.query = req.query;
					proxyURL = url.format(parts);
				}
				else {
					proxyURL = url.format({
						protocol: 'https',
						host: replacement,
						pathname: req.baseUrl + req.path.substring(firstPart.length + 1),
						query: req.query
					});
				}

				console.log("[Proxy] " + req.method + ": " + req.url + " => " + proxyURL);
				databoxRequestPromise({uri: proxyURL})
					.then((resolvedRequest) => {

						return req.pipe(resolvedRequest)
							.on('error', (e) => {
								console.log('[Proxy] ERROR: ' + req.url + " " + e.message);
							})
							.pipe(res)
							.on('error', (e) => {
								console.log('[Proxy] ERROR: ' + req.url + " " + e.message);
							})
							.on('end', () => {
								next();
							});
					});

			} else {
				next();
			}
		});

		// Needs to be after the proxy
		app.use(bodyParser.urlencoded({extended: false}));

		app.get('/', (req, res) => {
			res.render('index');
		});
		app.get('/install/:appname', (req, res) => {
			res.render('install', {appname: req.params.appname})
		});

		app.get('/ui/:containerName', (req, res) => {
			let containerName = req.params.containerName;
			conman.listContainers()
				.then((containers) => {
					return new Promise((resolve, reject) => {
						for (const container of containers) {
							const name = container.Names[0].substr(1);
							if (name === containerName) {
								resolve({
									name: name,
									container_id: container.Id,
									type: container.Labels['databox.type'] === undefined ? 'app' : container.Labels['databox.type'],
									status: container.State
								});
								return;
							}
						}
						reject("[Error] " + containerName + " not found.");
					});
				})
				.then((containerInfo) => {
					let path = '/ui';
					if (containerInfo.type === 'store') {
						path = '/cat';
					}
					res.render('ui', {appname: containerInfo.name, path: path});
				})
				.catch((error) => {
					res.render('ui', {error: error});
				});

		});

		app.get('/list-apps', (req, res) => {
			let names = [];
			let result = [];

			conman.listContainers()
				.then((containers) => {
					for (let container of containers) {
						let name = container.Names[0].substr(1);
						names.push(name);
						result.push({
							name: name,
							container_id: container.Id,
							type: container.Labels['databox.type'] === undefined ? 'app' : container.Labels['databox.type'],
							status: container.State
						});
					}

					for (let installingApp in installingApps) {
						if (names.indexOf(installingApp) === -1) {
							names.push(installingApp);
							result.push({
								name: installingApp,
								type: installingApps[installingApp],
								status: 'installing'
							});
						}
					}

					const options = {'url': '', 'method': 'GET'};
					if (DATABOX_DEV) {
						options.url = "http://" + Config.localAppStoreName + ":8181" + '/app/list';
					} else {
						options.url = Config.storeUrl + '/app/list';
					}
					return new Promise((resolve, reject) => {
						request(options, (error, response, body) => {
							if (error) {
								console.log("Error: " + options.url);
								reject(error);
								return;
							}

							resolve(JSON.parse(body).apps);
						});

					});
				})
				.then((apps) => {
					for (let app of apps) {
						if (names.indexOf(app.manifest.name) === -1) {
							names.push(app.manifest.name);
							result.push({
								name: app.manifest.name,
								type: app.manifest['databox-type'] === undefined ? 'app' : app.manifest['databox-type'],
								status: 'uninstalled',
								author: app.manifest.author
							});
						}
					}

					res.json(result);
				})
				.catch((err) => {
					console.log("[Error] ", err);
					res.json(err);
				});

		});

		app.post('/install', (req, res) => {
			const sla = JSON.parse(req.body.sla);
			installingApps[sla.name] = sla['databox-type'] === undefined ? 'app' : sla['databox-type'];

			io.emit('docker-create', sla.name);
			conman.launchContainer(sla)
				.then((containers) => {
					console.log('[' + sla.name + '] Installed');
					for (const container of containers) {

						delete installingApps[sla.name];
						this.proxies[container.name] = container.name + ':' + container.port;
					}

					res.json(containers);
				})
				.then(() => {
					return conman.saveSLA(sla);
				});
		});

		app.post('/restart', (req, res) => {
			//console.log("Restarting " + req.body.id);
			conman.getContainer(req.body.id)
				.then((container) => {
					return conman.stopContainer(container);
				})
				.then((container) => {
					return conman.startContainer(container);
				})
				.then((container) => {
					console.log('[' + container.name + '] Restarted');
					this.proxies[container.name] = container.name + ':' + container.port;
				})
				.catch((err) => {
					console.log(err);
					res.json(err);
				});
		});


		app.post('/uninstall', (req, res) => {
			//console.log("Uninstalling " + req.body.id);
			conman.getContainer(req.body.id)
				.then((container) => {
					return conman.stopContainer(container);
				})
				.then((container) => {
					return conman.removeContainer(container);
				})
				.then((info) => {
					let name = info.Name;
					if (info.Name.startsWith('/')) {
						name = info.Name.substring(1);
					}
					console.log('[' + name + '] Uninstalled');
					delete this.proxies[name];
					res.json(info);
				})
				.catch((err) => {
					console.log(err);
					res.json(err)
				});
		});

		io.on('connection', (socket) => {
			const emitter = conman.getDockerEmitter();

			emitter.on("connect", () => {
				socket.emit('docker-connect');
			});
			emitter.on("disconnect", () => {
				socket.emit('docker-disconnect');
			});
			emitter.on("_message", (message) => {
				socket.emit('docker-_message', message);
			});
			emitter.on("create", (message) => {
				socket.emit('docker-create', message);
			});
			emitter.on("start", (message) => {
				socket.emit('docker-star', message);
			});
			emitter.on("start", (message) => {
				socket.emit('docker-stop', message);
			});
			emitter.on("die", (message) => {
				socket.emit('docker-die', message);
			});
			emitter.on("destroy", (message) => {
				socket.emit('docker-destroy', message);
			});
			emitter.start();

		});

		server.listen(port);
	}
};

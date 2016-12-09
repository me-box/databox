var Config = require('./config.json');
var http = require('http');
var https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var io = require('socket.io');
var url = require('url');

var app = express();

//
// The  container manager can't always access or resolve containers by hostname.
// This catches any resolve errors and points them at 127.0.0.1.
// It it enables the  container manager UI to proxy over https to any docker container
// along as it knows the docker assigned port that the service is running on. 
// N.B this effects all dns lookups by the container manager!!
var dns = require('dns');
var origLookup = dns.lookup
dns.lookup = function (domain, options, callback) {
	origLookup(domain, options, function(err, address, family){
		if(err) {
			console.log("[DNS Intercepted] for " + domain + " returning 127.0.0.1");
			callback(null, '127.0.0.1', 4);
		} else {
			callback(err, address, family);
		}
	});
};

module.exports = {
	proxies: {},
	app: app,
	launch: function (port, conman, httpsHelper) {
		
		//A https agent that trusts the CM
		var agentOptions = {
			ca: httpsHelper.getRootCert()
		};
		var databoxAgent = new https.Agent(agentOptions);
		
		var server = http.createServer(app);
		var installingApps = {};
		io = io(server, {});

		this.proxies['store'] = Config.storeUrl;

		app.enable('trust proxy');
		app.set('views', 'src/www');
		app.set('view engine', 'pug');
		app.use(express.static('src/www'));

		app.use((req, res, next) => {
			var firstPart = req.path.split('/')[1];
			if (firstPart in this.proxies) {
				var replacement = this.proxies[firstPart];
				var proxyURL;
				if (replacement.indexOf('://') != -1) {
					var parts = url.parse(replacement);
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
				return req
					.pipe(request({
						uri:proxyURL,
						'method':'GET', 
						'agent':databoxAgent, 
						'headers': {
							'x-api-key': conman.arbiterKey
						}
					}))
					.on('error', (e) => {
						console.log('[Proxy] ERROR: ' + req.url + " " + e.message);
					})
					.pipe(res)
					.on('error', (e) => {
						console.log('[Proxy] ERROR: ' + req.url + " " + e.message);
					});
			}
			next();
		});

		// Needs to be after the proxy
		app.use(bodyParser.urlencoded({extended: false}));

		app.get('/', (req, res) => {
			res.render('index')
		});
		app.get('/install/:appname', (req, res) => {
			res.render('install', {appname: req.params.appname})
		});
		app.get('/ui/:appname', (req, res) => {
			res.render('ui', {appname: req.params.appname})
		});

		app.get('/list-apps', (req, res) => {
			var names = [];
			var result = [];
			conman.listContainers()
				.then((containers) => {
					for (var container of containers) {
						var name = container.Names[0].substr(1);
						names.push(name);
						result.push({
							name: name,
							container_id: container.Id,
							type: container.Labels['databox.type'] === undefined ? 'app' : container.Labels['databox.type'],
							status: container.State
						});
					}

					for (var installingApp in installingApps) {
						if (names.indexOf(installingApp) === -1) {
							names.push(installingApp);
							result.push({
								name: installingApp,
								type: installingApps[installingApp],
								status: 'installing'
							});
						}
					}

					request({'url':"https://" + Config.registryUrl + "/v2/_catalog", 'method':'GET', 'agent':databoxAgent}, (error, response, body) => {
						if (error) {
							res.json(error);
							return
						}
						var repositories = JSON.parse(body).repositories;
						var repocount = repositories.length;
						repositories.map((repo) => {
							if (names.indexOf(repo) != -1) {
								repocount--;
							}
							else {
								request.post({
									'url': Config.storeUrl + '/app/get/',
									'form': {'name': repo}
								}, (err, data) => {

									if (err) {
										//do nothing
										return;
									}

									body = JSON.parse(data.body);
									if (typeof body.error == 'undefined' || body.error != 23) {
										result.push({
											name: body.manifest.name,
											type: body.manifest['databox-type'] === undefined ? 'app' : body.manifest['databox-type'],
											status: 'uninstalled',
											author: body.manifest.author
										});
									}
									repocount--;
									if (repocount <= 0) {
										res.json(result);
									}
								});
							}
						});
					});
				});
		});

		app.post('/install', (req, res) => {
			var sla = JSON.parse(req.body.sla);
			installingApps[sla.name] = sla['databox-type'] === undefined ? 'app' : sla['databox-type'];

			io.emit('docker-create', sla.name);
			conman.launchContainer(sla)
				.then((containers) => {
					console.log('[' + sla.name + '] Installed');
					for (var container of containers) {

						delete installingApps[container.name];
						this.proxies[container.name] = 'localhost:' + container.port;
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
					return conman.stopContainer(container)
				})
				.then((container) => {
					return conman.startContainer(container)
				})
				.then((container) => {
					console.log('[' + container.name + '] Restarted');
					this.proxies[container.name] = 'localhost:' + container.port;
				})
				.catch((err)=> {
					console.log(err);
					res.json(err);
				})
		});


		app.post('/uninstall', (req, res) => {
			//console.log("Uninstalling " + req.body.id);
			conman.getContainer(req.body.id)
				.then((container)=> {
					return conman.stopContainer(container)
				})
				.then((container)=> {
					return conman.removeContainer(container)
				})
				.then((info)=> {
					var name = info.Name;
					if (info.Name.startsWith('/')) {
						name = info.Name.substring(1);
					}
					console.log('[' + name + '] Uninstalled');
					delete this.proxies[name];
					res.json(info);
				})
				.catch((err)=> {
					console.log(err);
					res.json(err)
				});
		});

		io.on('connection', (socket) => {
			var emitter = conman.getDockerEmitter();

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

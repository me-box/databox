var Config = require('./config.json');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var io = require('socket.io');
var url = require('url');

var app = express();

module.exports = {
	proxies: {},
	launch: function (port, conman) {
		var server = http.createServer(app);
		var installingApps = [];
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
						protocol: req.protocol,
						host: replacement,
						pathname: req.baseUrl + req.path.substring(firstPart.length + 1),
						query: req.query
					});
				}

				console.log("[Proxy] " + req.method + ": " + req.url + " => " + proxyURL);
				return req
					.pipe(request(proxyURL))
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
			var appname = req.params.appname;
			res.render('install', {appname: appname})
		});
		app.get('/ui/:appname', (req, res) => {
			var appname = req.params.appname;
			res.render('ui', {appname: appname})
		});


		app.get('/list-containers', (req, res) => {
			conman.listContainers()
				.then((containers) => {
					for (var installingApp of installingApps) {
						var appName = '/' + installingApp;
						var found = false;
						for (var installedApp of containers) {
							if (installedApp.Names.indexOf(appName) != -1) {
								found = true;
							}
						}
						if (!found) {
							containers.push({Names: [appName], State: "installing"});
						}
					}
					res.json(containers);
				});
			//.catch()
		});

		app.get('/list-store', (req, res) => {
			conman.listContainers()
				.then((containers) => {
					request('https://' + Config.registryUrl + '/v2/_catalog', (error, response, body) => {
						if (error) {
							res.json(error);
							return
						}
						var repositories = JSON.parse(body).repositories;
						var repocount = repositories.length;
						var manifests = [];

						repositories.map((repo) => {
							console.log(repo);
							if (installingApps.indexOf(repo) != -1) {
								repocount--;
							}
							else {
								var found = false;
								for(var container of containers) {
									if(container.Names.indexOf('/' + repo) != -1) {
										repocount--;
										found = true;
										break;
									}
								}
								if(!found) {
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
											manifests.push(body);
										}
										repocount--;
										if (repocount <= 0) {
											res.json(manifests);
										}
									});
								}
							}
						});
					});
				});
		});

		app.post('/install', (req, res) => {
			var sla = JSON.parse(req.body.sla);
			installingApps.push(sla.name);

			io.emit('docker-create', sla.name);
			conman.launchContainer(sla)
				.then((containers) => {
					console.log('[' + sla.name + '] Installed');
					for (var container of containers) {
						var index = installingApps.indexOf(container.name);
						if (index != -1) {
							installingApps.splice(index, 1)
						}
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

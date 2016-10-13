var Promise = require('promise');
var Config = require('./config.json');
var ursa = require('ursa');
var os = require('os');
var crypto = require('crypto');
var request = require('request');

var db = require('./include/container-manager-db.js');
var dockerHelper = require('./include/container-manager-docker-helper.js');

var docker = dockerHelper.getDocker();

var ip = '127.0.0.1';

//ARCH to append -amd to the end of a container name if running on arm
var ARCH = '';
if (process.arch == 'arm') {
	ARCH = '-arm';
}


exports.connect = function () {
	return new Promise((resolve, reject) => docker.ping(function (err, data) {
		if (err) reject("Cant connect to docker!");
		resolve();
	}));
};

exports.getDockerEmitter = function () {
	return dockerHelper.getDockerEmitter();
};

var listContainers = function () {
	return new Promise((resolve, reject) => {
		docker.listContainers({all: true, filters: {"label": ["databox.type"]}},
			(err, containers) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(containers);
			}
		);

	});
};
exports.listContainers = listContainers;


exports.killAll = function () {
	return new Promise((resolve, reject) => {
		listContainers()
			.then(containers => {
				ids = [];
				for (var container of containers) {
					var name = repoTagToName(container.Image);
					console.log('[' + name + '] Uninstalling');
					ids.push(dockerHelper.kill(container.Id));
					ids.push(dockerHelper.remove(container.Id));
				}
				return Promise.all(ids);
			})
			.then((data) => {
				resolve()
			})
			.catch(err => {
				consol.log("[killAll-2]" + err);
				reject(err)
			})
	});
};

var getContainer = function (id) {
	return new Promise((resolve, reject) => {
		resolve(docker.getContainer(id));
	});
};
exports.getContainer = getContainer;

exports.initNetworks = function () {
	return new Promise((resolve, reject) => {
		console.log('Creating Networks');
		dockerHelper.listNetworks()
			.then(networks => {
				var requiredNets = [
					dockerHelper.getNetwork(networks, 'databox-driver-net'),
					dockerHelper.getNetwork(networks, 'databox-app-net')
				];

				return Promise.all(requiredNets)
					.then((networks) => {
						console.log("Networks already exist");
						//console.log(networks);
						resolve(networks);
					})
					.catch(err => {
						console.log("initNetworks::" + err);
						reject(err);
					})

			})
			.then((networks) => {
				resolve(networks)
			});
	})
		.catch(err => reject(err))
};


var pullImage = function (imageName) {
	return new Promise((resolve, reject) => {
		//Pull latest Arbiter image
		var parts = imageName.split(':');
		var name = parts[0];
		var version = parts[1];
		console.log('[' + name + '] Pulling ' + version + ' image');
		docker.pull(Config.registryUrl + "/" + imageName, (err, stream) => {
			if (err) {
				reject(err);
				return;
			}

			stream.pipe(process.stdout);
			docker.modem.followProgress(stream, (err, output) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(";->");
			});
		})
	});
};
exports.pullImage = pullImage;

var keyPair = null;
var generatingCMkeyPair = function () {
	return new Promise((resolve, reject) => {
		//Generating CM Key Pair
		console.log('Generating CM key pair');
		keyPair = ursa.generatePrivateKey();
		var publicKey = keyPair.toPublicPem('base64');
		resolve({'keyPair': keyPair, 'publicKey': publicKey});
	});
};

var getContrainerInfo = function (container) {
	return dockerHelper.inspectContainer(container)
		.then((info) => {
			var response = {
				id: info.Id,
				type: info.Config.Labels['databox.type'],
				name: repoTagToName(info.Name),
			};
			if ('NetworkSettings' in info) {
				response.ip = info.NetworkSettings.IPAddress;
				if ('Ports' in info.NetworkSettings) {
					for (var portName in info.NetworkSettings.Ports) {
						response.port = info.NetworkSettings.Ports[portName][0].HostPort;
						break;
					}
				}
			}
			return response;
		});
};

var startContainer = function (container) {
	return new Promise((resolve, reject) => {
		//TODO: check container
		container.start((err, data) => {
			if (err) {
				reject('startContainer:: ' + err);
				return;
			}
			getContrainerInfo(container).then((info) => {
				resolve(info);
			});
		})
	});
};
exports.startContainer = startContainer;

exports.stopContainer = function (cont) {
	return new Promise((resolve, reject) => {
		//TODO: check cont
		cont.stop((err, data) => {
			if (err && err['statusCode'] != 304) { //don't error if container is already stopped!
				reject(err);
				return;
			}
			resolve(cont);
		})
	});
};

exports.removeContainer = function (cont) {

	return new Promise((resolve, reject) => {
		dockerHelper.inspectContainer(cont)
			.then((info) => {
				cont.remove({force: true}, (err, data) => {
					if (err) {
						console.log("[remove]" + err);
						reject(err);
						return;
					}
					var name = repoTagToName(info.Name);
					console.log("removed " + name + "!");
					console.log("[SLA] Delete " + name);
					resolve(info);
					db.deleteSLA(name, false)
						.then(resolve(info))
						.catch((err) => reject(err));
				})
			});
	});
};

var arbiterName = '';
var DATABOX_ARBITER_ENDPOINT = null;
var DATABOX_ARBITER_PORT = 8080;
exports.launchArbiter = function () {
	return new Promise((resolve, reject) => {
		var name = "databox-arbiter" + ARCH;
		arbiterName = name;
		pullImage(name + ":latest")
			.then(() => {
				return generatingCMkeyPair()
			})
			.then(keys => {

				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true,
						'Env': ["CM_PUB_KEY=" + keys['publicKey']]
					}
				);
			})
			.then((Arbiter) => {
				return startContainer(Arbiter)
			})
			.then((Arbiter) => {
				return dockerHelper.connectToNetwork(Arbiter, 'databox-driver-net');
			})
			.then((Arbiter) => {
				return dockerHelper.connectToNetwork(Arbiter, 'databox-app-net');
			})
			.then((Arbiter) => {
				var untilActive = function (error, response, body) {
					if (body === 'active') {
						console.log("[databox-arbiter] Launched");
						DATABOX_ARBITER_ENDPOINT = 'http://' + Arbiter.ip + ':' + DATABOX_ARBITER_PORT + '/api';
						resolve({'name': Arbiter.name, port: Arbiter.port});
					}
					else {
						setTimeout(() => {
							request.get("http://localhost:" + Arbiter.port + "/status", untilActive);
						}, 1000);
					}
				};
				untilActive({});
			})
			.catch((err) => {
				console.log("Error creating Arbiter");
				reject(err)
			});

	});
};

var directoryName = null;
var DATABOX_DIRECTORY_ENDPOINT = null;
var DATABOX_DIRECTORY_PORT = 3000;
exports.launchDirectory = function () {
	return new Promise((resolve, reject) => {
		var name = "databox-directory" + ARCH;
		directoryName = name;
		pullImage(name + ":latest")
			.then(() => {
				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true
					}
				);
			})
			.then((directory) => {
				return startContainer(directory)
			})
			.then((directory) => {
				return dockerHelper.connectToNetwork(directory, 'databox-driver-net');
			})
			.then((directory) => {
				return dockerHelper.connectToNetwork(directory, 'databox-app-net');
			})
			.then((directory) => {
				DATABOX_DIRECTORY_ENDPOINT = 'http://' + directory.ip + ':' + DATABOX_DIRECTORY_PORT + '/api';
				resolve(directory);
			})
			.catch((err) => {
				console.log("Error creating Directory");
				reject(err)
			});

	});
};

var repoTagToName = function (repoTag) {
	return repoTag.match(/(?:.*\/)?([^/:\s]+)(?::.*|$)/)[1];
};

var generateArbiterToken = function () {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(32, function (err, buffer) {
			if (err) reject(err);
			var token = buffer.toString('base64');
			resolve(token)
		});
	});
};

var configureDriver = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-driver-net')
			.then(resolve(container))
			.catch((err) => reject(err))
	});
};

var configureApp = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-app-net')
			.then(resolve(container))
			.catch((err) => reject(err))
	});
};

var configureStore = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-driver-net')
			.then(()=> {
				return dockerHelper.connectToNetwork(container, 'databox-app-net')
			})
			.then(resolve(container))
			.catch((err) => reject(err))
	});
};

var updateArbiter = function (data) {
	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return dockerHelper.inspectContainer(Arbiter)
			})
			.then((arbiterInfo) => {
				var port = parseInt(arbiterInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort);
				request.post(
					{
						url: "http://localhost:" + port + "/update",
						form: data
					}
					,
					function (err, response, body) {
						if (err) {
							reject(err);
							return;
						}
						resolve(JSON.parse(body));
					}
				)
			})
			.catch((err) => reject(err))
	});
};


var launchDependencies = function (containerSLA) {
	var promises = [];
	for (var requiredType in containerSLA['resource-requirements']) {
		var requiredName = containerSLA['resource-requirements'][requiredType] + ARCH;
		console.log('[' + containerSLA.name + "] Requires " + requiredType + " " + requiredName);
		//look for running container
		promises.push(new Promise((resolve, reject) => {
			getContainer(requiredName)
				.then((cont) => {
					return getContrainerInfo(cont)
				})
				.then((info) => {
					console.log('[' + containerSLA.name + "] Linking to existing "  + requiredType + " " + requiredName);
					info.name = requiredName;
					resolve([info]);
				})
				.catch((err) => {
					//failed try to install
					//console.log("Required container not found trying to install it!", err);
					//Look for an SLA to use. If one is not provided then, look for one stored in the DB.
					//If no SLA can be found db.getSLA() will reject its promise and stop the container
					//installing.
					db.getSLA(requiredName)
						.then((sla) => {
							if (sla != null) {
								return launchContainer(sla);
							}
							else {
								return launchContainer({name: requiredName})
							}
						})
						.then((infos)=> {
							resolve(infos);
						})
						.catch((err) => {
							//install failed Give up :-(
							console.log("Required container could not be installed!" + err);
							return new Promise.reject("Required container could not be installed!" + err);
						})


				})
		}));
	}
	return new Promise.all(promises);
};

var launchContainer = function (containerSLA) {
	var name = repoTagToName(containerSLA.name) + ARCH;
	console.log('[' + name + '] Launching');
	var arbiterToken = null;
	var config = {
		'name': name,
		'Image': Config.registryUrl + '/' + name + ":latest",
		'Env': ["DATABOX_IP=" + ip,
			"DATABOX_DIRECTORY_ENDPOINT=" + DATABOX_DIRECTORY_ENDPOINT,
			"DATABOX_ARBITER_ENDPOINT=" + DATABOX_ARBITER_ENDPOINT
		],
		'PublishAllPorts': true,
		'NetworkingConfig': {
			'Links': [directoryName, arbiterName]
		}
	};
	var launched = [];

	return new Promise((resolve, reject) => {

		launchDependencies(containerSLA)
			.then((dependencies) => {
				for (var dependecyList of dependencies) {
					for (var dependency of dependecyList) {
						config.NetworkingConfig.Links.push(dependency.name);
						config.Env.push(dependency.name.toUpperCase().replace(/[^A-Z]/g, '_') + "_ENDPOINT=" + 'http://' + dependency.ip + ':8080/api');
						launched.push(dependency);
					}
				}

				return pullImage(name + ":latest");
			})
			.then(() => {
				console.log('[' + name + '] Generating Arbiter token');
				return generateArbiterToken();
			})
			.then((token) => {
				arbiterToken = token;
				config.Env.push("ARBITER_TOKEN=" + token);

				if ('datasources' in containerSLA) {
					for (var datasource of containerSLA.datasources) {
						var sensor = {
							hostname: datasource.hostname,
							api_url: datasource.api_url,
							sensor_id: datasource.sensor_id,
						};
						config.Env.push("DATASOURCE_" + datasource.clientid + "=" + JSON.stringify(sensor));
					}
				}

				if ('hardware-permissions' in containerSLA) {
					for (var permmisions of containerSLA['hardware-permissions']) {
						if (permmisions == 'usb') {
							console.log("Adding USB hardware-permissions");
							Config.Privileged = true;
							config.Devices = [{
								PathOnHost: "/dev/bus/usb/001",
								PathInContainer: "/dev/bus/usb/001",
								CgroupPermissions: "mrw"
							}]
						}
					}
				}

				if ('packages' in containerSLA) {
					for (var manifestPackage of containerSLA.packages) {
						var packageEnabled = 'enabled' in manifestPackage ? manifestPackage.enabled : false;
						config.Env.push("PACKAGE_" + manifestPackage.id + "=" + packageEnabled);
					}
				}

				// Create Container
				return dockerHelper.createContainer(config);
			})
			.then((container) => {
				return startContainer(container);
			})
			.then((container) => {
				launched.push(container);
				if (container.type == 'driver') {
					return configureDriver(container);
				} else if (container.type == 'store') {
					return configureStore(container);
				} else {
					return configureApp(container);
				}
			})
			.then((container) => {
				console.log('[' + name + '] Passing token to Arbiter');

				var update = JSON.stringify({name: name, token: arbiterToken, type: container.type});

				var sig = keyPair.hashAndSign('md5', new Buffer(update)).toString('base64');

				return updateArbiter({data: update, sig});
			})
			.then(() => {
				resolve(launched);
			})
			.catch((err) => {
				console.log("[" + name + "] ERROR Launcing: " + err);
				reject(err);
			});
	});
};
exports.launchContainer = launchContainer;


var saveSLA = function (sla) {
	console.log("[SLA] Store " + sla.name);
	return db.putSLA(sla.name, sla);
};
exports.saveSLA = saveSLA;

exports.restoreContainers = function (slas) {
	console.log("Launching " + slas.length + " containers");
	var promises = [];
	for (sla of slas) {
		promises.push(launchContainer(sla));
	}
	return new Promise.all(promises);
};


exports.getActiveSLAs = function () {
	return db.getAllSLAs();
};
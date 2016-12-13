/*jshint esversion: 6 */

var Config = require('./config.json');
var os = require('os');
var crypto = require('crypto');
var request = require('request');
var https = require('https');

var db = require('./include/container-manager-db.js');
var dockerHelper = require('./include/container-manager-docker-helper.js');

var docker = dockerHelper.getDocker();

var ip = '127.0.0.1';

//setup dev env 
var DATABOX_DEV = process.env.DATABOX_DEV;
if(DATABOX_DEV == 1) {

	Config.registryUrl =  Config.registryUrl_dev;
  	Config.storeUrl = Config.storeUrl_dev;
	console.log("Using dev server::", Config);
}

//ARCH to append -arm to the end of a container name if running on arm
var ARCH = '';
if (process.arch == 'arm') {
	ARCH = '-arm';
}

var arbiterAgent; //An https agent that will not reject certs signed by the CM
var httpsHelper;
exports.setHttpsHelper = function (helper) {
 	httpsHelper = helper;
	var agentOptions = {
		ca: httpsHelper.getRootCert()
	};
	arbiterAgent = new https.Agent(agentOptions);
};

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
				resolve();
			})
			.catch(err => {
				consol.log("[killAll-2]" + err);
				reject(err);
			});
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
					});

			})
			.then((networks) => {
				resolve(networks);
			});
	})
		.catch(err => reject(err));
};

//Pull latest image from any repo defaults to dockerIO
var pullDockerIOImage = function (imageName) {
	return new Promise((resolve, reject) => {
		var parts = imageName.split(':');
		var name = parts[0];
		var version = parts[1];
		console.log('[' + name + '] Pulling ' + version + ' image');
		dockerImagePull(imageName, resolve,reject);
	});
};

//Pull latest image from Config.registryUrl
var pullImage = function (imageName) {
	return new Promise((resolve, reject) => {
		var parts = imageName.split(':');
		var name = parts[0];
		var version = parts[1];
		console.log('[' + name + '] Pulling ' + version + ' image');
		dockerImagePull(Config.registryUrl + "/" + imageName, resolve,reject);
	});
};
exports.pullImage = pullImage;

var dockerImagePull = function (image,resolve,reject) {
	docker.pull(image, (err, stream) => {
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
		});
};

var getContainerInfo = function (container) {
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
			getContainerInfo(container)
			.then((info) => {
				resolve(info);
			})
			.catch((err)=>{console.log(err); reject(err)});
		});
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
		});
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
					//console.log("removed " + name + "!");
					//console.log("[SLA] Delete " + name);
					resolve(info);
					db.deleteSLA(name, false)
						.then(resolve(info))
						.catch((err) => reject(err));
				});
			});
	});
};

exports.launchLocalAppStore = function() {
	return new Promise((resolve, reject) => {
		var name = Config.localAppStoreName + ARCH;
		pullImage(Config.localAppStoreName + ":latest")
		    .then(() => {
				return httpsHelper.createClientCert(Config.storeUrl_dev.replace('http://','').replace('8080',''));
			})
			.then((httpsCerts) => {
				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true,
						'Env': [
									"HTTP_TLS_CERTIFICATE=" + httpsCerts.clientcert,
									"HTTP_TLS_KEY=" + httpsCerts.clientprivate,
									"LOCAL_MODE=1", //force local mode to disable login 
									"PORT=8181"
							   ],
						'Binds':["/tmp/databoxAppStore:/data/db"],
						'PortBindings': {'8181/tcp': [{ HostPort: '8181' }]} //expose ports for the mac
					}
				);
			})
			.then((appStore) => {
				return startContainer(appStore);
			})
			.then(() => {
				console.log("waiting for local app store ....");
				setTimeout(resolve,3000);
			})
			.catch((error)=>{
				console.log("[launchLocalAppStore]",error);
				reject(error);
			});
	});
};

exports.launchLocalRegistry = function() {
	return new Promise((resolve, reject) => {
		var name = Config.localRegistryName + ARCH;
		pullDockerIOImage(Config.localRegistryImage + ":latest")
		    .then(() => {
				return httpsHelper.createClientCert(Config.registryUrl_dev.replace(':5000',''));
			})
			.then((httpsCerts) => {
				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.localRegistryImage + ":latest",
						'PublishAllPorts': true,
						'Env': [
									"HTTP_TLS_CERTIFICATE=" + httpsCerts.clientcert,
									"HTTP_TLS_KEY=" + httpsCerts.clientprivate,
							   ],
						'Binds':["/tmp/databoxregistry:/var/lib/registry"],
						'PortBindings': {'5000/tcp': [{ HostPort: '5000' }]} //expose ports for the mac
					}
				);
			})
			.then((Reg) => {
				return startContainer(Reg);
			})
			.then(() => {
				console.log("waiting for local register ....");
				setTimeout(resolve,2000);
			})
			.catch((error)=>{
				console.log("[launchLocalRegistry]",error);
				reject(error);
			});
	});
};

var arbiterName = '';
var arbiterKey = null;
var DATABOX_ARBITER_ENDPOINT = null;
var DATABOX_ARBITER_ENDPOINT_IP = null;
var DATABOX_ARBITER_PORT = '8080';
exports.launchArbiter = function () {
	return new Promise((resolve, reject) => {
		var name = "databox-arbiter" + ARCH;
		arbiterName = name;
		pullImage(name + ":latest")
			.then(() => {
				var proms = [
					httpsHelper.createClientCert(name),
					generateArbiterToken()
				];
				return Promise.all(proms);
			})
			.then((keysArray) => {
				httpsPem = keysArray[0];
				arbiterKey = keysArray[1];
				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true,
						'Env': [
								"CM_KEY=" + arbiterKey,
								"CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert(),
								"HTTPS_CLIENT_PRIVATE_KEY=" +  httpsPem.clientprivate,
								"HTTPS_CLIENT_CERT=" +  httpsPem.clientcert,
							   ],
						'PortBindings': {'8080/tcp': [{ HostPort: DATABOX_ARBITER_PORT }]} //expose ports for the mac
					}
				);
			})
			.then((Arbiter) => {
				return startContainer(Arbiter);
			})
			.then((Arbiter) => {
				return dockerHelper.connectToNetwork(Arbiter, 'databox-driver-net');
			})
			.then((Arbiter) => {
				return dockerHelper.connectToNetwork(Arbiter, 'databox-app-net');
			})
			.then((Arbiter) => {
				var untilActive = function (error, response, body) {
					if(error) {
						console.log(error);
						console.log("Did you add " + Arbiter.name + " " + Arbiter.ip + " to your /etc/hosts file?");
					}
					console.log(body);
					if (body === 'active') {
						console.log("[databox-arbiter] Launched");
						DATABOX_ARBITER_ENDPOINT = 'https://' + Arbiter.name + ':' + DATABOX_ARBITER_PORT;
						DATABOX_ARBITER_ENDPOINT_IP = 'https://' + Arbiter.ip + ':' + DATABOX_ARBITER_PORT;
						resolve({'name': Arbiter.name, 'port': Arbiter.port, 'CM_KEY': arbiterKey, });
					}
					else {
						setTimeout(() => {
							request({'url':"https://"+Arbiter.name+":" + DATABOX_ARBITER_PORT + "/status", 'method':'GET', 'agent':arbiterAgent}, untilActive);
						}, 1000);
						console.log("Waiting for Arbiter ....");
					}
				};
				untilActive({});
			})
			.catch((err) => {
				if(DATABOX_DEV) {
					console.log(
						"\n#################### Error creating Arbiter ######################\n\n" +
						"Have you seeded the local docker registry with the arbiter and demo images ? try running \n"+
						"\n \t sh ./updateLocalRegistry.sh \n" +
						"#################### Error creating Arbiter ######################\n\n"
					);
				}
				reject(err);
			});

	});
};


var notificationsName = null;
var DATABOX_NOTIFICATIONS_ENDPOINT = null;
var DATABOX_NOTIFICATIONS_PORT = 8080;
exports.launchNotifications = function () {
	return new Promise((resolve, reject) => {
		var name = "databox-notifications" + ARCH;
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
			.then((notifications) => {
				return startContainer(notifications);
			})
			.then((notifications) => {
				return dockerHelper.connectToNetwork(notifications, 'databox-driver-net');
			})
			.then((notifications) => {
				return dockerHelper.connectToNetwork(notifications, 'databox-app-net');
			})
			.then((notifications) => {
				DATABOX_NOTIFICATIONS_ENDPOINT = 'http://' + notifications.ip + ':' + DATABOX_NOTIFICATIONS_PORT + '/notify';
				resolve(notifications);
			})
			.catch((err) => {
				console.log("Error creating notifications");
				reject(err);
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
			resolve(token);
		});
	});
};

var configureDriver = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-driver-net')
			.then(resolve(container))
			.catch((err) => reject(err));
	});
};

var configureApp = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-app-net')
			.then(resolve(container))
			.catch((err) => reject(err));
	});
};

var configureStore = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-driver-net')
		.then(()=> {
			return dockerHelper.connectToNetwork(container, 'databox-app-net');
		})
		.then(resolve(container))
		.catch((err) => reject(err));
	});
};

var updateArbiter = function (data) {
	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return getContainerInfo(Arbiter);
			})
			.then((arbiterInfo) => {
				var options = {
						url: DATABOX_ARBITER_ENDPOINT + "/cm/upsert-container-info",
						method:'POST',
						form: data,
						agent: arbiterAgent,
						headers: {
							'x-api-key': arbiterKey
						}
					};
				request(
					options,
					function (err, response, body) {
						if (err) {
							reject(err);
							return;
						}
						resolve(JSON.parse(body));
					});
			})
			.catch((err) => reject(err));
	});
};


var launchDependencies = function (containerSLA) {
	var promises = [];
	for (var requiredType in containerSLA['resource-requirements']) {
		
		var rootContainerName = containerSLA['resource-requirements'][requiredType]; 
		var requiredName = containerSLA.name + "-" + containerSLA['resource-requirements'][requiredType] + ARCH;
		
		console.log('[' + containerSLA.name + "] Requires " + requiredType + " " + requiredName);
		//look for running container
		promises.push(new Promise((resolve, reject) => {
			getContainer(requiredName)
				.then((cont) => {
					return getContainerInfo(cont);
				})
				.then((info) => {
					console.log('[' + requiredName + "] Linking to existing " + requiredType + " " + requiredName);
					info.name = requiredName;
					resolve([info]);
				})
				.catch((err) => {
					//failed try to install
					//console.log("Required container not found trying to install it!", err);
					//Look for an SLA to use. If one is not provided then, look for one stored in the DB.
					//If no SLA can be found db.getSLA() will reject its promise and stop the container
					//installing.
					db.getSLA(rootContainerName)
						.then((sla) => {
							if (sla !== null) {
								sla.localContainerName = requiredName;
								return launchContainer(sla);
							}
							else {
								sla = {
										name: rootContainerName,
										localContainerName: requiredName
									};
								return launchContainer(sla);
							}
						})
						.then((info)=> {
							resolve(info);
						})
						.catch((err) => {
							//install failed Give up :-(
							console.log("Required container could not be installed!" + err);
							return new Promise.reject("Required container could not be installed!" + err);
						});
				});
		}));
	}
	return Promise.all(promises);
};

var launchContainer = function (containerSLA) {
	var name = repoTagToName(containerSLA.name) + ARCH;

	//set the local name of the container. Containers launched as dependencies 
	//have their local name set to [rootContainerName]-[dependentContainerName]
	if(!("localContainerName" in containerSLA)) {
		containerSLA.localContainerName = name;
	}

	console.log('[' + name + '] Launching');
	var arbiterToken = null;
	var config = {
		'name': containerSLA.localContainerName,
		'Image': Config.registryUrl + '/' + name + ":latest",
		'Env': [
			"DATABOX_IP=" + ip,
			"DATABOX_LOCAL_NAME=" + containerSLA.localContainerName,
			"DATABOX_ARBITER_ENDPOINT=" + DATABOX_ARBITER_ENDPOINT
			//"DATABOX_NOTIFICATIONS_ENDPOINT=" + DATABOX_NOTIFICATIONS_ENDPOINT
		],
		'PublishAllPorts': true,
		'NetworkingConfig': {
			'Links': [arbiterName]
		}
	};
	var launched = [];

	return new Promise((resolve, reject) => {

		launchDependencies(containerSLA)
			.then((dependencies) => {
				for (var dependencyList of dependencies) {
					for (var dependency of dependencyList) {
						config.NetworkingConfig.Links.push(dependency.name);
						config.Env.push(dependency.name.toUpperCase().replace(/[^A-Z0-9]/g, '_') + "_ENDPOINT=" + 'https://' + dependency.name + ':8080');
						launched.push(dependency);
					}
				}

				return pullImage(name + ":latest");
			})
			.then(() => {
				console.log('[' + containerSLA.localContainerName + '] Generating Arbiter token and HTTPS cert');
				proms = [
					httpsHelper.createClientCert(containerSLA.localContainerName),
					generateArbiterToken()
				];
				return Promise.all(proms);
			})
			.then((tokens) => {
				httpsPem = tokens[0];
				arbiterToken = tokens[1];
				config.Env.push("ARBITER_TOKEN=" + arbiterToken);
				config.Env.push("CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert());
				config.Env.push("HTTPS_CLIENT_PRIVATE_KEY=" +  httpsPem.clientprivate);
				config.Env.push("HTTPS_CLIENT_CERT=" +  httpsPem.clientcert);
							   
				if('volumes' in containerSLA) {
					console.log('Adding volumes');
					config.Volumes = {};
					for(var vol of containerSLA['volumes']) {
						config.Volumes[vol] = {};
						binds.push(name+"-"+vol.replace('/','')+":"+vol);						
					}
					config.Binds = binds;
				}

				if ('datasources' in containerSLA) {
					for (var datasource of containerSLA.datasources) {
						var sensor = {
							endpoint: datasource.endpoint,
							sensor_id: datasource.sensor_id,
						};
						if (datasource.endpoint !== undefined) {
							var index = datasource.endpoint.indexOf('/');
							if (index != -1) {
								sensor.hostname = sensor.endpoint.substr(0, index);
								sensor.api_url = sensor.endpoint.substr(index);
							}
						}
						config.Env.push("DATASOURCE_" + datasource.clientid + "=" + JSON.stringify(sensor));
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
				console.log('[' + containerSLA.localContainerName + '] Passing token to Arbiter');

				var update = JSON.stringify({name: containerSLA.localContainerName, key: arbiterToken, type: container.type});

				return updateArbiter({ data: update });
			})
			.then(() => {
				resolve(launched);
			})
			.catch((err) => {
				console.log("[" + name + "] ERROR Launching: " + err);
				reject(err);
			});
	});
};
exports.launchContainer = launchContainer;


var saveSLA = function (sla) {
	//console.log('[' + sla.name + '] Saving SLA');
	return db.putSLA(sla.name, sla);
};
exports.saveSLA = saveSLA;

exports.restoreContainers = function (slas) {
	return new Promise((resolve, reject)=> {
		var infos = [];
		var result = Promise.resolve();
		slas.forEach(sla => {
			console.log("Launching Container:: " + sla.name);
			result = result.then((info) => {
				infos.push(info);
				return launchContainer(sla);
			});
		});
		result = result.then((info)=> {
			infos.push(info);
			infos.shift(); //remove unneeded first item.
			resolve(infos);
		});
		return result;
	});
};


exports.getActiveSLAs = function () {
	return db.getAllSLAs();
};

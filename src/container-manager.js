/*jshint esversion: 6 */

var Config = require('./config.json');
var os = require('os');
var crypto = require('crypto');
var request = require('request');
var https = require('https');
var url = require('url');

var db = require('./include/container-manager-db.js');
var dockerHelper = require('./include/container-manager-docker-helper.js');

var docker = dockerHelper.getDocker();

var ip = '127.0.0.1';

//setup dev env
var DATABOX_DEV = process.env.DATABOX_DEV;
if(DATABOX_DEV == 1) {
	Config.registryUrl = Config.registryUrl_dev;
	Config.storeUrl = Config.storeUrl_dev;
	console.log("Using dev regestry::", Config.registryUrl);
}

var DATABOX_SDK = process.env.DATABOX_SDK;
if(DATABOX_SDK == 1) {
	Config.registryUrl = Config.registryUrl_sdk;
	Config.storeUrl = Config.storeUrl_sdk;
	console.log("Using sdk registery::", Config.registryUrl);
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

var getOwnContainer = function () {
	return new Promise((resolve, reject) => {
		docker.listContainers({all: true, filters: {"label": ["databox.type=container-manager"]}},
			(err, containers) => {
				if (err) {
					reject(err);
					return;
				}
				containers = containers.filter((cont)=>{ return cont.State === 'running'; });
				console.log(containers)
				if (containers.length !== 1) {
					reject("More than one Container Manager running!");
					return;
				}
				getContainer(containers[0].Id)
					.then((container) => resolve(container))
					.catch((err)=>{
						reject(err);
					});
			}
		);
	});
};
exports.getOwnContainer = getOwnContainer;

exports.connectToCMArbiterNetwork = function (container) {

	let proms = [
		dockerHelper.connectToNetwork(container, 'databox-cm-arbiter-net'),
		dockerHelper.connectToNetwork(container, 'databox-cloud-net'),
		dockerHelper.connectToNetwork(container, 'databox-driver-net'),
		dockerHelper.connectToNetwork(container, 'databox-app-net')
	];

	return Promise.all(proms);
};

exports.killAll = function () {
	return new Promise((resolve, reject) => {
		listContainers()
			.then(containers => {
				ids = [];
				for (var container of containers) {
					if(container.Labels['databox.type'] != 'container-manager') {
						var name = repoTagToName(container.Image);
						console.log('[' + name + '] Uninstalling');
						ids.push(dockerHelper.kill(container.Id));
						ids.push(dockerHelper.remove(container.Id));
					}
				}
				return Promise.all(ids);
			})
			.then((data) => {
				resolve();
			})
			.catch(err => {
				console.log("[killAll-2]" + err);
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
		dockerHelper.listNetworks()
			.then(networks => {
				var requiredNets = [
					dockerHelper.getNetwork(networks, 'databox-driver-net', true),
					dockerHelper.getNetwork(networks, 'databox-app-net'),
					dockerHelper.getNetwork(networks, 'databox-cloud-net'),
					dockerHelper.getNetwork(networks, 'databox-cm-arbiter-net'),
					dockerHelper.getNetwork(networks, 'databox-external', true)
				];

				return Promise.all(requiredNets)
					.then((networks) => {
						resolve(networks);
					})
					.catch(err => {
						console.log("initNetworks::" + err);
						reject(err);
					});

			})
			.then((networks) => {
				resolve(networks);
			})
			.catch((err) => {reject(err)});
	});
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
						//response.port = info.NetworkSettings.Ports[portName][0].HostPort;
						response.port = portName.replace('/tcp','');
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

					revokeContainerPermissions({'name': name});
				});
			});
	});
};

exports.launchLocalAppStore = function() {
	return new Promise((resolve, reject) => {
		var name = Config.localAppStoreName + ARCH;
		pullImage(Config.localAppStoreName + ":latest")
		    .then(() => {
				return httpsHelper.createClientCert(Config.localAppStoreName);
			})
			.then((httpsCerts) => {
				return dockerHelper.createContainer(
					{
						'hostname': name,
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
				return dockerHelper.connectToNetwork(appStore, 'databox-cloud-net');
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
				return httpsHelper.createClientCert(Config.localRegistryName);
			})
			.then((httpsCerts) => {
				return dockerHelper.createContainer(
					{
						'hostname': name,
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
				return dockerHelper.connectToNetwork(Reg, 'databox-cloud-net');
			})
			.then((Reg) => {
				return startContainer(Reg);
			})
			.then(() => {
				console.log("waiting for local registry ....");
				setTimeout(resolve,5000);
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
						'hostname': name,
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true,
						'Env': [
								"CM_KEY=" + arbiterKey,
								"CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert(),
								"HTTPS_SERVER_PRIVATE_KEY=" +  httpsPem.clientprivate,
								"HTTPS_SERVER_CERT=" +  httpsPem.clientcert,
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
				return dockerHelper.connectToNetwork(Arbiter, 'databox-cm-arbiter-net');
			})
			.then((Arbiter) => {
				var untilActive = function (error, response, body) {
					if(error) {
						console.log(error);
					}

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


var DATABOX_LOGSTORE_ENDPOINT = null;
var DATABOX_LOGSTORE_NAME = "databox-logstore";
var DATABOX_LOGSTORE_PORT = 8080;
exports.launchLogStore = function () {

	return new Promise((resolve, reject) => {
		var name = DATABOX_LOGSTORE_NAME + ARCH;
		var arbiterToken = "";
		pullImage(name + ":latest")
			.then(() => {
				console.log('[' + name + '] Generating Arbiter token and HTTPS cert');
				proms = [
					httpsHelper.createClientCert(name),
					generateArbiterToken()
				];
				return Promise.all(proms);
			})
			.then((tokens) => {
				let httpsPem = tokens[0];
				arbiterToken = tokens[1];
				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.registryUrl + '/' + name + ":latest",
						'PublishAllPorts': true,
						'Env': [
									"ARBITER_TOKEN=" + arbiterToken,
									"CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert(),
									"HTTPS_SERVER_PRIVATE_KEY=" +  httpsPem.clientprivate,
									"HTTPS_SERVER_CERT=" +  httpsPem.clientcert
							   ],
						'Binds':["/tmp/databoxLogs:/database"],
					}
				);
			})
			.then((logstore) => {
				return startContainer(logstore);
			})
			.then((logstore) => {
				var proms =  [ dockerHelper.connectToNetwork(logstore, 'databox-driver-net'),
							   dockerHelper.connectToNetwork(logstore, 'databox-app-net')];
				return Promise.all(proms);
			})
			.then((logstores) => {
				console.log('[' + name + '] Passing token to Arbiter');
				var logstore = logstores[0];
				var update = {name: name, key: arbiterToken, type: logstore.type};
				return updateArbiter(update);
			})
			.then((logstore) => {
				DATABOX_LOGSTORE_ENDPOINT = 'https://' + DATABOX_LOGSTORE_NAME + ':' + DATABOX_LOGSTORE_PORT;
				resolve(logstore);
			})
			.catch((err) => {
				console.log("Error creating databox-logstore");
				reject(err);
			});

	});
};

var DATABOX_EXPORT_SERVICE_ENDPOINT = null;
var DATABOX_EXPORT_SERVICE_HOSTNAME = null;
var DATABOX_EXPORT_SERVICE_PORT = 8080;
exports.launchExportService = function () {

	return new Promise((resolve, reject) => {
		var name = "databox-export-service" + ARCH;
		var arbiterToken = "";
		pullImage(name + ":latest")
			.then(() => {
				console.log('[' + name + '] Generating Arbiter token and HTTPS cert');
				proms = [
					httpsHelper.createClientCert(name),
					generateArbiterToken()
				];
				return Promise.all(proms);
			})
			.then((tokens) => {
				let httpsPem = tokens[0];
				arbiterToken = tokens[1];
				return dockerHelper.createContainer(
					{
						'name': name,
						'Image': Config.registryUrl + '/' + name + ":latest",
						'PublishAllPorts': true,
						'Env': [
									"ARBITER_TOKEN=" + arbiterToken,
									"CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert(),
									"HTTPS_SERVER_PRIVATE_KEY=" +  httpsPem.clientprivate,
									"HTTPS_SERVER_CERT=" +  httpsPem.clientcert
							   ]
					}
				);
			})
			.then((exportService) => {
				return startContainer(exportService);
			})
			.then((exportService) => {
				return dockerHelper.connectToNetwork(exportService, 'databox-app-net');
			})
			.then((exportService) => {
				return dockerHelper.connectToNetwork(exportService, 'databox-external');
			})
			.then((exportService) => {
				console.log('[' + name + '] Passing token to Arbiter');

				var update = {name: name, key: arbiterToken, type: exportService.type};

				return updateArbiter(update);
			})
			.then((exportService) => {
				DATABOX_EXPORT_SERVICE_HOSTNAME = name;
				DATABOX_EXPORT_SERVICE_ENDPOINT = 'https://' + name + ':' + DATABOX_EXPORT_SERVICE_PORT;
				resolve(exportService);
			})
			.catch((err) => {
				console.log("Error creating databox-export-service");
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
exports.updateArbiter = updateArbiter;

var updateContainerPermissions = function (permissions) {

	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return getContainerInfo(Arbiter);
			})
			.then((arbiterInfo) => {
				var options = {
						url: DATABOX_ARBITER_ENDPOINT + "/cm/grant-container-permissions",
						method:'POST',
						form: permissions,
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

var revokeContainerPermissions = function (permissions) {
	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return getContainerInfo(Arbiter);
			})
			.then((arbiterInfo) => {
				var options = {
						url: DATABOX_ARBITER_ENDPOINT + "/cm/delete-container-info",
						method:'POST',
						form: permissions,
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
						resolve();
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

let launchContainer = function (containerSLA) {
	let name = repoTagToName(containerSLA.name) + ARCH;

	//set the local name of the container. Containers launched as dependencies
	//have their local name set to [rootContainerName]-[dependentContainerName]
	if(!("localContainerName" in containerSLA)) {
		containerSLA.localContainerName = name;
	}

	console.log('[' + name + '] Launching');
	let arbiterToken = null;
	let config = {
		'name': containerSLA.localContainerName,
		'Image': Config.registryUrl + '/' + name + ":latest",
		'Env': [
			"DATABOX_IP=" + ip,
			"DATABOX_LOCAL_NAME=" + containerSLA.localContainerName,
			"DATABOX_ARBITER_ENDPOINT=" + DATABOX_ARBITER_ENDPOINT,
			"DATABOX_LOGSTORE_ENDPOINT=" + DATABOX_LOGSTORE_ENDPOINT + '/' + containerSLA.localContainerName, //TODO only expose this to stores 
			"DATABOX_EXPORT_SERVICE_ENDPOINT=" + DATABOX_EXPORT_SERVICE_ENDPOINT //TODO only expose this to apps
			//"DATABOX_NOTIFICATIONS_ENDPOINT=" + DATABOX_NOTIFICATIONS_ENDPOINT
		],
		'PublishAllPorts': true,
		'NetworkingConfig': {
			'Links': [arbiterName]
		}
	};

	let readProms = [];

	console.log(containerSLA);
	if(containerSLA['export-whitelist']) {

		let urlsString = containerSLA['export-whitelist'].map((itm)=>{return '"' + itm.url + '"';}).join(',');

		console.log("[Adding Export permissions for " + containerSLA.localContainerName + "] on " + urlsString);
			readProms.push(updateContainerPermissions({
											name: containerSLA.localContainerName,
											route: {target:DATABOX_EXPORT_SERVICE_HOSTNAME, path: '/export/', method:'POST'},
											caveats: [ "destination = [" + urlsString + "]" ]
										}));
			readProms.push(updateContainerPermissions({
											name: containerSLA.localContainerName,
											route: {target:DATABOX_EXPORT_SERVICE_HOSTNAME, path: '/lp/export/', method:'POST'},
											caveats: [ "destination = [" + urlsString + "]" ]
										}));
	}

	//set read permissions from the sla for DATASOURCES. Limit this to Apps only??
	if(containerSLA.datasources) {
		for(let allowedDatasource of containerSLA.datasources) {
			if(allowedDatasource.endpoint) {
				let datasourceEndpoint = url.parse(allowedDatasource.endpoint);
				let datasourceName = allowedDatasource.datasource;

				var isActuator = allowedDatasource.hypercat['item-metadata'].findIndex((itm)=>{return (itm.rel === 'urn:X-databox:rels:isActuator') && (itm.val === true) ; });
			
				if(isActuator !== -1) {
					//its an actuator we need write access
					readProms.push(updateContainerPermissions({
											name: containerSLA.localContainerName,
											route: {target:datasourceEndpoint.hostname, path: '/'+datasourceName+'/*', method:'POST'}
										}));
				}

				readProms.push(updateContainerPermissions({
					name: containerSLA.localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/status', method: 'GET'}
				}));

				readProms.push(updateContainerPermissions({
					name: containerSLA.localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/' + datasourceName, method: 'GET'}
				}));

				readProms.push(updateContainerPermissions({
					name: containerSLA.localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/' + datasourceName + '/*', method: 'GET'}
				}));

				readProms.push(updateContainerPermissions({
					name: containerSLA.localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/ws', method: 'GET'}
				}));

				readProms.push(updateContainerPermissions({
					name: containerSLA.localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/sub/' + datasourceName + '/*', method: 'GET'}
				}));
			}
		}

		Promise.all(readProms)
		.then((resp)=>{
			console.log(resp);
			console.log('[Added read permissions for]:' + containerSLA.localContainerName);
		})
		.catch((error)=>{
			//TODO sort out nested promises and think about stopping the install if this fails
			console.log('[ERROR Adding read permissions for]:' + containerSLA.localContainerName, error);
		});
	}

	let launched = [];

	return new Promise((resolve, reject) => {

		launchDependencies(containerSLA)
			.then((dependencies) => {
				for (let dependencyList of dependencies) {
					for (let dependency of dependencyList) {
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
				let httpsPem = tokens[0];
				arbiterToken = tokens[1];
				config.Env.push("ARBITER_TOKEN=" + arbiterToken);
				config.Env.push("CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert());
				config.Env.push("HTTPS_SERVER_PRIVATE_KEY=" +  httpsPem.clientprivate);
				config.Env.push("HTTPS_SERVER_CERT=" +  httpsPem.clientcert);

				if('volumes' in containerSLA) {
					let binds = [];
					console.log('Adding volumes');
					config.Volumes = {};
					for(let vol of containerSLA['volumes']) {
						config.Volumes[vol] = {};
						binds.push(name+"-"+vol.replace('/','')+":"+vol);
					}
					config.Binds = binds;
				}
				proms = [];
				if ('datasources' in containerSLA) {
					for (let datasource of containerSLA.datasources) {
						config.Env.push("DATASOURCE_" + datasource.clientid + "=" + JSON.stringify(datasource.hypercat));
						if (datasource.enabled) {
 							// Grant read assess to enabled datasources
							 proms.push(updateContainerPermissions({
										name: containerSLA.name,
										route: {target:containerSLA.host, path: containerSLA.api_url, method:'GET'}
										//caveats: ""
									}));
 						}
					}
				}

				if ('packages' in containerSLA) {
					for (let manifestPackage of containerSLA.packages) {
						let packageEnabled = 'enabled' in manifestPackage ? manifestPackage.enabled : false;
						config.Env.push("PACKAGE_" + manifestPackage.id + "=" + packageEnabled);
					}
				}

				// TODO: Separate from other promises
 				proms.push(dockerHelper.createContainer(config));
 				return Promise.all(proms);
			})
			.then((results) => {
				return startContainer(results[results.length - 1]);
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
				var update = {name: containerSLA.localContainerName, key: arbiterToken, type: container.type};
				return updateArbiter(update);
			})
			.then(() => {
				//grant write access to requested stores
				var dependentStores = launched.filter((itm)=>{ return itm.type == 'store'; });
				for(store of dependentStores) {

					if(containerSLA.localContainerName != store.name) {

						//Read /cat for CM
						console.log('[Adding read permissions] for databox-container-manager on ' + store.name + '/cat');
						updateContainerPermissions({
							name: 'databox-container-manager',
							route: {target: store.name, path: '/cat', method:'GET'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});

						//Read /status
						console.log('[Adding read permissions] for ' + containerSLA.localContainerName + ' on ' + store.name + '/status');
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/status', method:'GET'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});

						//Read /ws
						console.log('[Adding read permissions] for ' + containerSLA.localContainerName + ' on ' + store.name + '/ws');
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/ws', method:'GET'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});

						console.log('[Adding read permissions] for ' + containerSLA.localContainerName + ' on ' + store.name + '/sub/*');
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/sub/*', method:'GET'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});

						console.log('[Adding read permissions] for ' + containerSLA.localContainerName + ' on ' + store.name + '/unsub/*');
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/unsub/*', method:'GET'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});


						//Write to all endpoints on dependent store
						console.log('[Adding write permissions] for ' + containerSLA.localContainerName + ' on ' + store.name);
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/*', method:'POST'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});

						//Read to all endpoints on dependent store (sometimes its nice to read what you have written)
						console.log('[Adding read permissions] for ' + containerSLA.localContainerName + ' on ' + store.name);
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/*', method:'GET'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[Warning adding read permissions for " + name + " on /*] " + err);
						});

						//Write to /cat on dependent store
						console.log('[Adding write permissions] for ' + containerSLA.localContainerName + ' on ' + store.name + '/cat');
						updateContainerPermissions({
							name: containerSLA.localContainerName,
							route: {target: store.name, path: '/cat', method:'POST'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + name + "] " + err);
							reject(err);
						});

						//Grant permissions for the store to write to the log
						console.log('[Adding write permissions] for ' + store.name + ' on ' + DATABOX_LOGSTORE_NAME + '/' + store.name);
						updateContainerPermissions({
							name: store.name,
							route: {target: DATABOX_LOGSTORE_NAME, path: '/' + store.name , method:'POST'}
							//caveats: ""
						})
						.catch((err)=>{
							console.log("[ERROR adding permissions for " + store.name + "] " + err);
							reject(err);
						});
					}
				}
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

/*jshint esversion: 6 */

const Config = require('./config.json');
const os = require('os');
const crypto = require('crypto');
const request = require('request');
const https = require('https');
const url = require('url');
const Docker = require('dockerode');
const docker = new Docker();

const db = require('./include/container-manager-db.js');
const dockerHelper = require('./include/container-manager-docker-helper.js');

const ip = '127.0.0.1';

//setup dev env
const DATABOX_DEV = process.env.DATABOX_DEV;
if(DATABOX_DEV == 1) {
	Config.registryUrl = Config.registryUrl_dev;
	Config.storeUrl = Config.storeUrl_dev;
	console.log("Using dev registry::", Config.registryUrl);
}

const DATABOX_SDK = process.env.DATABOX_SDK;
if(DATABOX_SDK == 1) {
	Config.registryUrl = Config.registryUrl_sdk;
	Config.storeUrl = Config.storeUrl_sdk;
	console.log("Using sdk registry::", Config.registryUrl);
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
		if (err) {
			reject("Cant connect to docker!");
			return;
		} 
		resolve();
	}));
};

const listContainers = function () {
	return docker.listContainers({all: true, filters: {"label": ["databox.type"]}});
};
exports.listContainers = listContainers;

const getOwnContainer = function () {
	return new Promise((resolve, reject) => {
		docker.listContainers({all: true, filters: {"label": ["databox.type=container-manager"]}},
			(err, containers) => {
				if (err) {
					reject(err);
					return;
				}
				containers = containers.filter((cont)=>{ return cont.State === 'running'; });
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

	return dockerHelper.connectToNetwork(container, 'databox-cm-arbiter-net')
	.then(()=>{
		return dockerHelper.connectToNetwork(container, 'databox-cloud-net');
	})
	.then(()=>{
		return dockerHelper.connectToNetwork(container, 'databox-driver-net');
	})
	.then(()=>{
		return dockerHelper.connectToNetwork(container, 'databox-app-net');
	})

};

exports.killAll = function () {

		return listContainers()
					.then(containers => {
						ids = [];
						for (const container of containers) {
							if(container.Labels['databox.type'] != 'container-manager') {
								const name = repoTagToName(container.Image);
								console.log('[' + name + '] Uninstalling');
								const cont = docker.getContainer(container.Id);
								if(container.State == 'running') { 
									ids.push(cont.stop());
								}
								ids.push(cont.remove({force: true}));
							}
						}
						return Promise.all(ids);
					});
			
};

const getContainer = function (id) {
	return Promise.resolve(docker.getContainer(id));
};
exports.getContainer = getContainer;

exports.initNetworks = function () {
	
	const requiredNets = [
		dockerHelper.createNetwork('databox-driver-net', true),
		dockerHelper.createNetwork('databox-app-net'),
		dockerHelper.createNetwork('databox-cloud-net'),
		dockerHelper.createNetwork('databox-cm-arbiter-net'),
		dockerHelper.createNetwork('databox-external', true)
	];

	return Promise.all(requiredNets);
};

//Pull latest image from any repo defaults to dockerIO
const pullDockerIOImage = function (imageName) {
	return new Promise((resolve, reject) => {
		const parts = imageName.split(':');
		const name = parts[0];
		const version = parts[1];
		console.log('[Pulling Image] ' + imageName );
		dockerImagePull(imageName, resolve,reject);
	});
};

//Pull latest image from Config.registryUrl
const pullImage = function (imageName) {
	return new Promise((resolve, reject) => {
		const parts = imageName.split(':');
		const name = parts[0];
		const version = parts[1];
		console.log('[Pulling Image] ' + imageName );
		dockerImagePull(Config.registryUrl + "/" + imageName, resolve,reject);
	});
};
exports.pullImage = pullImage;

const dockerImagePull = function (image,resolve,reject) {
	docker.pull(image, (err, stream) => {
			if (err) {
				reject(err);
				return;
			}
			//stream.pipe(process.stdout);
			docker.modem.followProgress(stream, (err, output) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(";->");
			});
		});
};

const pushToRegistry = function (image) {
	return new Promise((resolve, reject) => {
		image.push(image, (err, stream) => {
			if (err) {
				reject(err);
				return;
			}
			//stream.pipe(process.stdout);
			docker.modem.followProgress(stream, (err, output) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(";->");
			});
		});
	});
};

const getContainerInfo = function (container) {
	return container.inspect(container)
		.then((info) => {
			const response = {
				id: info.Id,
				type: info.Config.Labels['databox.type'],
				name: repoTagToName(info.Name),
			};
			if ('NetworkSettings' in info) {
				response.ip = info.NetworkSettings.IPAddress;
				if ('Ports' in info.NetworkSettings) {
					for (const portName in info.NetworkSettings.Ports) {
						//response.port = info.NetworkSettings.Ports[portName][0].HostPort;
						response.port = portName.replace('/tcp','');
						break;
					}
				}
			}
			return response;
		});
};

const updateSeedImage = function (organization, imageName, targetReg) {
	return new Promise((resolve, reject)=>{
		const targetImage = targetReg + '/' + imageName  + ARCH;
		const srcImage = organization + '/' + imageName  + ARCH + ':latest';

		

		pullDockerIOImage(targetImage)
		.then(()=>{
			resolve();
		})
		.catch((err)=>{
			console.log("[Seeding]" + srcImage + ' to ' + targetImage);
			//try and seed the image form the organization docker hub
			pullDockerIOImage(srcImage)
			.then(()=>{
				return docker.getImage(srcImage);
			})
			.then((img)=>{
				return img.tag({repo: targetImage});
			})
			.then(()=>{
				return docker.getImage(targetImage);
			})
			.then((img)=>{
				return pushToRegistry(img);
			})
			.then((data)=>{
				console.log("[Seeding] successful " + srcImage + ' to ' + targetImage);
				resolve();
			})
			.catch((err)=>{
				console.log("[Seeding] FAILED " + srcImage + ' to ' + targetImage,err);
				reject(err);
			});
		});

	});
};
exports.updateSeedImage = updateSeedImage;

const startContainer = function (container) {
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
			cont.inspect()
			.then((info) => {
				cont.remove({force: true}, (err, data) => {
					if (err) {
						console.log("[remove]" + err);
						reject(err);
						return;
					}
					const name = repoTagToName(info.Name);
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

const launchPlatformContainer = function (containerName ,config , networks = [], wait = 0) {
	return new Promise((resolve,reject)=>{
		pullImage(config.name + ":latest")
				.then(() => {
					return httpsHelper.createClientCert(containerName);
				})
				.then((httpsCerts) => {

					if(!Array.isArray(config.Env)) {
						config.Env = [];
					}

					config.Env.push("CM_HTTPS_CA_ROOT_CERT=" + httpsHelper.getRootCert());
					config.Env.push("HTTPS_SERVER_CERT=" + httpsCerts.clientcert);
					config.Env.push("HTTPS_SERVER_PRIVATE_KEY=" + httpsCerts.clientprivate);
					return docker.createContainer(config);
				})
				.then((cont) => {
					return startContainer(cont);
				})
				.then((cont) => {
					
					return new Promise((resolve,reject)=>{
						const inSeq = (nets) => {
								dockerHelper.connectToNetwork(cont,nets.pop())
								.then(()=>{
									if(nets.length > 0) {
										inSeq(nets);
									} else {
										resolve(cont);
									}
								})
								.catch((err)=>{
									reject(err);
								}); 
						};
						inSeq(networks);
					});
	
				})
				.then((cont) => {
					if(wait > 0) {
						console.log("waiting for " + containerName + " ....");
					}
					setTimeout(resolve,wait,cont);
				})
				.catch((err)=>{
					reject(err);
				});
	}); 
};

exports.launchLocalAppStore = function() {
	return new Promise((resolve, reject) => {
		const name = Config.localAppStoreName + ARCH;
		const config = {
						'hostname': name,
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true,
						'Env': [
									"LOCAL_MODE=1", //force local mode to disable login
									"PORT=8181"
							   ],
						'Binds':["/tmp/databoxAppStore:/data/db"],
						'PortBindings': {'8181/tcp': [{ HostPort: '8181' }]} //expose ports for the mac
					};

		launchPlatformContainer(Config.localAppStoreName,config,['databox-cloud-net'],3000)
			.then(()=>{
				resolve();
			})
			.catch((error)=>{
				console.log("[launchLocalAppStore]",error);
				reject(error);
			});
	});
};

exports.launchLocalRegistry = function() {
	return new Promise((resolve, reject) => {
		const name = Config.localRegistryName + ARCH;
		pullDockerIOImage(Config.localRegistryImage + ":latest")
		    .then(() => {
				return httpsHelper.createClientCert(Config.localRegistryName);
			})
			.then((httpsCerts) => {
				return docker.createContainer(
					{
						'hostname': name,
						'name': name,
						'Image': Config.localRegistryImage + ":latest",
						'PublishAllPorts': true,
						'Env': [
									"HTTPS_SERVER_CERT=" + httpsCerts.clientcert,
									"HTTPS_SERVER_PRIVATE_KEY=" + httpsCerts.clientprivate,
							   ],
						'Binds':["/tmp/databoxregistry:/var/lib/registry"],
						'PortBindings': {'5000/tcp': [{ HostPort: '5000' }]} //expose ports for the mac
					}
				);
			})
			.then((Reg) => {
				Reg.name = name;
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
var DATABOX_ARBITER_PORT = '8080';
exports.launchArbiter = function () {
	return new Promise((resolve, reject) => {
		const name = "databox-arbiter" + ARCH;
		arbiterName = name;
		let config = {
						'hostname': name,
						'name': name,
						'Image': Config.registryUrl + "/" + name + ":latest",
						'PublishAllPorts': true,
						'Env': [],
						'PortBindings': {'8080/tcp': [{ HostPort: DATABOX_ARBITER_PORT }]} //expose ports for the mac
					};
		generateArbiterToken()
			.then((arbKey)=>{
				arbiterKey = arbKey;
				config.Env.push("CM_KEY=" + arbKey);
				const networks = ['databox-driver-net','databox-app-net','databox-cm-arbiter-net'];
				launchPlatformContainer(name,config,networks,5000)
					.then((Arbiter)=>{
						console.log("[databox-arbiter] Launched");
						DATABOX_ARBITER_ENDPOINT = 'https://' + Arbiter.name + ':' + DATABOX_ARBITER_PORT;
						resolve({'name': Arbiter.name, 'port': Arbiter.port, 'CM_KEY': arbiterKey, });
					});
			})
			.catch((error)=>{
				console.log("\n#################### Error creating Arbiter ######################\n");
				reject(error);
			});
	});
};


var DATABOX_LOGSTORE_ENDPOINT = null;
var DATABOX_LOGSTORE_NAME = "databox-logstore";
var DATABOX_LOGSTORE_PORT = 8080;
exports.launchLogStore = function () {

	return new Promise((resolve, reject) => {
		const name = DATABOX_LOGSTORE_NAME + ARCH;
		let config = {
						'name': name,
						'Image': Config.registryUrl + '/' + name + ":latest",
						'PublishAllPorts': true,
						'Env': [],
						'Binds':["/tmp/databoxLogs:/database"],
					};
		let arbiterToken = "";
		generateArbiterToken()
			.then((arbKey)=>{
				arbiterToken = arbKey;
				config.Env.push("ARBITER_TOKEN=" + arbiterToken);
				const networks = ['databox-driver-net','databox-app-net'];
				launchPlatformContainer(DATABOX_LOGSTORE_NAME,config,networks)
				.then((logstore) => {
					console.log('[' + name + '] Passing token to Arbiter');
					const update = {name: name, key: arbiterToken, type: logstore.type};
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
	});
};

var DATABOX_EXPORT_SERVICE_ENDPOINT = null;
var DATABOX_EXPORT_SERVICE_HOSTNAME = null;
var DATABOX_EXPORT_SERVICE_PORT = 8080;
exports.launchExportService = function () {

	return new Promise((resolve, reject) => {
		const name = "databox-export-service" + ARCH;
		let arbiterToken = "";
		let config = {
						'name': name,
						'Image': Config.registryUrl + '/' + name + ":latest",
						'PublishAllPorts': true,
						'Env': []
					};
		generateArbiterToken()
		.then((arbKey)=>{
				arbiterToken = arbKey;
				config.Env.push("ARBITER_TOKEN=" + arbiterToken);
				const networks = ['databox-external','databox-driver-net'];
				launchPlatformContainer(DATABOX_LOGSTORE_NAME,config,networks)
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
		});
};


const repoTagToName = function (repoTag) {
	return repoTag.match(/(?:.*\/)?([^/:\s]+)(?::.*|$)/)[1];
};

const generateArbiterToken = function () {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(32, function (err, buffer) {
			if (err) reject(err);
			var token = buffer.toString('base64');
			resolve(token);
		});
	});
};

const configureDriver = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-driver-net')
			.then(resolve(container))
			.catch((err) => reject(err));
	});
};

const configureApp = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-app-net')
			.then(resolve(container))
			.catch((err) => reject(err));
	});
};

const configureStore = function (container) {
	return new Promise((resolve, reject) => {
		dockerHelper.connectToNetwork(container, 'databox-driver-net')
		.then(()=> {
			return dockerHelper.connectToNetwork(container, 'databox-app-net');
		})
		.then(resolve(container))
		.catch((err) => reject(err));
	});
};

const updateArbiter = function (data) {
	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return getContainerInfo(Arbiter);
			})
			.then((arbiterInfo) => {
				const options = {
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

const updateContainerPermissions = function (permissions) {

	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return getContainerInfo(Arbiter);
			})
			.then((arbiterInfo) => {
				const options = {
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

const revokeContainerPermissions = function (permissions) {
	return new Promise((resolve, reject) => {
		getContainer(arbiterName)
			.then((Arbiter) => {
				return getContainerInfo(Arbiter);
			})
			.then((arbiterInfo) => {
				const options = {
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

const launchDependencies = function (containerSLA) {
	let promises = [];
	for (let requiredType in containerSLA['resource-requirements']) {

		let rootContainerName = containerSLA['resource-requirements'][requiredType];
		let requiredName = containerSLA.name + "-" + containerSLA['resource-requirements'][requiredType] + ARCH;

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
					//Look for an SLA to use. If one is not provided then, look for one in the app store
					Promise.resolve()
					.then(()=>{
						const options = {
											'url': '', 
											'method': 'GET'
										};
						if (DATABOX_DEV) {
							options.url = "http://" + Config.localAppStoreName + ":8181" + '/app/get?name=' + rootContainerName;
						} else {
							options.url = Config.storeUrl + '/app/get?name=' + rootContainerName;
						}
						return new Promise((resolve, reject) => {
							request(options, (error, response, body) => {
								if (error) {
									console.log("Error: " + options.url);
									reject(error);
									return;
								}
								let manifest = JSON.parse(body).manifest;
								if(typeof manifest === 'undefined') {
									reject("[Error] Manifest not found on app store");
								} else {
									manifest.name = rootContainerName;
									manifest.localContainerName = requiredName;
									resolve(manifest);
								}
							});

						});
					})
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
						return reject("Required container could not be installed!", err);
					});
				});
		}));
	}
	return Promise.all(promises);
};

const launchContainer = function (containerSLA) {
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
		],
		'PublishAllPorts': true,
		'NetworkingConfig': {
			'Links': [arbiterName]
		}
	};

	let readProms = [];

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
																								//TODO undo nasty hack
						config.Env.push(dependency.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace("_ARM",'') + "_ENDPOINT=" + 'https://' + dependency.name + ':8080');
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

				if('databox-type' in containerSLA && containerSLA['databox-type'] == 'store' && 'volumes' in containerSLA) {
					let binds = [];
					console.log('[Adding volumes]', containerSLA.localContainerName, containerSLA.volumes);
					for(let vol of containerSLA.volumes) {
						binds.push("/tmp/"+containerSLA.localContainerName+"-"+vol.replace('/','')+":"+vol);
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
 				proms.push(docker.createContainer(config));
 				return Promise.all(proms);
			})
			.then((results) => {
				return startContainer(results[results.length - 1]);
			})
			.then((container) => {
			        proms = [];

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
				const update = {name: containerSLA.localContainerName, key: arbiterToken, type: container.type};
				proms.push(updateArbiter(update));

				proms.push(dockerHelper.disconnectFromNetwork(container, 'bridge'));
				return Promise.all(proms);
			})
			.then(() => {
				//grant write access to requested stores
				const dependentStores = launched.filter((itm)=>{ return itm.type == 'store'; });
				for(let store of dependentStores) {

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


const saveSLA = function (sla) {
	//console.log('[' + sla.name + '] Saving SLA');
	return db.putSLA(sla.name, sla);
};
exports.saveSLA = saveSLA;

exports.restoreContainers = function (slas) {
	return new Promise((resolve, reject)=> {
		let infos = [];
		let result = Promise.resolve();
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

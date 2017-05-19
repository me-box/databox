const Config = require('./config.json');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const request = require('request');
const https = require('https');
const url = require('url');

const Docker = require('dockerode');
const docker = new Docker();
const db = require('./include/container-manager-db.js');
const dockerHelper = require('./include/container-manager-docker-helper.js');

const ip = '127.0.0.1';
const arbiterKey = fs.readFileSync("/run/secrets/CM_KEY",{encoding:'base64'});

const arbiterName =  "databox-arbiter" + ARCH;
const DATABOX_ARBITER_ENDPOINT = "https://databox-arbiter:8080";
const DATABOX_LOGSTORE_ENDPOINT = "https://databox-logstore:8080";
const DATABOX_LOGSTORE_NAME = "databox-logstore";
const DATABOX_EXPORT_SERVICE_ENDPOINT = "https://databox-export-service:8080";

const certPath = './certs'

//setup dev env
const DATABOX_DEV = process.env.DATABOX_DEV;
if(DATABOX_DEV == 1) {
	Config.registryUrl = '';
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
		ca: fs.readFileSync("/run/secrets/DATABOX_ROOT_CA")
	};
	arbiterAgent = new https.Agent(agentOptions);
};

const installFromSLA = async function (sla) {
	return new Promise (async (resolve,reject)=>{

		let name = repoTagToName(sla.name) + ARCH;

		//set the local name of the container. Containers launched as dependencies
		//have their local name set to [rootContainerName]-[dependentContainerName]
		if(!("localContainerName" in sla)) {
			sla.localContainerName = name;
		}

		console.log('[' + name + '] Launching');

		//let config = loadGlobalDockerConfig();
		let containerConfig = {
						"Name": "",
						"TaskTemplate": {
							"ContainerSpec": {
								"Image": ""
							},
							"Resources": {
								"Limits": {},
								"Reservations": {}
							},
							"RestartPolicy": {},
							"Placement": {}
						},
						"Mode": {
							"Replicated": {
								"Replicas": 1
							}
						},
						"UpdateConfig": {
							"Parallelism": 1
						},
						"Networks": []
					};
		
		//Get a deep copy! why is this so difficult !!!
		let dependentStoreConfig = JSON.parse(JSON.stringify(containerConfig)); 

		switch(sla['databox-type']) {
			case 'app':
				containerConfig = appConfig(containerConfig,sla);
				containerConfig = await createSecretes(containerConfig,sla)
				dependentStoreConfig = storeConfig(dependentStoreConfig,sla)
				break;
			case 'driver':
				containerConfig = driverConfig(containerConfig,sla);
				containerConfig = await createSecretes(containerConfig,sla)
				dependentStoreConfig = storeConfig(dependentStoreConfig,sla)
				break;
			default:
				reject('Missing or unsupported databox-type in SLA');
				return;
		}
		console.log(JSON.stringify(containerConfig, null, 4));
		saveSLA(sla);

		//UPDATE SERVICES
		if(dependentStoreConfig !== false) {
			console.log("[CM] creating dependent store service " + dependentStoreConfig.Name)
			dependentStoreConfig = await createSecretes(dependentStoreConfig,{"localContainerName": dependentStoreConfig.Name, "databox-type":"store" })
			await docker.createService(dependentStoreConfig)
						.catch((err)=>{ console.log("[ERROR] creating dependent store service ", dependentStoreConfig, err)});
		}
		console.log("[CM] creating service " + containerConfig.Name);
		await docker.createService(containerConfig)
					.catch((err)=>{ console.log("[ERROR] creating service ", containerConfig, err)});
		
		//Add all the permissions for App/driver and any dependent store
		await addPermissionsFromSla(sla)
					  .catch((err)=>{
						  reject("Error adding permissions" + err);
						  return;
					  });

		resolve([containerConfig.Name,dependentStoreConfig.Name || "NO STORE"]);
	});
};
exports.installFromSLA = installFromSLA;


const createSecretes = async function (config,sla) {
	console.log("createSecretes")
	
	let secrets = await docker.listSecrets({});

	//add DATABOX_ROOT_CA
	let rootCA = secrets.filter((itm)=>{ return itm.Spec.Name == 'databox_DATABOX_ROOT_CA'})
	rootCA = rootCA[0];
	console.log(rootCA);
	config.TaskTemplate.ContainerSpec.secrets.push({"SecretName":rootCA.Spec.Name, "SecretID":rootCA.ID, "File": {
														"Name": "DATABOX_ROOT_CA",
														"UID": "0",
														"GID": "0",
														"Mode": 292
													}});
	//HTTPS certs
	let certJson = await httpsHelper.createClientCert(sla.localContainerName)
	let certSecretName = sla.localContainerName.toUpperCase() + '_PEM'
	let sec = await docker.createSecret({"Name": certSecretName,"Data": Buffer.from(certJson).toString('base64')})
				.catch((err)=>{console.log('[ERROR] creating HTTPS secrets',err)});
	config.TaskTemplate.ContainerSpec.secrets.push({"SecretName":certSecretName, "SecretID":sec.id, "File": {
														"Name": "DATABOX_PEM",
														"UID": "0",
														"GID": "0",
														"Mode": 292
													}});
	

	//Arbiter token
	let arbiterToken = await generateArbiterToken(sla.localContainerName)
	let arbiterTokenName = sla.localContainerName.toUpperCase() + '_KEY'
    let sec1 = await docker.createSecret({"Name": arbiterTokenName, "Data": arbiterToken})
						  .catch((err)=>{console.log('[ERROR] creating Arbiter token secrets',err)});
	
	config.TaskTemplate.ContainerSpec.secrets.push({"SecretName":arbiterTokenName, "SecretID":sec1.id, "File": {
														"Name": "ARBITER_TOKEN",
														"UID": "0",
														"GID": "0",
														"Mode": 292
													}});

	//update the arbiter
	const update = {name: sla.localContainerName, key: arbiterToken, type: sla['databox-type']};
	await updateArbiter(update);

	return config
}

const driverConfig = function (config,sla) {
	console.log("addDriverConfig")
	
	let localContainerName = sla.name + ARCH;
	
	let driver = { 
				image: Config.registryUrl + localContainerName,
				Env: [ 
								"DATABOX_LOCAL_NAME=" + localContainerName,
								"DATABOX_ARBITER_ENDPOINT=" + DATABOX_ARBITER_ENDPOINT,
							],
				secrets: [ ]
			};
	
	if(sla['resource-requirements'] && sla['resource-requirements']['store']) {
		let storeName = sla.name + "-" + sla['resource-requirements']['store'] + ARCH;
		driver.Env.push("DATABOX_STORE_ENDPOINT=https://" + storeName + ":8080");
	}


	config.Networks.push({Target:'databox_databox-driver-net'});
	config.Name = localContainerName
	config.TaskTemplate.ContainerSpec = driver
	config.TaskTemplate.Placement.constraints = ["node.role == manager"]
	
	return config;
};

const appConfig = function (config,sla) {
	let localContainerName = sla.name + ARCH;
	let app = { 
				image: Config.registryUrl + localContainerName,
				Env: [ 
								"DATABOX_LOCAL_NAME=" + localContainerName,
								"DATABOX_ARBITER_ENDPOINT=" + DATABOX_ARBITER_ENDPOINT,
								"DATABOX_LOGSTORE_ENDPOINT=" + DATABOX_LOGSTORE_ENDPOINT + '/' + localContainerName, 
								"DATABOX_EXPORT_SERVICE_ENDPOINT=" + DATABOX_EXPORT_SERVICE_ENDPOINT 
							],
				secrets: [  ]
			};
	
	if ('packages' in sla) {
		for (let manifestPackage of sla.packages) {
			let packageEnabled = 'enabled' in manifestPackage ? manifestPackage.enabled : false;
			config.Env.push("PACKAGE_" + manifestPackage.id + "=" + packageEnabled);
		}
	}

	config.Networks.push({Target:'databox_databox-app-net'});
	config.Name = localContainerName
	config.TaskTemplate.ContainerSpec = app
	config.TaskTemplate.Placement.constraints = ["node.role == manager"]
	return config;
};

const storeConfig = function (config,sla) {
	console.log("addStoreConfig")
	if(!sla['resource-requirements'] || !sla['resource-requirements']['store']) {
		return false;
	}

	let rootContainerName = sla['resource-requirements']['store'];
	let requiredName = sla.name + "-" + sla['resource-requirements']['store'] + ARCH;

	let store = { 
				image: rootContainerName,
				volumes: [ ],
				Env: [ 
								"DATABOX_LOCAL_NAME=" + requiredName,
								"DATABOX_ARBITER_ENDPOINT=" + DATABOX_ARBITER_ENDPOINT,
								"DATABOX_LOGSTORE_ENDPOINT=" + DATABOX_LOGSTORE_ENDPOINT + '/' + requiredName, 
							],
				secrets: [ ]
			};
	
	config.Networks.push({Target:'databox_databox-driver-net'});
	config.Networks.push({Target:'databox_databox-app-net'});

	if('volumes' in sla) {
		for(let vol of sla.volumes) {
			store.volumes("/tmp/"+requiredName+"-"+vol.replace('/','')+":"+vol);
		}
	}

	if ('datasources' in sla) {
		for (let datasource of sla.datasources) {
			config.Env.push("DATASOURCE_" + datasource.clientid + "=" + JSON.stringify(datasource.hypercat));
		}
	}

	config.Name = requiredName
	config.TaskTemplate.ContainerSpec = store
	config.TaskTemplate.Placement.constraints = ["node.role == manager"]
	return config;
};

async function addPermissionsFromSla (sla) {

	console.log("addPermissionsFromSla",sla);

	let localContainerName = sla.name + ARCH;

	let type = sla['databox-type'];

	proms = [];

	//set export permissions from export-whitelist
	if(sla['export-whitelist'] && type == 'app') {

		let urlsString = sla['export-whitelist'].map((itm)=>{return '"' + itm.url + '"';}).join(',');

		console.log("[Adding Export permissions for " + localContainerName + "] on " + urlsString);
			proms.push(updateContainerPermissions({
											name: localContainerName,
											route: {target:DATABOX_EXPORT_SERVICE_HOSTNAME, path: '/export/', method:'POST'},
											caveats: [ "destination = [" + urlsString + "]" ]
										}));
			proms.push(updateContainerPermissions({
											name: localContainerName,
											route: {target:DATABOX_EXPORT_SERVICE_HOSTNAME, path: '/lp/export/', method:'POST'},
											caveats: [ "destination = [" + urlsString + "]" ]
										}));
	}

	//set read permissions from the sla for DATASOURCES.
	if(sla.datasources && type == 'app') {
		for(let allowedDatasource of sla.datasources) {
			if(allowedDatasource.endpoint) {
				let datasourceEndpoint = url.parse(allowedDatasource.endpoint);
				let datasourceName = allowedDatasource.datasource;

				var isActuator = allowedDatasource.hypercat['item-metadata'].findIndex((itm)=>{return (itm.rel === 'urn:X-databox:rels:isActuator') && (itm.val === true) ; });
			
				if(isActuator !== -1) {
					//its an actuator we need write access
					proms.push(updateContainerPermissions({
											name: localContainerName,
											route: {target:datasourceEndpoint.hostname, path: '/'+datasourceName+'/*', method:'POST'}
										}));
				}

				proms.push(updateContainerPermissions({
					name: localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/status', method: 'GET'}
				}));

				proms.push(updateContainerPermissions({
					name: localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/' + datasourceName, method: 'GET'}
				}));

				proms.push(updateContainerPermissions({
					name: localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/' + datasourceName + '/*', method: 'GET'}
				}));

				proms.push(updateContainerPermissions({
					name: localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/ws', method: 'GET'}
				}));

				proms.push(updateContainerPermissions({
					name: localContainerName,
					route: {target: datasourceEndpoint.hostname, path: '/sub/' + datasourceName + '/*', method: 'GET'}
				}));
			}
		}
	}

	//Add permissions for dependent stores 
	if(sla['resource-requirements'] && sla['resource-requirements']['store']) {
		let store = {};
		store.name = sla.name + "-" + sla['resource-requirements']['store'] + ARCH;
		console.log("SLA:",store,sla);

		//Read /cat for CM
		console.log('[Adding read permissions] for databox-container-manager on ' + store.name + '/cat');
		proms.push(updateContainerPermissions({
			name: 'databox-container-manager',
			route: {target: store.name, path: '/cat', method:'GET'}
		}));
		
		//Read /status
		console.log('[Adding read permissions] for ' + localContainerName + ' on ' + store.name + '/status');
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/status', method:'GET'}
		}));
		
		//Read /ws
		console.log('[Adding read permissions] for ' + localContainerName + ' on ' + store.name + '/ws');
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/ws', method:'GET'}
		}));
		
		console.log('[Adding read permissions] for ' + localContainerName + ' on ' + store.name + '/sub/*');
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/sub/*', method:'GET'}
		}));
		
		console.log('[Adding read permissions] for ' + localContainerName + ' on ' + store.name + '/unsub/*');
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/unsub/*', method:'GET'}
		}));

		//Write to all endpoints on dependent store
		console.log('[Adding write permissions] for ' + localContainerName + ' on ' + store.name);
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/*', method:'POST'}
		}));

		//Read to all endpoints on dependent store (sometimes its nice to read what you have written)
		console.log('[Adding read permissions] for ' + localContainerName + ' on ' + store.name);
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/*', method:'GET'}
		}));

		//Write to /cat on dependent store
		console.log('[Adding write permissions] for ' + localContainerName + ' on ' + store.name + '/cat');
		proms.push(updateContainerPermissions({
			name: localContainerName,
			route: {target: store.name, path: '/cat', method:'POST'}
		}));

		//Grant permissions for the store to write to the log
		console.log('[Adding write permissions] for ' + store.name + ' on ' + DATABOX_LOGSTORE_NAME + '/' + store.name);
		proms.push(updateContainerPermissions({
			name: store.name,
			route: {target: DATABOX_LOGSTORE_NAME, path: '/' + store.name , method:'POST'}
		}));

	}

	return Promise.all(proms);
}


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

const getContainer = function (id) {
	return Promise.resolve(docker.getContainer(id));
};
exports.getContainer = getContainer;

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



const repoTagToName = function (repoTag) {
	return repoTag.match(/(?:.*\/)?([^/:\s]+)(?::.*|$)/)[1];
};

async function generateArbiterToken (name) {
	return new Promise((resolve, reject) => {
			crypto.randomBytes(32, function (err, buffer) {
				if (err) reject(err);
				var token = buffer.toString('base64');
				resolve(token);
			});
		});
};
exports.generateArbiterToken = generateArbiterToken;


const updateArbiter = async function (data) {
	return new Promise(async (resolve, reject) => {
		console.log("[updateArbiter] DONE");
		const options = {
				url: DATABOX_ARBITER_ENDPOINT + "/cm/upsert-container-info",
				method:'POST',
				form: data,
				agent: arbiterAgent,
				headers: {
					'x-api-key': arbiterKey
				}
			};
			console.log(options);
		request(
			options,
			function (err, response, body) {
				if (err) {
					reject(err);
					return;
				}
				console.log("[updateArbiter] DONE");
				resolve(JSON.parse(body));
			});
	});
			
};
exports.updateArbiter = updateArbiter;

const updateContainerPermissions = function (permissions) {

	return new Promise((resolve, reject) => {
		
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
		});
};

const revokeContainerPermissions = function (permissions) {
	return new Promise((resolve, reject) => {
		
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
			
	});
};

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

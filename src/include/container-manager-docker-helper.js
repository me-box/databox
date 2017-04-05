/*jshint esversion: 6 */

const Docker = require('dockerode');
const DockerEvents = require('docker-events');
const docker = new Docker();
const dockerEmitter = new DockerEvents({docker:docker});


exports.createNetwork = function(name, external) {
    return new Promise((resolve,reject)=>{
      docker.createNetwork({
        Name: name,
        Driver: 'bridge',
        Internal: !external
      })
      .then(()=>{
        resolve();
      });
    })
    .catch(()=>{
      //if the network exists it will fail with Error: socket hang up
      // so lets ignore it.
      resolve();
    });
};

const getNetwork = function(networks, name) {
  return new Promise( (resolve, reject) =>  {
    for(const i in networks) {
          const net = networks[i];
          if(net.Name === name) {
            const n = docker.getNetwork(net.Id);
            resolve(n);
            return;
          }
      }

      reject("[getNetwork] networks not found");
            
  });
};
exports.getNetwork = getNetwork;


exports.connectToNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    console.log('[' + (container.name || container.Name) + '] Connecting to ' + networkName);
    docker.listNetworks({})
    .then( (nets) => { return getNetwork(nets,networkName)})
    .then( (net) => {
        net.connect({'Container':container.id}, (err,data) => {
          if(err) {
            reject("Can't connect to network" + err);
            return;
          }
          resolve(container);
        });
      })
      .catch(err => reject('[connectToNetwork]' + err))
  });
};


exports.disconnectFromNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    docker.listNetworks({})
    .then( (nets) => { return getNetwork(nets,networkName)})
    .then( (net) => {
        net.disconnect({'Container':container.id}, (err,data) => {
          if(err) {
            reject("Can't disconnect from network" + err);
            return;
          }
          resolve(container);
        });
      })
      .catch(err => reject('[disconnectFromNetwork]' + err))
  });
};


exports.createContainer = function(opts) {
  return new Promise( (resolve, reject) =>  {
    //TODO: check opts
    docker.createContainer(opts,(err ,cont) => {
      if(err) {
        reject('createContainer'+err);
        return;
      }
      resolve(cont);
    });
  });
};


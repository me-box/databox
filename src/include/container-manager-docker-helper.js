/*jshint esversion: 6 */

const Docker = require('dockerode');
const DockerEvents = require('docker-events');
const docker = new Docker();
const dockerEmitter = new DockerEvents({docker:docker});


exports.createNetwork = function(networkName, external) {
    return new Promise((resolve,reject)=>{
      getNetwork(networkName)
        .then((net)=>{
            resolve(net);
        })
        .catch((err)=>{
            docker.createNetwork({
              'Name': name,
              'Driver': 'bridge',
              'Internal': !external
            })
            .then(()=>{
              resolve();
            });
        });
  });
};

const getNetwork = function(networkName) {
  return new Promise( (resolve, reject) =>  {
    docker.listNetworks({})
    .then( (networks) => {
      for(const i in networks) {
            const net = networks[i];
            if(net.Name === networkName) {
              const n = docker.getNetwork(net.Id);
              resolve(n);
              return;
            }
        }

        reject("[getNetwork] networks not found",networkName);
    });
  });
};

exports.connectToNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    console.log('[' + (container.name || container.Name) + '] Connecting to ' + networkName);
    getNetwork(networkName)
    .then( (net) => {
        return net.connect({'Container':container.id});
      })
      .then(()=>{
        resolve(container);
      })
      .catch((err) => {
        reject('[connectToNetwork error]',err);
      });
  });
};


exports.disconnectFromNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    getNetwork(networkName)
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

/*jshint esversion: 6 */

const Docker = require('dockerode');
const DockerEvents = require('docker-events');
const docker = new Docker();
const dockerEmitter = new DockerEvents({docker:docker});


exports.createNetwork = function(name, external) {
    return new Promise((resolve,reject)=>{
      docker.listNetworks()
      .then((nets)=>{
        const matching = nets.filter((itm)=>{ return itm.Name === name;});
        if(matching.length > 0 ) {
          resolve();
        } else {
          docker.createNetwork({
            'Name': name,
            'Driver': 'bridge',
            'Internal': !external
          })
          .then(()=>{
            resolve();
          });
        }

      });
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
    .then( (nets) => { return getNetwork(nets,networkName);})
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

/*jshint esversion: 6 */

const Docker = require('dockerode');
const DockerEvents = require('docker-events');
const docker = new Docker();
const dockerEmitter = new DockerEvents({docker:docker});


exports.createNetwork = function(name, external) {
  return new Promise( (resolve, reject) =>  {
    docker.createNetwork({
        Name: name,
        Driver: 'bridge',
        Internal: !external
      }, (err,data) => {
        if(err) {
          reject("[createNetwork] Can't list networks:", err);
          return;
        }
        resolve(data);
      });
  });
}

var listNetworks = function() {
  return new Promise( (resolve, reject) =>  {
    docker.listNetworks({}, (err,data) => {
      if(err) reject("[listNetworks] Can't list networks");
      resolve(data);
    })
  });
}
exports.listNetworks = listNetworks;

var getNetwork = function(networks, name, external) {
  return new Promise( (resolve, reject) =>  {
    for(i in networks) {
          var net = networks[i];
          if(net.Name === name) {
            var n = docker.getNetwork(net.Id)
            resolve(n)
            return;
          }
      }

      docker.createNetwork({
          Name: name,
          Driver: 'bridge',
          Internal: !external
        }, (err,data) => {
          if(err) {
            reject("[getNetwork] Can't create networks:", err);
            return;
          }
          resolve(data);
        });
  });
}
exports.getNetwork = getNetwork;


exports.connectToNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    console.log('[' + (container.name || container.Name) + '] Connecting to ' + networkName);
    listNetworks({})
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
    listNetworks({})
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
    })
  });
}

exports.inspectContainer = function(cont) {
  return new Promise( (resolve, reject) =>  {
    //TODO: check cont
    cont.inspect((err ,data, cont) => {
      if(err) {
        reject('inspectContainer::'+err);
        return;
      }
      resolve(data);
    })
  });
}

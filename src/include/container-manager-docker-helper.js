var Docker = require('dockerode');
var DockerEvents = require('docker-events');

var docker = new Docker();
var dockerEmitter = new DockerEvents({docker:docker});

exports.getDockerEmitter = function () {
  return dockerEmitter;
}

exports.getDocker = function () {
    return docker;
}

//kill a container without updating the slastore 
exports.kill = function (id) {
  return new Promise( (resolve, reject) =>  {
    container = docker.getContainer(id);
    container.stop({},(err,data) => {
        console.log("killed " + id + "!");
        resolve();
      });
    });
}

//force container removal 
exports.remove = function (id) {
  return new Promise( (resolve, reject) =>  {
    container = docker.getContainer(id);
    container.remove({force: true},(err,data) => {
      if(err) {
        console.log("[remove]" + err);
        reject(err);
        return;
      }
      console.log("removed " + id + "!");
      resolve();
    });
  });
}

exports.createNetwork = function(name) {
  return new Promise( (resolve, reject) =>  {
    docker.createNetwork({Name:name,Driver:'bridge'}, (err,data) => {
      if(err) {
        reject("[createNetwork] Can't list networks");
        return;
      }
      resolve(data);
    })
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

var getNetwork = function(networks, name) {
  return new Promise( (resolve, reject) =>  {
    for(i in networks) {
          var net = networks[i];
          if(net.Name === name) {
            var n = docker.getNetwork(net.Id)
            resolve(n)
            return;
          }
      }
      console.log("Network " + name + " not found!");
      docker.createNetwork({'Name': name, 'Driver': 'bridge'}, (err,data) => {
        if(err) reject("[getNetwork] Can't create networks")
        resolve(data);
      })
  });
}
exports.getNetwork = getNetwork;


exports.connectToNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    console.log('[' + container.name + '] Conecting to ' + networkName);
    listNetworks({})
    .then( (nets) => { return getNetwork(nets,networkName)})
    .then( (net) => {
        net.connect({'Container':container.id}, (err,data) => {
          if(err) {
            reject("Can't conect to network" + err);
            return;
          }
          resolve(container);
        });
      })
      .catch(err => reject('[connectToNetwork]' + err))
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
var Docker = require('dockerode');
var Promise = require('promise');
var Config = require('./config.json');
var ursa = require('ursa');
var DockerEvents = require('docker-events');

var docker = new Docker(); 
var dockerEmitter = new DockerEvents(docker);


exports.connect  = function () {
  
  return new Promise( (resolve, reject) => docker.ping(function (err,data) {

    if(err) reject("Cant connect to docker!");

    resolve();

  }));

}

exports.getDocker = function () {
  return docker;
}

exports.getDockerEmitter = function () {
  return dockerEmitter;
}

var listContainers = function(){
  return new Promise( (resolve, reject) =>  {

    docker.listContainers({all: true, filters: { "label": [ "databox.type" ] }}, 
    //docker.listContainers({all: true}, 
        (err, containers) => {
          if(err) reject(err);
          resolve(containers);
        }
      );

  });
}
exports.listContainers = listContainers;

var listImages = function(){
  return new Promise( (resolve, reject) =>  {

    docker.listImages({filters: { "label": [ "databox.type" ] }}, 
    //docker.listContainers({all: true}, 
        (err, containers) => {
          if(err) reject(err);
          resolve(containers);
        }
      );

  });
}
exports.listImages = listImages;

var kill = function (id) {
  return new Promise( (resolve, reject) =>  {
    container = docker.getContainer(id);
    container.stop({},(err,data) => {
      if(err) reject(err);
      container.remove({},(err,data) => {
        if(err) reject(err);
        console.log("killed " + id + "!");
        resolve();
      });
    });
  });
}

exports.killAll = function () {
  return new Promise( (resolve, reject) =>  {
    listContainers()
    .then(containers => {
      ids = []
      containers.forEach((e, i) => {
        console.log("killing " + e.Image + " id=" + e.Id + " ...");
        ids.push(kill(e.Id));
      });
      Promise.all(ids)
      .then(() => {resolve()})
      .catch(err => reject(err))
      
    })
    .catch(err => reject(err))
  });
}

exports.initNetworks = function () {
  return new Promise( (resolve, reject) =>  {
      
      var listNetworks = function(networks, name) {
        return new Promise( (resolve, reject) =>  {
          docker.listNetworks({}, (err,data) => {
            if(err) reject("[listNetworks] Can't list networks");
            resolve(data);
          })
        });
      }

      var getNetwork = function(networks, name) {
        return new Promise( (resolve, reject) =>  {
          for(net in networks) {
                if(net.Name === name) {
                  var n = docker.getNetwork(net.Id)
                  //console.log(n)
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

      listNetworks({})
        .then(networks => {
          var requiredNets =  [  
                      getNetwork('databox-driver-net'), 
                      getNetwork('databox-app-net')
                    ]

          return Promise.all(requiredNets)
              .then((networks) => {
                console.log("Networks already exist");
                console.log(networks);
                resolve(networks);
              })
              .catch(networks => {
                console.log("Creating networks")
                //TODO:  NEED TO BE WRITTEN!!
              })

        })
        .then( (networks) => {
          resolve(networks)
        });
    })
    .catch(err => reject(err))
  };


var pullImage = function (imageName) {
  return new Promise( (resolve, reject) =>  {
    //Pull latest Arbiter image
      console.log('Pulling ' + imageName);
      docker.pull(Config.registryUrl + imageName, (err,stream) => {
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
        })
      
      })
  });
}
exports.pullImage = pullImage;

 var generatingCMkeyPair = function () {
  return new Promise( (resolve, reject) =>  {
        //Generating CM Key Pair
        console.log('Generating CM key pair');
        var keyPair = ursa.generatePrivateKey();
        var publicKey = keyPair.toPublicPem('base64');
        resolve({'keyPair':keyPair,'publicKey':publicKey});
  });
}

var createContainer = function(opts) {
  return new Promise( (resolve, reject) =>  {
    //TODO: check opts
    docker.createContainer(opts,(err ,cont) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(cont);
    })
  });
}

var startContainer = function(cont) {
  return new Promise( (resolve, reject) =>  {
    //TODO: check cont
    cont.start((err ,data, cont) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(cont);
    })
  });
}

exports.launchArbiter = function () {
  return new Promise( (resolve, reject) =>  {
    
    pullImage("/databox-arbiter:latest")
    .then(() => {return generatingCMkeyPair()})
    .then(keys => {
        console.log(keys);
        return createContainer(
              {'Name': 'arbiter',
               'Image': Config.registryUrl + "/databox-arbiter:latest",
               //PortBindings: '8080/tcp': [ HostPort: \8081 ]
               'PublishAllPorts': true,
               'Env': [ "CM_PUB_KEY=" + keys['publicKey'] ]
            }
          );
      })
    .then((Arbiter) => { return startContainer(Arbiter) })
    .then((Arbiter) => { resolve(Arbiter) })
    .catch((err) => {
      console.log("Error creating Arbiter");
      reject(err)
    });

  });
}
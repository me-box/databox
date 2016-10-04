var Docker = require('dockerode');
var Promise = require('promise');
var Config = require('./config.json');
var ursa = require('ursa');
var DockerEvents = require('docker-events');
var os = require('os');
var crypto = require('crypto');
var request = require('request');

var docker = new Docker(); 
var dockerEmitter = new DockerEvents({docker:docker});

var ip = '127.0.0.1';

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
          if(err) {
            reject(err);
            return;
          }
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
          if(err) {
            reject(err);
            return;
          }
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
        console.log("killed " + id + "!");
        resolve();
      });
    });
}

var remove = function (id) {
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

exports.killAll = function () {
  return new Promise( (resolve, reject) =>  {
    listContainers()
    .then(containers => {
      ids = []
      for(var i in containers) {
        var e = containers[i];
        console.log("killing " + e.Image + " id=" + e.Id + " ...");
        ids.push(kill(e.Id));
        console.log("removing " + e.Image + " id=" + e.Id + " ...");
        ids.push(remove(e.Id));
      };
      return Promise.all(ids)   
    })
    .then((data) => {resolve()}) 
    .catch(err => {consol.log("[killAll-2]" + err); reject(err)})
  });
}

var listNetworks = function(networks, name) {
  return new Promise( (resolve, reject) =>  {
    docker.listNetworks({}, (err,data) => {
      if(err) reject("[listNetworks] Can't list networks");
      resolve(data);
    })
  });
}

var createNetwork = function(name) {
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

var getContainer = function(id) {
  return new Promise( (resolve, reject) =>  {
    resolve(docker.getContainer(id));
  });
}
exports.getContainer = getContainer;

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

var connectToNetwork = function (container, networkName) {
  return new Promise( (resolve, reject) =>  {
    console.log("Conecting container to " + networkName);
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
}

exports.initNetworks = function () {
  return new Promise( (resolve, reject) =>  {
      
      listNetworks({})
        .then(networks => {
          var requiredNets =  [  
                      getNetwork(networks,'databox-driver-net'), 
                      getNetwork(networks,'databox-app-net')
                    ]

          return Promise.all(requiredNets)
              .then((networks) => {
                console.log("Networks already exist");
                //console.log(networks);
                resolve(networks);
              })
              .catch(err => {
                //console.log("Creating networks")
                reject(err);
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

var keyPair = null;
var generatingCMkeyPair = function () {
return new Promise( (resolve, reject) =>  {
      //Generating CM Key Pair
      console.log('Generating CM key pair');
      keyPair = ursa.generatePrivateKey();
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
    cont.start((err ,data) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(cont);
    })
  });
}

var inspectContainer = function(cont) {
  return new Promise( (resolve, reject) =>  {
    //TODO: check cont
    cont.inspect((err ,data, cont) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(data);
    })
  });
}

exports.launchArbiter = function () {
  return new Promise( (resolve, reject) =>  {
    
    pullImage("/databox-arbiter:latest")
    .then(() => {return generatingCMkeyPair()})
    .then(keys => {
        //console.log(keys);
        return createContainer(
              {'name': 'arbiter',
               'Image': Config.registryUrl + "/databox-arbiter:latest",
               //PortBindings: '8080/tcp': [ HostPort: \8081 ]
               'PublishAllPorts': true,
               'Env': [ "CM_PUB_KEY=" + keys['publicKey'] ]
            }
          );
      })
    .then((Arbiter) => { return startContainer(Arbiter) })
    .then((Arbiter) => { 
      console.log("conecting to driver network");
      return connectToNetwork(Arbiter,'databox-driver-net');          
    })
    .then((Arbiter) => { 
      console.log("conecting to app network");
      return connectToNetwork(Arbiter,'databox-app-net');          
    })
    .then((Arbiter) => {return inspectContainer(Arbiter)} ) 
    .then((data) => { resolve({'name': 'arbiter', port: parseInt(data.NetworkSettings.Ports['8080/tcp'][0].HostPort) }) })
    .catch((err) => {
      console.log("Error creating Arbiter");
      reject(err)
    });

  });
}

exports.launchDirectory = function () {
  return new Promise( (resolve, reject) =>  {
    
    pullImage("/databox-directory:latest")
    .then(() => {
        return createContainer(
              {'name': 'directory',
               'Image': Config.registryUrl + "/databox-directory:latest",
               'PublishAllPorts': true
            }
          );
      })
    .then((Directory) => { return startContainer(Directory) })
    .then((Directory) => { 
      console.log("conecting to driver network");
      return connectToNetwork(Directory,'databox-driver-net');          
    })
    .then((Directory) => { 
      console.log("conecting to app network");
      return connectToNetwork(Directory,'databox-app-net');          
    })
    .then((Directory) => {return inspectContainer(Directory)} ) 
    .then((data) => { resolve({'name': 'directory', port: parseInt(data.NetworkSettings.Ports['3000/tcp'][0].HostPort) }) })
    .catch((err) => {
      console.log("Error creating Directory");
      reject(err)
    });

  });
}

var repoTagToName = function (repoTag) {
  return repoTag.match(/(?:.*\/)?([^/:\s]+)(?::.*|$)/)[1];
}

var generateArbiterToken = function () {
  return new Promise( (resolve, reject) =>  {
    crypto.randomBytes(32, function (err, buffer) {
      if(err) reject(err);
      var token = buffer.toString('base64');
      resolve(token)
    });
  });
}

var configureDriver = function (cont) {
  return new Promise( (resolve, reject) =>  {
      connectToNetwork(cont,'databox-driver-net')
      .then(resolve())
      .catch((err) => reject(err))
  });
}

var configureApp = function (cont) {
  return new Promise( (resolve, reject) =>  {
      connectToNetwork(cont,'databox-app-net')
      .then(resolve())
      .catch((err) => reject(err))
  });
}

var configureStore = function (cont) {
  return new Promise( (resolve, reject) =>  {
      connectToNetwork(cont,'databox-driver-net')
      .then(resolve())
      .catch((err) => reject(err))
  });
}

var updateArbiter = function(data) {
  return new Promise( (resolve, reject) =>  {
    getContainer('arbiter')
    .then((Arbiter) => {return inspectContainer(Arbiter)})
    .then((arbiterInfo) => {
      var port = parseInt(arbiterInfo.NetworkSettings.Ports['8080/tcp'][0].HostPort);
      request.post( 
                    { url: "http://localhost:"+port+"/update",
                      form: data
                    }
                    ,
                    function(err, response, body) {
                      if(err) {
                        reject(err);
                        return;
                      }
                      resolve(JSON.parse(body));
                    }
                  )
    })
    .catch((err) => reject(err))
  });
}

//NOTE: Name is optional and will override default
//NOTE: Env is optional and additive
exports.launchContainer = function (repoTag, name, env) {
  
  env = env ? env : [];
  var name = name ? name : repoTagToName(repoTag);
  var arbiterToken = null;
  var type = null;
  var containerInfo = null;
  var container = null;
  var containerPort = null;

  return new Promise( (resolve, reject) =>  {

    pullImage(repoTag)
    .then(() => {
      console.log("Generating Arbiter token for "+name+" container");
      return generateArbiterToken();
    })
    .then((token) => {
      arbiterToken = token;
      return createContainer(
                              {
                                'name': name,
                                'Image': Config.registryUrl + repoTag +":latest",
                                'Env': [ "DATABOX_IP="+ip, "ARBITER_TOKEN="+token ],
                                'PublishAllPorts': true
                              }
                            );
    })
    .then((cont) => {
      container = cont
      return inspectContainer(container)
    })
    //.then((info) => {
    //
    //  console.log("Checking ports exposed by #name container");
    //  TODO: this might be needed here!!
    //})
    .then( (info) => {
      type = info.Config.Labels['databox.type'];

      console.log("Passing "+name+" token to Arbiter");

      var update = JSON.stringify({ name:name, token:arbiterToken, type:type });

      var sig = keyPair.hashAndSign('md5', new Buffer(update)).toString('base64');

      return updateArbiter({data:update, sig });
      
    })
    .then(() => {
      return startContainer(container);
    })
    .then(() => {
      if(type == 'driver') {
        return configureDriver(container);
      } else if(type == 'store') {
        return configureStore(container);
      } else {
        return configureApp(container);
      }
    })
    .then(() => {
      return getContainer(name)
    })
    .then((cont) => {
      return inspectContainer(cont)
    })
    .then( (info) => {
      containerInfo = info;
      containerPort = parseInt(info.NetworkSettings.Ports['8080/tcp'][0].HostPort);
      resolve({name:name, port:containerPort})
    })
    .catch((err) => {
      console.log("[launchContainer ERROR]" + err);
      reject(err);
    });

  });
}
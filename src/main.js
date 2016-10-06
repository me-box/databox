var Promise = require('promise');
var conman = require('./container-manager.js');
var Config = require('./config.json');
var server = require('./server.js');



conman.connect()
  .then( data => { return conman.killAll(data)})
  
  .then( data => { return conman.initNetworks()})
  
  .then( networks => { 
              console.log('Launching Arbiter container');
              return conman.launchArbiter();
            })

  .then( info => { 
              console.log('Setting up proxy to Arbiter');
              return server.proxyContainer(info.name, info.port)
            })

  .then( () => {
      console.log('Launching Directory container');
      return conman.launchDirectory();
  })
  .then( info => { 
              console.log('Setting up proxy to Directory');
              return server.proxyContainer(info.name, info.port)
            })

  .then ( () => { 
            console.log("Starting Server!!");
            return server.launch(Config.serverPort, conman);
        }) 
  .then( () => {
      console.log("--------- Launching saved containers ----------")
      return conman.getActiveSLAs();
  })
  .then( (slas) => {
      return conman.restoreContainers(slas);
  })
  .then( (infos) => {
      console.log(infos);
      var proms = []
      for(var info of infos) {
          console.log(info);
          proms.push(server.proxyContainer(info.name, info.port));
      }
      return new Promise.all(proms);
  })
  .then(() => {
    console.log("--------- Done launching saved containers ----------")
  })
  .catch(err => {
            console.log('ERROR ENDS UP HERE');
            console.log(err);
            var stack = new Error().stack
            console.log( stack )
          });
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
            } ) 
  
  .then( data => { console.log("--------- PROCESSING REQUESTS ----------")})
  .then( () => {

      console.log("Starting some containers!!");
      conman.launchContainer('/databox-vendor-phidgets');
      conman.launchContainer('/databox-driver-mobile')

  })
  .catch(err => {
            console.log(err);
            var stack = new Error().stack
          console.log( stack )
          });
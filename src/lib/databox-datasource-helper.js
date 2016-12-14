
var databoxRequest = require('./databox-request.js');
//var request = require('request');
const WebSocketClient = require('ws');
const httpsAgent = require('./databox-https-agent.js');
const macaroonCache = require('./databox-macaroon-cache.js');
const url = require('url');



/**
 * Register an actuator with a datastore, subscribe for live updates and register callback 
 * 
 * @param {string} storeEndPoint The datastore uri
 * @param {string} driverName The name of the driver registering the datasource 
 * @param {string} actuatorName The name of the actuator (must be unique within a driver datastore pair)
 * @param {string} type The urn:X-databox:rels:sensortype
 * @param {string} unit The measurements unit if applicable 
 * @param {string} description Human readable description
 * @param {string} location A location for the device as a human readable string 
 * @param {function} onDataCallback A function to callback when new data is available i.e where their is a request for actuation.
 * @returns
 */
module.exports.registerActuator = function (storeEndPoint, driverName, actuatorName, type, unit, description, location, onDataCallback) {
  
  return new Promise((resolve, reject) => {
  
    register(storeEndPoint, driverName, actuatorName, type, unit, description, location, true)
    .then(()=>{
      //connect to ws
      return openWS(storeEndPoint);
    })
    .then(() => {
      
      //register callback
      wsCallbacks[actuatorName] = onDataCallback;
      
      //SUB for data
      var options = {
        uri: storeEndPoint+'/sub/'+actuatorName,
        method: "GET"
      };
      console.log("[WS] trying to subscribe for updates.", options);
      databoxRequest(options,(error,response,data)=>{
        if (error) {
          console.log("[ERROR] Can not register actuator subscription with datastore!", error);
          reject(error);
          return;
        } else if(response && response.statusCode != 200) {
          console.log("[ERROR] Can not register actuator subscription with datastore!", body);
          reject(body);
          return;
        }
        console.log("[WS] subscribed for updates for " + actuatorName);
        resolve();
      });
    })
    .catch((err)=>{
      reject(err);
    }) ;
  
  });

};

/**
 * Register a  datasource with a datastore  
 * 
 * @param {string} storeEndPoint The datastore uri
 * @param {string} driverName The name of the driver registering the datasource 
 * @param {string} datasourceName The name of the datasource (must be unique within a driver datastore pair)
 * @param {string} type The urn:X-databox:rels:sensortype
 * @param {string} unit The measurements unit if applicable 
 * @param {string} description Human readable description
 * @param {string} location A location for the device as a human readable string 
 * @param {function} onDataCallback A function to callback when new data is available.
 * @returns
 */
module.exports.registerDatasource = function (storeEndPoint, driverName, datasourceName, type, unit, description, location) {
  return register(storeEndPoint, driverName, datasourceName, type, unit, description, location, false);
};


/**
 *  internal function to register a  datasource or actuator with a datastore
 * 
 * @param {string} storeEndPoint The datastore uri
 * @param {string} driverName The name of the driver registering the datasource 
 * @param {string} datasourceName The name of the datasource (must be unique within a driver datastore pair)
 * @param {string} type The urn:X-databox:rels:sensortype
 * @param {string} unit The measurements unit if applicable 
 * @param {string} description Human readable description
 * @param {string} location A location for the device as a human readable string 
 * @param {bool} isActuator is this an actuator?
 * @returns
 */
register = function (storeEndPoint, driverName, datasourceName, type, unit, description, location, isActuator) {
  var options = {
        uri: storeEndPoint+'/cat/add/'+datasourceName,
        method: 'POST',
        json: 
        {
          "vendor": driverName,
          "sensor_type": type,
          "unit": unit,
          "description": description,
          "location": location,
          "isActuator": isActuator,
        },
    };

  return new Promise((resolve, reject) => {
    
    var register_datasource_callback = function (error, response, body) {
        if (error) {
          console.log("[ERROR] Can not register with datastore! waiting 5s before retrying", error);
          setTimeout(databoxRequest, 5000, options, register_datasource_callback);
          return;
        } else if(response && response.statusCode != 200) {
          console.log("[ERROR] Can not register with datastore! waiting 5s before retrying", body, error);
          setTimeout(databoxRequest, 5000, options, register_datasource_callback);
          return;
        }
        resolve(body);
    };
    console.log("Trying to register with datastore.", options);
    databoxRequest(options,register_datasource_callback);
  
  });
};

/**
 * Waits for a datastore to become active by checking its /status endpoint
 * 
 * @param {string} storeEndPoint uri of the datastore to connect to
 * @returns Promise
 */
module.exports.waitForDatastore = function (storeEndPoint) {
  return new Promise((resolve, reject)=>{
    var untilActive = function (error, response, body) {
      if(error) {
        console.log(error);
      } else if(response && response.statusCode != 200) {
        console.log("Error::", body);
      }
      if (body === 'active') {
        resolve();
      }
      else {
        var options = {
              uri: storeEndPoint + "/status",
              method: 'GET',
              agent: httpsAgent
          };
        setTimeout(() => {
          databoxRequest(options, untilActive);
        }, 1000);
        console.log("Waiting for datastore ....", error, body,options);
      }
    };
    untilActive({});
  });
};


/*
* Web sockets to handle actuator monitoring 
*/
var ws = null; 
var wsCallbacks = {};

/**
 * Open a WebSocket to the datastore if one dose not exist.
 * 
 * @param {string} storeEndPoint uri of the datastore to connect to
 * @returns Promise
 * 
 * TODO: This will not handle multiple datastores! 
 */
function openWS(storeEndPoint) {
  return new Promise((resolve, reject) => {
    
    if(ws === null) {
     
      var wsEndPoint = storeEndPoint+'/ws';

      var urlObject = url.parse(wsEndPoint);
      var path = urlObject.pathname;
      var host = urlObject.hostname;

      console.log("[WS] trying to open WS at" + wsEndPoint);
      macaroonCache.getMacaroon(host)
      .then((macaroon)=>{
        ws = new WebSocketClient(wsEndPoint,{'agent':httpsAgent, headers: {'X-Api-Key': macaroon}});
        ws.on('open', function open() {
          console.log("[WS] for actuator callbacks opened");
          resolve();
        });
      
        ws.on('message', function(data, flags) {
            console.log("[WS] data received",data, flags);
        });

        ws.on('error', function(data, flags) {
            console.log("[WS] ERROR",data, flags);
        });

      })
      .catch((error)=>{
        console.log("[WS] ERROR");
        reject(error);
      });
    } else {
      resolve();
    }
  });
}
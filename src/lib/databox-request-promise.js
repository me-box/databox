
const request = require('request');
const url = require('url');
const httpsAgent = require('./databox-https-agent.js');
const macaroonCache = require('./databox-macaroon-cache.js');

//
//Databox ENV vars
//
const DATABOX_ARBITER_ENDPOINT = process.env.DATABOX_ARBITER_ENDPOINT || "https://databox-arbiter:8080";
const ARBITER_TOKEN = process.env.ARBITER_TOKEN || '';
/**
 * This module wraps the node request module https://github.com/request/request and adds:
 * 
 * 1) an https agent that trust the container manger CA
 * 2) appropriate arbiter token when communicating with the arbiter
 * 3) Requests and caches macaroon form the arbiter before communicating with databox components other then the arbiter.
 *   
 * @param {object} options a request option object (The only required option is uri) 
 * @param {function} callback a call back on completion. The callback argument gets 3 arguments error, response, body 
 */
module.exports = function (options,callback) {
    return new Promise((resolve,reject)=>{

        // TODO handle case where options is a string e.g https://www.some-url.com
        
        //
        // Workout the host and path of the request
        //
        var urlObject = url.parse(options.uri);
        var path = urlObject.pathname;
        var host = urlObject.hostname;
        var protocol = urlObject.protocol;

        //request to arbiter do not need a macaroon but do need the ARBITER_TOKEN
        var isRequestToArbiter = DATABOX_ARBITER_ENDPOINT.indexOf(host) !== -1;

        //request to an external site or dev component 
        //TODO: Lets not hard code these!! 
        var isExternalRequest = host.indexOf('.') !== -1 || host.indexOf("databox-local-registry") !== -1 || host.indexOf("databox-app-server") !== -1;
        
        if(protocol == "https:") {
            //use the databox https agent
            options.agent = httpsAgent;
        }

        if(isRequestToArbiter) {
            options.headers = {'X-Api-Key': ARBITER_TOKEN};
            //do the request and call back when done
            console.log("[databox-request] " + options.uri);
            resolve(request(options,callback));
        } else if (isExternalRequest) {
            //
            // we don't need a macaroon for an external request
            //
            // TODO::EXTERNAL REQUEST SHOULD BE ROOTED THROUGH THE DATABOX WHITELISTING PROXY THING (when its been written!!)
            options.headers = {};
            console.log("[databox-request] ExternalRequest " + options.uri);
            resolve(request(options,callback));
        } else {
            //
            // we are talking to another databox component so we need a macaroon!
            //
            macaroonCache.getMacaroon(host)
            .then((macaroon)=>{
                //do the request and call back when done
                options.headers = {'X-Api-Key': macaroon};
                console.log("[databox-request-with-macaroon] ", options.uri);
                resolve(request(options,callback));
            })
            .catch((result)=>{
                if(result.error !== null) {
                    console.log(result.error);
                    reject(result.error,result.response,null);
                    macaroonCache.invalidateMacaroon(host);
                    return;
                } else if (result.response.statusCode != 200) {
                    //API responded with an error
                    console.log(result.body);
                    reject(result.body,result.response,null);
                    macaroonCache.invalidateMacaroon(host);
                    return;
                } else {
                    console.log(result.body, result.error);
                }
            });
        }
    });
};

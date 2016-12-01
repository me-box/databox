/*jshint esversion: 6 */
var Config = require('../config.json');
var selfsigned = require('selfsigned');
var forge = require('node-forge');
var jsonfile = require('jsonfile');
var fs = require('fs');

var attrs = [{ name: 'commonName', value: 'databox' }];
var config = { days: 365, keySize: 2048, days: 3650, algorithm: 'sha256' };
var rootPems;

const devCertPath = './certs/certs.json';
const devCAPath = './certs/containerManager.crt';

//Generate the CM root cert at startup
var init = function() {
    return new Promise( (resolve, reject) =>  {

        
        jsonfile.readFile(devCertPath, function (err, obj) {
            
            if(err === null) {
                rootPems = obj;
                resolve({rootCAcert:rootPems.cert});
                return;
            }

            selfsigned.generate(attrs, config, function (err, pems) {
                if(err) {
                    reject(err);
                }
                rootPems = pems;
                
                jsonfile.writeFileSync(devCertPath, rootPems);
                fs.writeFileSync(devCAPath, rootPems.cert);             

                reject( 
                    "-----------------------------------------------\n" +
                    "\n"+
                    "\n"+
                    " You will need to add the container manager CA to the docker keychain \n"+
                    "\n"+
                    " \t sudo install -m 044 -D "+devCAPath+" /etc/docker/certs.d/"+Config.registryUrl_dev+"/ca.crt\n"+
                    "\n"+
                    "Then restart docker:\n"+
                    "\n \t sudo service docker restart \n"+
                    "Then restart the container manager:\n"+
                    "\n \t DATABOX_DEV=1 npm start"+
                    "Then run docker:\n"+
                    "\n \t sh ./updateLocalRegistey.sh"+

                    "-----------------------------------------------\n"
                );
                resolve({rootCAcert:rootPems.cert});
            });
        });
            
    });
};

var getRootCert =  function () {
    return rootPems.cert;
};

//based on code extracted from the selfsigned module Licence MIT 
var createClientCert =  function (commonName) {
    
    function toPositiveHex(hexString){
    var mostSiginficativeHexAsInt = parseInt(hexString[0], 16);
    if (mostSiginficativeHexAsInt < 8){
        return hexString;
    }

    mostSiginficativeHexAsInt -= 8;
    return mostSiginficativeHexAsInt.toString() + hexString.substring(1);
    }
    
    return new Promise( (resolve, reject) =>  {

    var pki = forge.pki;
    pem = {};

    var clientkeys = forge.pki.rsa.generateKeyPair(2048);
    var clientcert = forge.pki.createCertificate();
    clientcert.serialNumber = toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9)));
    clientcert.validity.notBefore = new Date();
    clientcert.validity.notAfter = new Date();
    clientcert.validity.notAfter.setFullYear(clientcert.validity.notBefore.getFullYear() + 10);

    var clientAttrs = [{ name: 'commonName', value: commonName }];

    clientcert.setSubject(clientAttrs);
    // Set the issuer to the parent key
    clientcert.setIssuer(attrs);

    clientcert.publicKey = clientkeys.publicKey;

    // Sign client cert with root cert
    try {
        rootPrivateKey = pki.privateKeyFromPem(rootPems.private);
        clientcert.sign(rootPrivateKey);
    } catch (e) {
        reject("ERROR",e);
    }
    pem.clientprivate = forge.pki.privateKeyToPem(clientkeys.privateKey);
    pem.clientpublic = forge.pki.publicKeyToPem(clientkeys.publicKey);
    pem.clientcert = forge.pki.certificateToPem(clientcert);

    resolve(pem);
    });
};

module.exports = {init:init, createClientCert:createClientCert, getRootCert:getRootCert};

const selfsigned = require('selfsigned');
const forge = require('node-forge');
const jsonfile = require('jsonfile');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'databox' }];
const config = { days: 365, keySize: 2048, days: 3650, algorithm: 'sha256' };
let rootPems;

const certPath = './certs/';
const devCertPath = './certs/certs.json';
const devCAPath = './certs/containerManager.crt';

//Generate the CM root cert at startup.
const init = function() {
    return new Promise( (resolve, reject) =>  {

        jsonfile.readFile(devCertPath, function (err, obj) {
            
            //return cached certs if we have them and 
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
                
                //Cash the certs in dev mode. These are new certs so display the update instructions and exit.
                jsonfile.writeFileSync(devCertPath, rootPems);
                fs.writeFileSync(devCAPath, rootPems.cert);

                resolve({rootCAcert:rootPems.cert});
            });
        });
            
    });
};

const getRootCert =  function () {
    return rootPems.cert;
};

//based on code extracted from the selfsigned module Licence MIT 
const createClientCert =  function (commonName) {
    

    return new Promise( (resolve, reject) =>  {
        
        var certFullpath = certPath + commonName + ".json";

        jsonfile.readFile(certFullpath, function (err, obj) {
                
            //return cached certs if we have them 
            if(err === null) {
                resolve(obj);
                return;
            }

            function toPositiveHex(hexString){
                var mostSiginficativeHexAsInt = parseInt(hexString[0], 16);
                if (mostSiginficativeHexAsInt < 8){
                    return hexString;
                }

                mostSiginficativeHexAsInt -= 8;
                return mostSiginficativeHexAsInt.toString() + hexString.substring(1);
            }

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

            clientcert.setExtensions([{
                name: 'basicConstraints',
                cA: true
            }, {
                name: 'keyUsage',
                keyCertSign: true,
                digitalSignature: true,
                nonRepudiation: true,
                keyEncipherment: true,
                dataEncipherment: true
            }, {
                name: 'subjectAltName',
                altNames: [
                    {
                        type: 2, // DNS name
                        value: commonName
                    },
                    {
                        type: 2, // DNS name
                        value: 'localhost'
                    }
                ]
            }]);

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
            console.log(certFullpath, commonName);
            jsonfile.writeFileSync(certFullpath, pem);
            
            resolve(pem);
        });
    });
};

module.exports = {init:init, createClientCert:createClientCert, getRootCert:getRootCert};

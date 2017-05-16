/*jshint esversion: 6 */

const selfsigned = require('selfsigned');
const forge = require('node-forge');
const jsonfile = require('jsonfile');
const fs = require('fs');

const DATABOX_DEV = process.env.DATABOX_DEV

const attrs = [{ name: 'commonName', value: 'databox' }];
const config = { days: 365, keySize: 2048, days: 3650, algorithm: 'sha256' };
let rootPems;

const certPath = './certs/';
const devCertPath = '/run/secrets/DATA_BOX_CM_PEM.json';

//Generate the CM root cert at startup.
//If in DEV mode we need to use the same certs at restart because the docker demon has to trust the container manger CA to verify 
//the local registry. If we are not in dev mode then the certs are generated at each restart of the container manger.
const init = function() {
    return new Promise( (resolve, reject) =>  {

        jsonfile.readFile(devCertPath, function (err, obj) {
            
            if(err === null) {
                rootPems = obj;
                resolve({rootCAcert:rootPems.cert});
                return;
            } else {
                reject("[ERROR]" + devCertPath + " not found");
            }

        });
            
    });
};

const getRootCert =  function () {
    return rootPems.cert;
};

//based on code extracted from the selfsigned module Licence MIT 
const createClientCert =  async function (commonName) {
    
    function toPositiveHex(hexString){
    let mostSiginficativeHexAsInt = parseInt(hexString[0], 16);
    if (mostSiginficativeHexAsInt < 8){
        return hexString;
    }

    mostSiginficativeHexAsInt -= 8;
        return mostSiginficativeHexAsInt.toString() + hexString.substring(1);
    }
    
    return new Promise( async (resolve, reject) =>  {
        
        let certFullpath = certPath + commonName + '.json';

        let pki = forge.pki;
        pem = {};

        let clientkeys = forge.pki.rsa.generateKeyPair(2048);
        let clientcert = forge.pki.createCertificate();
        clientcert.serialNumber = toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9)));
        clientcert.validity.notBefore = new Date();
        clientcert.validity.notAfter = new Date();
        clientcert.validity.notAfter.setFullYear(clientcert.validity.notBefore.getFullYear() + 10);

        let clientAttrs = [{ name: 'commonName', value: commonName }];

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
        resolve(JSON.stringify(pem));
    });
};

module.exports = {init:init, createClientCert:createClientCert, getRootCert:getRootCert};

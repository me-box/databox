var selfsigned = require('selfsigned');
var forge = require('node-forge');


var attrs = [{ name: 'commonName', value: 'databox' }];
var config = { days: 365, keySize: 2048, days: 3650, algorithm: 'sha256' };
var rootPems;

//Generate the CM root cert at startup
var init = function() {
    return new Promise( (resolve, reject) =>  {
        selfsigned.generate(attrs, config, function (err, pems) {
            if(err) {
                reject(err);
            }
            rootPems = pems;
            resolve({rootCAcert:rootPems.cert});
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

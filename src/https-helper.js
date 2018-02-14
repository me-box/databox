const selfsigned = require('selfsigned');
const forge = require('node-forge');
const jsonfile = require('jsonfile');
const fs = require('fs');

const attrs = [
	{name: 'commonName', value: 'Databox'},
	{name: 'organizationName', value: 'University of Nottingham'},
	{name: 'countryName', value: 'UK'},
	{shortName: 'ST', value: 'Nottinghamshire'},
	{name: 'localityName', value: 'Nottingham'},
	{shortName: 'OU', value: 'Mixed Reality Lab'}
];
const config = {days: 365, keySize: 2048, algorithm: 'sha256'};
let rootPems;

const certPath = './certs/';
const devCertPath = certPath + 'certs.json';
const devPemCertPath = certPath + 'rootCert.pem';
const devDerCertPath = certPath + 'rootCert.der';
const devCAPath = certPath + 'rootCert.crt';

//Generate the CM root cert at startup.
const init = function () {
	return new Promise((resolve, reject) => {

		fs.readFile(devPemCertPath, function (err, obj) {

			//return cached certs if we have them and
			if (err === null) {
				rootPems = obj;
				resolve({rootCAcert: rootPems.cert});
				return;
			}

			selfsigned.generate(attrs, config, function (err, pems) {
				if (err) {
					reject(err);
				}

				rootPems = pems;

				// Delete cert directory if root certs are re-created,
				// since all other cert need to be recreated too
				if(fs.existsSync(certPath)) {
					fs.rmdirSync(certPath);
				}
				fs.mkdirSync(certPath);

				//Cash the certs in dev mode. These are new certs so display the update instructions and exit.
				jsonfile.writeFileSync(devCertPath, rootPems);

				fs.writeFileSync(devPemCertPath, rootPems.private + rootPems.public + rootPems.cert);
				fs.writeFileSync(devCAPath, rootPems.cert);

				const cert = forge.pki.certificateFromPem(rootPems.cert);
				const asn = forge.pki.certificateToAsn1(cert);
				const der = forge.asn1.toDer(asn).getBytes();

				fs.writeFileSync(devDerCertPath, der, 'binary');

				resolve({rootCAcert: rootPems.cert});
			});
		});
	});
};

const getRootCert = function () {
	return rootPems.cert;
};

//based on code extracted from the selfsigned module Licence MIT
const createClientCert = function (commonName, ips) {

	return new Promise((resolve, reject) => {

		const certFullpath = certPath + commonName + ".json";
		const certPemFullpath = certPath + commonName + ".pem";

		fs.readFile(certPemFullpath, function (err, data) {

			//return cached certs if we have them
			if (err === null) {
				resolve(data);
				return;
			}

			function toPositiveHex(hexString) {
				let mostSiginficativeHexAsInt = parseInt(hexString[0], 16);
				if (mostSiginficativeHexAsInt < 8) {
					return hexString;
				}

				mostSiginficativeHexAsInt -= 8;
				return mostSiginficativeHexAsInt.toString() + hexString.substring(1);
			}

			const clientkeys = forge.pki.rsa.generateKeyPair({bits: 2048});
			const clientcert = forge.pki.createCertificate();
			clientcert.serialNumber = toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9)));
			clientcert.validity.notBefore = new Date();
			clientcert.validity.notAfter = new Date();
			clientcert.validity.notAfter.setFullYear(clientcert.validity.notBefore.getFullYear() + 10);

			const clientAttrs = [
				{name: 'commonName', value: commonName},
				{name: 'organizationName', value: 'University of Nottingham'},
				{name: 'countryName', value: 'UK'},
				{shortName: 'ST', value: 'Nottinghamshire'},
				{name: 'localityName', value: 'Nottingham'},
				{shortName: 'OU', value: 'Mixed Reality Lab'}
			];

			clientcert.setSubject(clientAttrs);
			// Set the issuer to the parent key
			clientcert.setIssuer(attrs);

			const altNames = [
				{
					type: 2, // DNS name
					value: commonName
				},
				{
					type: 2, // DNS name
					value: 'localhost'
				}
			];

			if (ips) {
				for (const ip of ips) {
					altNames.push({
						type: 7,
						ip: ip
					})
				}
			}

			clientcert.setExtensions([{
				name: 'basicConstraints',
				cA: false
			}, {
				name: 'keyUsage',
				keyCertSign: true,
				digitalSignature: true,
				nonRepudiation: true,
				keyEncipherment: true,
				dataEncipherment: true
			}, {
				name: 'subjectAltName',
				altNames: altNames
			}]);

			clientcert.publicKey = clientkeys.publicKey;

			// Sign client cert with root cert
			try {
				clientcert.sign(forge.pki.privateKeyFromPem(rootPems.private), forge.md.sha256.create());
			} catch (e) {
				reject("ERROR", e);
			}
			const pem = {
				clientprivate: forge.pki.privateKeyToPem(clientkeys.privateKey),
				clientpublic: forge.pki.publicKeyToPem(clientkeys.publicKey),
				clientcert: forge.pki.certificateToPem(clientcert)
			};
			console.log(certPemFullpath, commonName);
			jsonfile.writeFileSync(certFullpath, pem);
			fs.writeFileSync(certPemFullpath, pem.clientprivate + pem.clientpublic + pem.clientcert);
			resolve(pem);
		});
	});
};

module.exports = {init: init, createClientCert: createClientCert};

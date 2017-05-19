const Config = require('./config.json');
const os = require('os');
const crypto = require('crypto');
const jsonfile = require('jsonfile');
const fs = require('fs');

const Docker = require('dockerode');
const docker = new Docker();

const ip = '127.0.0.1';

//ARCH to append -arm to the end of a container name if running on arm
var ARCH = '';
if (process.arch == 'arm') {
	ARCH = '-arm';
};

const certPath = './certs/';

const generateArbiterToken = function (name) {

	let fullpath = certPath + 'arbiterToken-' + name + ARCH;

	return new Promise((resolve, reject) => {

		fs.readFile(fullpath, function (err, obj) {
            
            //return cached certs if we have them and 
            if(err === null) {
                resolve(obj);
                return;
            }
	
			crypto.randomBytes(32, function (err, buffer) {
				if (err) reject(err);
				var token = buffer.toString('base64');
				fs.writeFileSync(fullpath, token);
				resolve(token);
			});
		});
	});
};
exports.generateArbiterToken = generateArbiterToken;

//Pull latest image from any repo defaults to dockerIO
const pullDockerIOImage = function (imageName) {
	return new Promise((resolve, reject) => {
		const parts = imageName.split(':');
		const name = parts[0];
		const version = parts[1];
		console.log('[Pulling Image] ' + imageName );
		dockerImagePull(imageName, resolve,reject);
	});
};

//Pull latest image from Config.registryUrl
const pullImage = function (imageName) {
	return new Promise((resolve, reject) => {
		const parts = imageName.split(':');
		const name = parts[0];
		const version = parts[1];
		console.log('[Pulling Image] ' + imageName );
		dockerImagePull(Config.registryUrl + "/" + imageName, resolve,reject);
	});
};
exports.pullImage = pullImage;

const dockerImagePull = function (image,resolve,reject) {
	docker.pull(image, (err, stream) => {
			if (err) {
				reject(err);
				return;
			}
			//stream.pipe(process.stdout);
			docker.modem.followProgress(stream, (err, output) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(";->");
			});
		});
};

const updateImage = function (organization, imageName, targetReg) {
	return new Promise((resolve, reject)=>{
		const targetImage = targetReg + '/' + imageName  + ARCH;
		const srcImage = organization + '/' + imageName  + ARCH + ':latest';

		pullDockerIOImage(targetImage)
		.then(()=>{
			resolve();
		})
		.catch((err)=>{
			console.log("[Seeding]" + srcImage + ' to ' + targetImage);
			//try and seed the image form the organization docker hub
			pullDockerIOImage(srcImage)
			.then(()=>{
				return docker.getImage(srcImage);
			})
			.then((img)=>{
				return img.tag({repo: targetImage});
			})
			.then((data)=>{
				console.log("[Seeding] successful " + srcImage + ' to ' + targetImage);
				resolve();
			})
			.catch((err)=>{
				console.log("[Seeding] FAILED " + srcImage + ' to ' + targetImage,err);
				reject(err);
			});
		});

	});
};
exports.updateImage = updateImage;

